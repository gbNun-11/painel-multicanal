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
}

export type ResolvedSusep =
  | (ResolvedSusepBase & {
      multichannel: false;
    })
  | (ResolvedSusepBase & {
      multichannel: true;

      productId: string;

      productName: string;

      productCodeId: string;

      productCode: string;

      productCodeName: string;

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

  if (!susep.multichannel) {
    return {
      id: susep.id,

      code: susep.code,

      masterSusepId: susep.masterSusepId,

      multichannel: false,
    };
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
      `O produto ${normalizedProductCode} não está configurado como produto ativo da seguradora para a SUSEP multicanal ${normalizedCode}.`,
    );
  }

  const normalizedProductName = normalizeComparisonText(productName);

  let resolvedProduct: (typeof productMappings)[number] | undefined;

  if (normalizedProductName) {
    const nameMatches = productMappings.filter(
      (mapping) =>
        normalizeComparisonText(mapping.productCodeName) ===
        normalizedProductName,
    );

    if (nameMatches.length > 0) {
      const matchingProductIds = new Set(
        nameMatches.map((mapping) => mapping.productId),
      );

      if (matchingProductIds.size === 1) {
        resolvedProduct = nameMatches[0];
      } else {
        throw new Error(
          `O código ${normalizedProductCode} e o produto "${productName}" possuem configuração ambígua na seguradora.`,
        );
      }
    }
  }

  if (!resolvedProduct) {
    const productIds = new Set(
      productMappings.map((mapping) => mapping.productId),
    );

    if (productIds.size === 1) {
      resolvedProduct = productMappings[0];
    }
  }

  if (!resolvedProduct) {
    throw new Error(
      `O código ${normalizedProductCode} possui mais de um produto lógico configurado para a seguradora. Informe uma variante compatível para resolver a oportunidade.`,
    );
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
    id: susep.id,

    code: susep.code,

    masterSusepId: susep.masterSusepId,

    multichannel: true,

    productId: resolvedProduct.productId,

    productName: resolvedProduct.productName,

    productCodeId: resolvedProduct.productCodeId,

    productCode: resolvedProduct.productCode,

    productCodeName: resolvedProduct.productCodeName,

    multichannelUserId: assignment.userId,

    multichannelUserName: assignment.userName,
  };
};
