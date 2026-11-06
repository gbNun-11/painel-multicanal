import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { productCodesTable, productsTable } from "@/src/db/schema";

export const getProducts = async (insurerId: string) => {
  const [products, productCodes] = await Promise.all([
    db
      .select({
        id: productsTable.id,

        insurerId: productsTable.insurerId,

        name: productsTable.name,

        status: productsTable.status,
      })
      .from(productsTable)
      .where(eq(productsTable.insurerId, insurerId))
      .orderBy(asc(productsTable.name), asc(productsTable.id)),

    db
      .select({
        id: productCodesTable.id,

        insurerId: productCodesTable.insurerId,

        productId: productCodesTable.productId,

        externalId: productCodesTable.externalId,

        code: productCodesTable.code,

        name: productCodesTable.name,

        status: productCodesTable.status,
      })
      .from(productCodesTable)
      .where(eq(productCodesTable.insurerId, insurerId))
      .orderBy(
        asc(productCodesTable.code),
        asc(productCodesTable.name),
        asc(productCodesTable.id),
      ),
  ]);

  const codesByProductId = new Map<string, typeof productCodes>();

  for (const productCode of productCodes) {
    const currentCodes = codesByProductId.get(productCode.productId) ?? [];

    currentCodes.push(productCode);

    codesByProductId.set(productCode.productId, currentCodes);
  }

  return products.map((product) => ({
    ...product,

    codes: codesByProductId.get(product.id) ?? [],
  }));
};
