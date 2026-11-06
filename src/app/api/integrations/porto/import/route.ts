import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/src/db";
import {
  clientsTable,
  opportunitiesTable,
  productCodesTable,
} from "@/src/db/schema";
import { adaptPortoOpportunity } from "@/src/integrations/porto/adapter";
import { getPortoOpportunityExternalId } from "@/src/integrations/porto/identity";
import { portoOpportunitySchema } from "@/src/integrations/porto/schema";
import { ingestOpportunity } from "@/src/services/opportunities/ingest-opportunity";
import { authorizePortoOperator } from "@/src/services/porto/authorize-porto-operator";
import { isAuthorizedPortoJsonPost } from "@/src/services/porto/check-porto-json-origin";
import {
  batchDigest,
  importBatchSchema,
  parsePortoResponse,
  readPortoBatchBody,
  sanitizePortoSourcePayload,
} from "@/src/services/porto/porto-batch";
import { resolvePortoMultichannelContext } from "@/src/services/porto/resolve-porto-multichannel-context";
import { resolveDocument } from "@/src/utils/documents";

export const runtime = "nodejs";

const overrideSchema = z
  .object({
    salesModelOverride: z.literal("CONTINGENCIA").optional(),
  })
  .passthrough();

const digestWithOverride = (digest: string, override?: "CONTINGENCIA") =>
  override === "CONTINGENCIA"
    ? createHash("sha256")
        .update(`INRI_PORTO_SALES_MODEL_V1:${digest}:CONTINGENCIA`)
        .digest("hex")
    : digest;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

type ImportItemStatus =
  "criado" | "existente" | "invalido" | "conflito" | "erro" | "ignorado";

interface ImportedItem {
  index: number;
  externalId: string | null;
  status: ImportItemStatus;
  message: string;
}

/**
 * Resolve a variação dentro da seguradora E do produto lógico do multicanal.
 * Códigos podem se repetir entre AUTOMOVEL e MOTO.
 * Nunca escolhe uma variação arbitrariamente quando houver ambiguidade.
 */
const resolveProductCodeId = async (input: {
  insurerId: string;
  productId: string;
  code: string;
  portoName: string | null;
}): Promise<string> => {
  const code = input.code.trim().toUpperCase();
  if (!code) {
    throw new Error("Código do produto ausente na oportunidade Porto.");
  }

  const mappings = await db
    .select({
      id: productCodesTable.id,
      name: productCodesTable.name,
    })
    .from(productCodesTable)
    .where(
      and(
        eq(productCodesTable.insurerId, input.insurerId),
        eq(productCodesTable.productId, input.productId),
        eq(productCodesTable.code, code),
        eq(productCodesTable.status, "ativo"),
      ),
    );

  if (mappings.length === 0) {
    throw new Error(`Código ${code} sem variação cadastrada para o produto.`);
  }
  if (mappings.length === 1) {
    return mappings[0].id;
  }

  const normalizeName = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");
  const portoName = input.portoName?.trim();
  const matches = portoName
    ? mappings.filter(
        ({ name }) => normalizeName(name) === normalizeName(portoName),
      )
    : [];

  if (matches.length !== 1) {
    throw new Error(
      `Código ${code} possui ${mappings.length} variações possíveis; ` +
        "nome informado pela Porto não identifica uma única variação.",
    );
  }
  return matches[0].id;
};

