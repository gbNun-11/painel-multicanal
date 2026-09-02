"use server";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/src/db";
import { enterpriseInsurersTable, susepsTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import createSusepSchema from "@/src/schemas/insurer/susep/createSusepSchema";

export const createSusepAction = adminActionClient
  .inputSchema(createSusepSchema)
  .action(async ({ parsedInput }) => {
    const codes = [
      ...new Set(
        parsedInput.codes
          .split(",")
          .map((code) => code.trim())
          .filter(Boolean),
      ),
    ];

    if (codes.length === 0) {
      throw new Error("Informe pelo menos uma SUSEP válida.");
    }

    const [enterpriseInsurer] = await db
      .select({
        id: enterpriseInsurersTable.id,
      })
      .from(enterpriseInsurersTable)
      .where(eq(enterpriseInsurersTable.id, parsedInput.enterpriseInsurerId))
      .limit(1);

    if (!enterpriseInsurer) {
      throw new Error("Vínculo entre empresa e seguradora não encontrado.");
    }

    const existingSuseps = await db
      .select({
        code: susepsTable.code,
      })
      .from(susepsTable)
      .where(
        and(
          eq(susepsTable.enterpriseInsurerId, parsedInput.enterpriseInsurerId),
          inArray(susepsTable.code, codes),
        ),
      );

    const existingCodes = new Set(existingSuseps.map((susep) => susep.code));

    const newCodes = codes.filter((code) => !existingCodes.has(code));

    if (newCodes.length === 0) {
      throw new Error("Todas as SUSEPs informadas já estão vinculadas.");
    }

    await db.insert(susepsTable).values(
      newCodes.map((code) => ({
        enterpriseInsurerId: parsedInput.enterpriseInsurerId,

        code,
      })),
    );

    return {
      success: true,
      createdCount: newCodes.length,
      ignoredCount: codes.length - newCodes.length,
    };
  });
