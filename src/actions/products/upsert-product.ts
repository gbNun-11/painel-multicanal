"use server";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/src/db";
import { insurersTable, productsTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import upsertProductSchema from "@/src/schemas/product/upsertProductSchema";
import { isDatabaseErrorCode } from "@/src/utils/database-errors";

export const upsertProductAction = adminActionClient
  .inputSchema(upsertProductSchema)
  .action(async ({ parsedInput }) => {
    const name = parsedInput.name.trim();

    const [insurer] = await db
      .select({
        id: insurersTable.id,

        status: insurersTable.status,
      })
      .from(insurersTable)
      .where(eq(insurersTable.id, parsedInput.insurerId))
      .limit(1);

    if (!insurer) {
      throw new Error("Seguradora não encontrada.");
    }

    if (insurer.status !== "ativo") {
      throw new Error(
        "Não é possível cadastrar ou alterar produtos de uma seguradora inativa.",
      );
    }

    if (parsedInput.id) {
      const [existingProduct] = await db
        .select({
          id: productsTable.id,

          insurerId: productsTable.insurerId,
        })
        .from(productsTable)
        .where(eq(productsTable.id, parsedInput.id))
        .limit(1);

      if (!existingProduct) {
        throw new Error("Produto não encontrado.");
      }

      if (existingProduct.insurerId !== parsedInput.insurerId) {
        throw new Error("Não é permitido alterar a seguradora de um produto.");
      }
    }

    const duplicateCondition = parsedInput.id
      ? and(
          eq(productsTable.insurerId, parsedInput.insurerId),
          eq(productsTable.name, name),
          ne(productsTable.id, parsedInput.id),
        )
      : and(
          eq(productsTable.insurerId, parsedInput.insurerId),
          eq(productsTable.name, name),
        );

    const [duplicateProduct] = await db
      .select({
        id: productsTable.id,
      })
      .from(productsTable)
      .where(duplicateCondition)
      .limit(1);

    if (duplicateProduct) {
      throw new Error("Já existe um produto com este nome para a seguradora.");
    }

    try {
      if (parsedInput.id) {
        const [updatedProduct] = await db
          .update(productsTable)
          .set({
            name,

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

          mode: "updated" as const,

          id: updatedProduct.id,
        };
      }

      const [createdProduct] = await db
        .insert(productsTable)
        .values({
          insurerId: parsedInput.insurerId,

          name,
        })
        .returning({
          id: productsTable.id,
        });

      if (!createdProduct) {
        throw new Error("Não foi possível criar o produto.");
      }

      return {
        success: true,
      };
    } catch (error) {
      if (isDatabaseErrorCode(error, "23505")) {
        throw new Error(
          "Já existe um produto com este nome para a seguradora.",
        );
      }

      throw error;
    }
  });