export async function POST(request: NextRequest) {
  if (!isAuthorizedPortoJsonPost(request)) {
    return json(
      { error: "Origem não autorizada ou Content-Type inválido." },
      403,
    );
  }

  const operator = await authorizePortoOperator(request);
  if (!operator.authorized) {
    return json(
      { error: "Importação reservada ao administrativo autenticado." },
      operator.status,
    );
  }

  let body: unknown;
  try {
    body = await readPortoBatchBody(request);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && error.message === "payload_too_large"
            ? "Lote excedeu 4 MB; reduza os registros por página."
            : "JSON inválido.",
      },
      400,
    );
  }

  const validatedOverride = overrideSchema.safeParse(body);
  if (!validatedOverride.success) {
    return json({ error: "Classificação de lote inválida." }, 400);
  }
  const salesModelOverride = validatedOverride.data.salesModelOverride;
  const batchBody = { ...(body as Record<string, unknown>) };
  delete batchBody.salesModelOverride;

  const parsed = importBatchSchema.safeParse(batchBody);
  if (!parsed.success) {
    return json(
      { error: "Confirmação ou parâmetros de importação inválidos." },
      400,
    );
  }
  const input = parsed.data;
  if (
    digestWithOverride(batchDigest(input), salesModelOverride) !==
    input.previewDigest
  ) {
    return json(
      {
        error:
          "Os dados ou a classificação mudaram depois da prévia. Consulte novamente.",
      },
      409,
    );
  }

  let portoResponse: ReturnType<typeof parsePortoResponse>;
  try {
    portoResponse = parsePortoResponse(input.payload);
  } catch {
    return json(
      {
        error:
          "Resposta Porto inválida ou acima do limite de 100 oportunidades.",
      },
      422,
    );
  }

  let context: Awaited<ReturnType<typeof resolvePortoMultichannelContext>>;
  try {
    context = await resolvePortoMultichannelContext({
      portoCpf: input.portoCpf,
      portoSusepCode: input.portoSusepCode,
    });
  } catch {
    return json(
      { error: "CPF/SUSEP não possui configuração multicanal válida." },
      422,
    );
  }

  const selected = new Set(input.selectedExternalIds);
  if (selected.size !== input.selectedExternalIds.length) {
    return json({ error: "Existem IDs duplicados na confirmação." }, 400);
  }
  const idsInPayload = new Set(
    portoResponse.itens.map(getPortoOpportunityExternalId).filter(Boolean),
  );
  if ([...selected].some((id) => !idsInPayload.has(id))) {
    return json(
      { error: "A confirmação contém oportunidade ausente do lote." },
      400,
    );
  }

  const results: ImportedItem[] = [];
  const processedIds = new Set<string>();
  let createdClients = 0;

  for (const [index, raw] of portoResponse.itens.entries()) {
    const externalId = getPortoOpportunityExternalId(raw);

    if (!externalId || !selected.has(externalId)) {
      results.push({
        index,
        externalId,
        status: "ignorado",
        message: "Não selecionado para importação.",
      });
      continue;
    }
    if (processedIds.has(externalId)) {
      results.push({
        index,
        externalId,
        status: "conflito",
        message: "ID externo repetido neste lote.",
      });
      continue;
    }
    processedIds.add(externalId);

    const opportunityResult = portoOpportunitySchema.safeParse(raw);
    if (!opportunityResult.success) {
      results.push({
        index,
        externalId,
        status: "invalido",
        message: "Estrutura do registro Porto inválida.",
      });
      continue;
    }
    const opportunity = opportunityResult.data;
    const document = resolveDocument(opportunity.cpfCnpjCliente);
    if (!document || !opportunity.nomeCliente?.trim()) {
      results.push({
        index,
        externalId,
        status: "invalido",
        message: "Documento ou nome de cliente inválido.",
      });
      continue;
    }

    try {
      // Se a oportunidade já existe, NÃO alteramos distribuição/status/dados cadastrais.
      // A segunda validação protege contra alterações entre a prévia e o clique de confirmação.
      const [existing] = await db
        .select({
          clientId: opportunitiesTable.clientId,
          susepId: opportunitiesTable.susepId,
          clientDocument: clientsTable.document,
        })
        .from(opportunitiesTable)
        .innerJoin(
          clientsTable,
          eq(opportunitiesTable.clientId, clientsTable.id),
        )
        .where(
          and(
            eq(
              opportunitiesTable.enterpriseInsurerId,
              context.enterpriseInsurerId,
            ),
            eq(opportunitiesTable.externalSource, "PORTO"),
            eq(opportunitiesTable.externalId, externalId),
          ),
        )
        .limit(1);

      if (existing) {
        if (
          existing.clientDocument !== document.document ||
          existing.susepId !== context.susepId
        ) {
          results.push({
            index,
            externalId,
            status: "conflito",
            message: "O ID externo pertence a outro cliente ou SUSEP.",
          });
        } else {
          results.push({
            index,
            externalId,
            status: "existente",
            message: "Já cadastrado; sem alterações.",
          });
        }
        continue;
      }

      // A Porto envia o código externo; o UUID vem do nosso catálogo.
      const sourceCode = opportunity.codigoProduto?.trim().toUpperCase();
      if (!sourceCode) {
        throw new Error("Oportunidade Porto sem código do produto.");
      }

      const productCodeId = await resolveProductCodeId({
        insurerId: context.insurerId,
        productId: context.productId,
        code: sourceCode,
        portoName: opportunity.nomeProduto ?? null,
      });

      const converted = adaptPortoOpportunity(opportunity, {
        enterpriseInsurerId: context.enterpriseInsurerId,
        susepId: context.susepId,
        externalId,
        productCodeId,
        product: context.productName,
        ...(salesModelOverride ? { salesModelOverride } : {}),
      });
      converted.opportunity.sourcePayload = {
        ...(sanitizePortoSourcePayload(opportunity) as Record<string, unknown>),
        _integration: {
          source: "PORTO_MULTICANAL",
          filter: input.opportunityStatus,
          ...(salesModelOverride ? { salesModelOverride } : {}),
          multichannelUserId: context.userId,
          importedByUserId: operator.operatorId,
          importedAt: new Date().toISOString(),
        },
      };

      // resolveClient e ingestOpportunity usam a MESMA transação por oportunidade.
      const result = await ingestOpportunity(converted);
      if (result.opportunityCreated) {
        createdClients += Number(result.clientCreated);
        results.push({
          index,
          externalId,
          status: "criado",
          message: "Cliente/oportunidade vinculados com sucesso.",
        });
      } else {
        results.push({
          index,
          externalId,
          status: "existente",
          message: "Já importado por outra operação; sem duplicar.",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[PORTO IMPORT DEV] Falha na oportunidade", {
        index: index + 1,
        externalId,
        message,
        stack: error instanceof Error ? error.stack : undefined,
      });
      results.push({
        index,
        externalId,
        status: "erro",
        message:
          "Falha ao importar. Consulte a mensagem [PORTO IMPORT DEV] no terminal do servidor.",
      });
    }
  }

  const count = (status: ImportItemStatus) =>
    results.filter((item) => item.status === status).length;
  return json({
    mode: "import",
    operatorId: operator.operatorId,
    multichannelUserId: context.userId,
    opportunityStatus: input.opportunityStatus,
    ...(salesModelOverride ? { salesModel: salesModelOverride } : {}),
    clientsCreated: createdClients,
    opportunitiesCreated: count("criado"),
    opportunitiesExisting: count("existente"),
    invalid: count("invalido"),
    conflicts: count("conflito"),
    failed: count("erro"),
    ignored: count("ignorado"),
    items: results,
  });
}
