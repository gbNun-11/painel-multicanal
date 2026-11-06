import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  multichannelAssignmentsTable,
  productCodesTable,
  productsTable,
  susepsTable,
  usersTable,
} from "@/src/db/schema";

export interface ResolveSusepInput {
  enterpriseInsurerId: string;

  code: string;

  productCode?: string | null;

  productName?: string | null;
}

interface ResolvedSusepBase {
  id: string;
  code: string;
  masterSusepId: string | null;

  productId: string;
  productName: string;
  productCodeId: string;
  productCode: string;
  productCodeName: string;
}

export type ResolvedSusep =
  | (ResolvedSusepBase & { multichannel: false })
  | (ResolvedSusepBase & {
      multichannel: true;
      multichannelUserId: string;
      multichannelUserName: string;
    });

const normalizeRequiredText = (value: string, fieldName: string) => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} não informado.`);
  }

  return normalized;
};

const normalizeComparisonText = (value: string | null | undefined) => {
  const normalized = value
    ?.trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("pt-BR");

  return normalized || null;
};

export const resolveSusep = async ({
  enterpriseInsurerId,
  code,
  productCode,
  productName,
}: ResolveSusepInput): Promise<ResolvedSusep> => {
  const normalizedEnterpriseInsurerId = normalizeRequiredText(
    enterpriseInsurerId,
    "EnterpriseInsurerId",
  );

  const normalizedCode = normalizeRequiredText(
    code,
    "Código SUSEP",
  ).toUpperCase();

  const [susep] = await db
    .select({
      id: susepsTable.id,

      code: susepsTable.code,

      masterSusepId: susepsTable.masterSusepId,

      multichannel: susepsTable.multichannel,

      insurerId: enterpriseInsurersTable.insurerId,
    })
    .from(susepsTable)
    .innerJoin(
      enterpriseInsurersTable,
      eq(susepsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .where(
      and(
        eq(susepsTable.enterpriseInsurerId, normalizedEnterpriseInsurerId),

        eq(susepsTable.code, normalizedCode),

        eq(susepsTable.status, "ativo"),

        eq(enterpriseInsurersTable.status, "ativo"),
      ),
    )
    .limit(1);

  if (!susep) {
    throw new Error(
      `SUSEP ${normalizedCode} não encontrada ou inativa para a empresa/seguradora informada.`,
    );
  }

  const normalizedProductCode = normalizeRequiredText(
    productCode ?? "",
    "Código do produto",
  ).toUpperCase();

  const productMappings = await db
    .select({
      productId: productsTable.id,

      productName: productsTable.name,

      productCodeId: productCodesTable.id,

      productCode: productCodesTable.code,

      productCodeName: productCodesTable.name,
    })
    .from(productCodesTable)
    .innerJoin(productsTable, eq(productCodesTable.productId, productsTable.id))
    .where(
      and(
        eq(productCodesTable.insurerId, susep.insurerId),

        eq(productCodesTable.code, normalizedProductCode),

        eq(productCodesTable.status, "ativo"),

        eq(productsTable.insurerId, susep.insurerId),

        eq(productsTable.status, "ativo"),
      ),
    );

  if (productMappings.length === 0) {
    throw new Error(
      `O código ${normalizedProductCode} não possui variação ativa cadastrada para a seguradora da SUSEP ${normalizedCode}.`,
    );
  }

  const normalizedProductName = normalizeComparisonText(productName);
  let candidates = productMappings;

  if (normalizedProductName) {
    const variantMatches = productMappings.filter(
      (mapping) =>
        normalizeComparisonText(mapping.productCodeName) ===
        normalizedProductName,
    );

    if (variantMatches.length > 0) {
      candidates = variantMatches;
    } else {
      const logicalMatches = productMappings.filter(
        (mapping) =>
          normalizeComparisonText(mapping.productName) ===
          normalizedProductName,
      );
      if (logicalMatches.length > 0) {
        candidates = logicalMatches;
      }
    }
  }

  if (candidates.length !== 1) {
    throw new Error(
      `Código ${normalizedProductCode} ambíguo para a seguradora da SUSEP ${normalizedCode}` +
        ` (nome Porto: ${productName?.trim() || "não informado"};` +
        ` ${candidates.length} variações possíveis).` +
        " Revise o cadastro e a correspondência de nome antes de importar.",
    );
  }

  const [resolvedProduct] = candidates;
  if (!resolvedProduct) {
    throw new Error(
      `Nenhuma variação foi resolvida para o código ${normalizedProductCode}.`,
    );
  }

  const commonResult: ResolvedSusepBase = {
    id: susep.id,
    code: susep.code,
    masterSusepId: susep.masterSusepId,
    productId: resolvedProduct.productId,
    productName: resolvedProduct.productName,
    productCodeId: resolvedProduct.productCodeId,
    productCode: resolvedProduct.productCode,
    productCodeName: resolvedProduct.productCodeName,
  };

  if (!susep.multichannel) {
    return { ...commonResult, multichannel: false };
  }

  const [assignment] = await db
    .select({
      userId: usersTable.id,

      userName: usersTable.name,
    })
    .from(multichannelAssignmentsTable)
    .innerJoin(
      usersTable,
      eq(multichannelAssignmentsTable.userId, usersTable.id),
    )
    .where(
      and(
        eq(multichannelAssignmentsTable.susepId, susep.id),

        eq(multichannelAssignmentsTable.productId, resolvedProduct.productId),

        eq(multichannelAssignmentsTable.status, "ativo"),

        eq(usersTable.status, "ativo"),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new Error(
      `A SUSEP multicanal ${normalizedCode} não possui usuário ativo configurado para o produto ${resolvedProduct.productName}.`,
    );
  }

  return {
    ...commonResult,
    multichannel: true,
    multichannelUserId: assignment.userId,
    multichannelUserName: assignment.userName,
  };
};
