"use server";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  insurersTable,
  productCodesTable,
  productsTable,
} from "@/src/db/schema";
import { ActionError, adminActionClient } from "@/src/lib/safe-action";
import upsertProductCodeSchema from "@/src/schemas/product/upsertProductCodeSchema";
import { isDatabaseErrorCode } from "@/src/utils/database-errors";

export const upsertProductCodeAction = adminActionClient
  .inputSchema(upsertProductCodeSchema)
  .action(async ({ parsedInput }) => {
    const code = parsedInput.code.trim().toUpperCase();

    const name = parsedInput.name.trim();

    const [product] = await db
      .select({
        id: productsTable.id,

        insurerId: productsTable.insurerId,

        status: productsTable.status,

        insurerStatus: insurersTable.status,
      })
      .from(productsTable)
      .innerJoin(insurersTable, eq(productsTable.insurerId, insurersTable.id))
      .where(eq(productsTable.id, parsedInput.productId))
      .limit(1);

    if (!product) {
      throw new ActionError("Produto não encontrado.");
    }

    if (product.insurerStatus !== "ativo") {
      throw new ActionError(
        "Não é possível cadastrar ou alterar códigos de uma seguradora inativa.",
      );
    }

    if (product.status !== "ativo") {
      throw new ActionError(
        "Não é possível cadastrar ou alterar códigos de um produto inativo.",
      );
    }

    if (parsedInput.id) {
      const [existingProductCode] = await db
        .select({
          id: productCodesTable.id,

          productId: productCodesTable.productId,

          insurerId: productCodesTable.insurerId,
        })
        .from(productCodesTable)
        .where(eq(productCodesTable.id, parsedInput.id))
        .limit(1);

      if (!existingProductCode) {
        throw new ActionError("Código do produto não encontrado.");
      }

      if (existingProductCode.productId !== parsedInput.productId) {
        throw new ActionError("Não é permitido mover um código para outro produto.");
      }

      if (existingProductCode.insurerId !== product.insurerId) {
        throw new ActionError(
          "O código do produto possui uma seguradora incompatível.",
        );
      }
    }

    const duplicateCondition = parsedInput.id
      ? and(
          eq(productCodesTable.insurerId, product.insurerId),

          eq(productCodesTable.productId, product.id),

          eq(productCodesTable.code, code),

          eq(productCodesTable.name, name),

          ne(productCodesTable.id, parsedInput.id),
        )
      : and(
          eq(productCodesTable.insurerId, product.insurerId),

          eq(productCodesTable.productId, product.id),

          eq(productCodesTable.code, code),

          eq(productCodesTable.name, name),
        );

    const [duplicateProductCode] = await db
      .select({
        id: productCodesTable.id,
      })
      .from(productCodesTable)
      .where(duplicateCondition)
      .limit(1);

    if (duplicateProductCode) {
      throw new ActionError(
        `O código ${code} com o nome "${name}" já está cadastrado para este produto.`,
      );
    }

    try {
      if (parsedInput.id) {
        const [updatedProductCode] = await db
          .update(productCodesTable)
          .set({
            code,

            name,

            updatedAt: new Date(),
          })
          .where(eq(productCodesTable.id, parsedInput.id))
          .returning({
            id: productCodesTable.id,
          });

        if (!updatedProductCode) {
          throw new ActionError("Código do produto não encontrado.");
        }

        return {
          success: true,

          mode: "updated" as const,

          id: updatedProductCode.id,
        };
      }

      const [createdProductCode] = await db
        .insert(productCodesTable)
        .values({
          insurerId: product.insurerId,

          productId: product.id,

          code,

          name,
        })
        .returning({
          id: productCodesTable.id,
        });

      if (!createdProductCode) {
        throw new Error("Não foi possível criar o código do produto.");
      }

      return {
        success: true,
      };
    } catch (error) {
      if (isDatabaseErrorCode(error, "23505")) {
        throw new ActionError(
          `O código ${code} com o nome "${name}" já está cadastrado para este produto ou existe um conflito de unicidade no cadastro.`,
        );
      }

      throw error;
    }
  });
