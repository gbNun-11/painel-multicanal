import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  multichannelAssignmentsTable,
  productsTable,
  susepsTable,
  usersTable,
} from "@/src/db/schema";
import { resolveDocument } from "@/src/utils/documents";

export interface ResolvePortoMultichannelContextInput {
  portoCpf: string;
  portoSusepCode: string;
}

export interface ResolvedPortoMultichannelContext {
  userId: string;
  userName: string;
  enterpriseInsurerId: string;
  insurerId: string;
  susepId: string;
  susepCode: string;
  productId: string;
  productName: string;
}

export const resolvePortoMultichannelContext = async ({
  portoCpf,
  portoSusepCode,
}: ResolvePortoMultichannelContextInput): Promise<ResolvedPortoMultichannelContext> => {
  const document = resolveDocument(portoCpf);
  const susepCode = portoSusepCode.trim().toUpperCase();

  if (
    !document ||
    document.personType !== "PF" ||
    !/^\d{11}$/.test(document.document) ||
    !/^[A-Z0-9]{3,16}$/.test(susepCode)
  ) {
    throw new Error("CPF ou SUSEP de origem inválidos.");
  }

  const assignments = await db
    .select({
      userId: usersTable.id,
      userName: usersTable.name,
      userCpf: usersTable.cpf,
      enterpriseInsurerId: enterpriseInsurersTable.id,
      insurerId: enterpriseInsurersTable.insurerId,
      susepId: susepsTable.id,
      susepCode: susepsTable.code,
      productId: productsTable.id,
      productName: productsTable.name,
    })
    .from(multichannelAssignmentsTable)
    .innerJoin(
      usersTable,
      eq(multichannelAssignmentsTable.userId, usersTable.id),
    )
    .innerJoin(
      susepsTable,
      eq(multichannelAssignmentsTable.susepId, susepsTable.id),
    )
    .innerJoin(
      enterpriseInsurersTable,
      eq(susepsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .innerJoin(
      productsTable,
      eq(multichannelAssignmentsTable.productId, productsTable.id),
    )
    .where(
      and(
        // O CPF Porto identifica o colaborador COMERCIAL, não o operador do V2.
        sql`regexp_replace(${usersTable.cpf}, '[^0-9]', '', 'g') = ${document.document}`,
        eq(usersTable.status, "ativo"),
        eq(usersTable.banned, false),
        eq(multichannelAssignmentsTable.status, "ativo"),
        eq(susepsTable.code, susepCode),
        eq(susepsTable.multichannel, true),
        eq(susepsTable.status, "ativo"),
        eq(enterpriseInsurersTable.status, "ativo"),
        eq(productsTable.status, "ativo"),
        eq(productsTable.insurerId, enterpriseInsurersTable.insurerId),
      ),
    )
    .limit(2);

  if (assignments.length === 0) {
    throw new Error("Não há vínculo multicanal ativo para este CPF e SUSEP.");
  }
  if (assignments.length !== 1) {
    throw new Error(
      "Há mais de um vínculo multicanal ativo para este CPF e SUSEP.",
    );
  }

  const assignment = assignments[0];
  if (assignment.userCpf.replace(/\D/g, "") !== document.document) {
    throw new Error("CPF do vínculo comercial diverge do contexto Porto.");
  }
  return {
    userId: assignment.userId,
    userName: assignment.userName,
    enterpriseInsurerId: assignment.enterpriseInsurerId,
    insurerId: assignment.insurerId,
    susepId: assignment.susepId,
    susepCode: assignment.susepCode,
    productId: assignment.productId,
    productName: assignment.productName,
  };
};
