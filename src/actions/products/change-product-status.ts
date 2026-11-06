"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { insurersTable, productsTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import changeProductStatusSchema from "@/src/schemas/product/changeProductStatusSchema";

export const changeProductStatusAction = adminActionClient
  .inputSchema(changeProductStatusSchema)
  .action(async ({ parsedInput }) => {
    const [product] = await db
      .select({
        id: productsTable.id,

        insurerId: productsTable.insurerId,
      })
      .from(productsTable)
      .where(eq(productsTable.id, parsedInput.id))
      .limit(1);

    if (!product) {
      throw new Error("Produto não encontrado.");
    }

    if (parsedInput.status === "ativo") {
      const [insurer] = await db
        .select({
          status: insurersTable.status,
        })
        .from(insurersTable)
        .where(eq(insurersTable.id, product.insurerId))
        .limit(1);

      if (!insurer || insurer.status !== "ativo") {
        throw new Error(
          "Não é possível ativar um produto de uma seguradora inativa.",
        );
      }
    }

    const [updatedProduct] = await db
      .update(productsTable)
      .set({
        status: parsedInput.status,

        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, parsedInput.id))
      .returning({
        id: productsTable.id,
      });

    if (!updatedProduct) {
      throw new Error("Produto não encontrado.");
    }

    return {
      success: true,
    };
  });
