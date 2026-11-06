"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  insurersTable,
  productCodesTable,
  productsTable,
} from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import changeProductCodeStatusSchema from "@/src/schemas/product/changeProductCodeStatusSchema";

export const changeProductCodeStatusAction = adminActionClient
  .inputSchema(changeProductCodeStatusSchema)
  .action(async ({ parsedInput }) => {
    const [productCode] = await db
      .select({
        id: productCodesTable.id,

        productStatus: productsTable.status,

        insurerStatus: insurersTable.status,
      })
      .from(productCodesTable)
      .innerJoin(
        productsTable,
        eq(productCodesTable.productId, productsTable.id),
      )
      .innerJoin(
        insurersTable,
        eq(productCodesTable.insurerId, insurersTable.id),
      )
      .where(eq(productCodesTable.id, parsedInput.id))
      .limit(1);

    if (!productCode) {
      throw new Error("Código do produto não encontrado.");
    }

    if (parsedInput.status === "ativo") {
      if (productCode.insurerStatus !== "ativo") {
        throw new Error(
          "Não é possível ativar um código de uma seguradora inativa.",
        );
      }

      if (productCode.productStatus !== "ativo") {
        throw new Error("Ative o produto antes de ativar este código.");
      }
    }

    const [updatedProductCode] = await db
      .update(productCodesTable)
      .set({
        status: parsedInput.status,

        updatedAt: new Date(),
      })
      .where(eq(productCodesTable.id, parsedInput.id))
      .returning({
        id: productCodesTable.id,
      });

    if (!updatedProductCode) {
      throw new Error("Código do produto não encontrado.");
    }

    return {
      success: true,
    };
  });
