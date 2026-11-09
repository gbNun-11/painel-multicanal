import { createHash } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/src/db";
import { clientsTable, opportunitiesTable } from "@/src/db/schema";
import { getPortoOpportunityExternalId } from "@/src/integrations/porto/identity";
import {
  portoOpportunitiesResponseSchema,
  portoOpportunitySchema,
} from "@/src/integrations/porto/schema";
import { authorizePortoOperator } from "@/src/services/porto/authorize-porto-operator";
import { isAuthorizedPortoJsonPost } from "@/src/services/porto/check-porto-json-origin";
import { batchDigest } from "@/src/services/porto/porto-batch";
import { resolvePortoMultichannelContext } from "@/src/services/porto/resolve-porto-multichannel-context";
import { resolveDocument } from "@/src/utils/documents";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_ITEMS_PER_PREVIEW = 100;
const EXTERNAL_SOURCE = "PORTO";

const digestWithOverride = (digest: string, override?: "CONTINGENCIA") =>
  override === "CONTINGENCIA"
    ? createHash("sha256")
        .update(`INRI_PORTO_SALES_MODEL_V1:${digest}:CONTINGENCIA`)
        .digest("hex")
    : digest;

const inputSchema = z
  .object({
    portoCpf: z.string().trim().min(1).max(20),
    portoSusepCode: z.string().trim().min(3).max(16),
    opportunityStatus: z.enum(["7", "1"]),
    salesModelOverride: z.literal("CONTINGENCIA").optional(),
    payload: z.unknown(),
  })
  .strict();

type PreviewStatus = "novo" | "existente" | "invalido" | "conflito";

interface PreviewItem {
  index: number;
  externalId: string | null;
  status: PreviewStatus;
  clientExists: boolean | null;
  message: string;
}

interface Candidate {
  index: number;
  externalId: string;
  document: string;
}

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const describePortoSchemaIssues = (
  issues: ReadonlyArray<{ path: PropertyKey[]; code: string }>,
) => {
  const fields = issues.slice(0, 4).map((issue) => {
    const field = issue.path.length
      ? issue.path.map(String).join(".")
      : "registro";
    const label =
      issue.code === "invalid_type"
        ? "ausente ou com tipo incompatível"
        : issue.code === "invalid_value" || issue.code === "invalid_enum_value"
          ? "valor incompatível com o schema"
          : `rejeitado pelo schema (${issue.code})`;
    return `${field}: ${label}`;
  });
  const more =
    issues.length > 4 ? ` (+${issues.length - 4} outro(s) campo(s))` : "";
  return `Estrutura Porto inválida: ${fields.join("; ")}${more}.`;
};

const describeDocumentIssue = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (![11, 14].includes(digits.length)) {
    return `CPF/CNPJ do cliente com ${digits.length} dígitos; esperado 11 ou 14.`;
  }
  return "CPF/CNPJ do cliente com dígitos verificadores inválidos.";
};

