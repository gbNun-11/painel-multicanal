import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { susepsTable, usersTable } from "@/src/db/schema";
import { isValidCpf } from "@/src/utils/documents";

export interface ResolveSusepInput {
  enterpriseInsurerId: string;

  code: string;
}

export interface ResolvedSusep {
  id: string;

  code: string;

  productCode: string;

  product: string;

  brokerUserId: string;

  brokerName: string;

  brokerCpf: string;

  brokerBirthDate: string;
}

const normalizeRequiredText = (value: string, fieldName: string) => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} não informado.`);
  }

  return normalized;
};

export const resolveSusep = async ({
  enterpriseInsurerId,
  code,
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

      productCode: susepsTable.productCode,

      product: susepsTable.product,

      brokerUserId: usersTable.id,

      brokerName: usersTable.name,

      brokerCpf: usersTable.cpf,

      brokerBirthDate: usersTable.birthDate,

      brokerStatus: usersTable.status,
    })
    .from(susepsTable)
    .innerJoin(usersTable, eq(susepsTable.brokerUserId, usersTable.id))
    .where(
      and(
        eq(susepsTable.enterpriseInsurerId, normalizedEnterpriseInsurerId),

        eq(susepsTable.code, normalizedCode),

        eq(susepsTable.status, "ativo"),
      ),
    )
    .limit(1);

  if (!susep) {
    throw new Error(
      `SUSEP ${normalizedCode} não encontrada ou inativa para a empresa/seguradora informada.`,
    );
  }

  if (susep.brokerStatus !== "ativo") {
    throw new Error(
      `A SUSEP ${normalizedCode} está vinculada ao usuário ${susep.brokerName}, mas esse usuário está inativo.`,
    );
  }

  if (!susep.brokerCpf) {
    throw new Error(
      `A SUSEP ${normalizedCode} está vinculada ao usuário ${susep.brokerName}, mas ele não possui CPF cadastrado.`,
    );
  }

  if (!isValidCpf(susep.brokerCpf)) {
    throw new Error(
      `A SUSEP ${normalizedCode} está vinculada ao usuário ${susep.brokerName}, mas o CPF cadastrado é inválido.`,
    );
  }

  if (!susep.brokerBirthDate) {
    throw new Error(
      `A SUSEP ${normalizedCode} está vinculada ao usuário ${susep.brokerName}, mas ele não possui data de nascimento cadastrada.`,
    );
  }

  const productCode = susep.productCode.trim();

  const product = susep.product.trim();

  if (!productCode || !product) {
    throw new Error(
      `A SUSEP ${normalizedCode} não possui produto configurado corretamente.`,
    );
  }

  return {
    id: susep.id,

    code: susep.code,

    productCode,

    product,

    brokerUserId: susep.brokerUserId,

    brokerName: susep.brokerName,

    brokerCpf: susep.brokerCpf,

    brokerBirthDate: susep.brokerBirthDate,
  };
};