const readBoundedJson = async (request: NextRequest): Promise<unknown> => {
  if (!request.body) {
    throw new Error("empty_body");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytesRead += chunk.value.byteLength;
    if (bytesRead > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error("payload_too_large");
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  text += decoder.decode();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("invalid_json");
  }
};

export async function POST(request: NextRequest) {
  if (!isAuthorizedPortoJsonPost(request)) {
    return json({ error: "Origem não autorizada ou JSON inválido." }, 403);
  }

  const operator = await authorizePortoOperator(request);
  if (!operator.authorized) {
    return json(
      { error: "Operador administrativo não autorizado." },
      operator.status,
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && error.message === "payload_too_large"
            ? "Lote acima de 4 MB. Reduza os registros por página."
            : "JSON ausente ou inválido.",
      },
      error instanceof Error && error.message === "payload_too_large"
        ? 413
        : 400,
    );
  }

  const parsedInput = inputSchema.safeParse(body);
  if (!parsedInput.success) {
    return json({ error: "Parâmetros de consulta inválidos." }, 400);
  }

  const parsedResponse = portoOpportunitiesResponseSchema.safeParse(
    parsedInput.data.payload,
  );
  if (!parsedResponse.success) {
    return json(
      { error: "Formato da resposta Porto incompatível com o schema atual." },
      422,
    );
  }

  const { salesModelOverride, ...batchInput } = parsedInput.data;
  const portoResponse = parsedResponse.data;
  if (portoResponse.itens.length > MAX_ITEMS_PER_PREVIEW) {
    return json(
      { error: "Prévia limitada a 100 oportunidades por chamada." },
      413,
    );
  }

  let context: Awaited<ReturnType<typeof resolvePortoMultichannelContext>>;
  try {
    context = await resolvePortoMultichannelContext({
      portoCpf: parsedInput.data.portoCpf,
      portoSusepCode: parsedInput.data.portoSusepCode,
    });
  } catch {
    return json(
      { error: "CPF/SUSEP sem vínculo multicanal ativo e único." },
      422,
    );
  }

  const items: PreviewItem[] = [];
  const candidates: Candidate[] = [];
  const seenIds = new Set<string>();

  for (const [index, raw] of portoResponse.itens.entries()) {
    const externalId = getPortoOpportunityExternalId(raw);
    const parsedOpportunity = portoOpportunitySchema.safeParse(raw);

    const invalid = (message: string) =>
      items.push({
        index,
        externalId,
        status: "invalido" as const,
        clientExists: null,
        message,
      });

    if (!externalId) {
      invalid(
        "Identificador ausente: idOportunidadeSql e idOportunidadeDynamics não informados.",
      );
      continue;
    }

    if (!parsedOpportunity.success) {
      invalid(describePortoSchemaIssues(parsedOpportunity.error.issues));
      continue;
    }

    const document = resolveDocument(parsedOpportunity.data.cpfCnpjCliente);
    if (!document) {
      invalid(describeDocumentIssue(parsedOpportunity.data.cpfCnpjCliente));
      continue;
    }

    if (!parsedOpportunity.data.nomeCliente?.trim()) {
      invalid("Nome do cliente ausente ou vazio.");
      continue;
    }

    if (seenIds.has(externalId)) {
      items.push({
        index,
        externalId,
        status: "conflito",
        clientExists: null,
        message: "Identificador externo repetido no lote recebido.",
      });
      continue;
    }

    seenIds.add(externalId);
    candidates.push({ index, externalId, document: document.document });
  }

  if (candidates.length > 0) {
    const externalIds = candidates.map((item) => item.externalId);
    const documents = [...new Set(candidates.map((item) => item.document))];

    // Somente SELECT: nenhum registro é criado ou atualizado nesta etapa.
    const [existingOpportunities, existingClients] = await Promise.all([
      db
        .select({
          externalId: opportunitiesTable.externalId,
          clientId: opportunitiesTable.clientId,
          susepId: opportunitiesTable.susepId,
        })
        .from(opportunitiesTable)
        .where(
          and(
            eq(
              opportunitiesTable.enterpriseInsurerId,
              context.enterpriseInsurerId,
            ),
            eq(opportunitiesTable.externalSource, EXTERNAL_SOURCE),
            inArray(opportunitiesTable.externalId, externalIds),
          ),
        ),
      db
        .select({
          id: clientsTable.id,
          document: clientsTable.document,
        })
        .from(clientsTable)
        .where(inArray(clientsTable.document, documents)),
    ]);

    const opportunityByExternalId = new Map(
      existingOpportunities.map((row) => [row.externalId, row]),
    );
    const clientByDocument = new Map(
      existingClients.map((row) => [row.document, row]),
    );

    for (const candidate of candidates) {
      const foundOpportunity = opportunityByExternalId.get(
        candidate.externalId,
      );
      const foundClient = clientByDocument.get(candidate.document);
      const differentClient = Boolean(
        foundOpportunity &&
        (!foundClient ||
          foundOpportunity.clientId !== foundClient.id ||
          foundOpportunity.susepId !== context.susepId),
      );

      let status: PreviewStatus;
      let message: string;
      if (differentClient) {
        status = "conflito";
        message =
          "O identificador externo já pertence a outro cliente ou SUSEP.";
      } else if (foundOpportunity) {
        status = "existente";
        message = "Oportunidade já cadastrada; não deverá ser duplicada.";
      } else {
        status = "novo";
        message = foundClient
          ? "Cliente já cadastrado; oportunidade ainda não existe."
          : "Cliente e oportunidade ainda não cadastrados.";
      }

      items.push({
        index: candidate.index,
        externalId: candidate.externalId,
        status,
        clientExists: Boolean(foundClient),
        message,
      });
    }
  }

  items.sort((a, b) => a.index - b.index);
  const count = (status: PreviewStatus) =>
    items.filter((item) => item.status === status).length;

  return json({
    mode: "preview_only",
    previewDigest: digestWithOverride(
      batchDigest(batchInput),
      salesModelOverride,
    ),
    persisted: false,
    operatorId: operator.operatorId,
    multichannelUserId: context.userId,
    context: {
      enterpriseInsurerId: context.enterpriseInsurerId,
      susepId: context.susepId,
      susepCode: context.susepCode,
      productId: context.productId,
      productName: context.productName,
      ...(salesModelOverride ? { salesModel: salesModelOverride } : {}),
    },
    opportunityStatus: parsedInput.data.opportunityStatus,
    totalReceived: portoResponse.itens.length,
    totalPaginacao: portoResponse.totalPaginacao,
    counts: {
      novos: count("novo"),
      existentes: count("existente"),
      invalidos: count("invalido"),
      conflitos: count("conflito"),
    },
    items,
  });
}
