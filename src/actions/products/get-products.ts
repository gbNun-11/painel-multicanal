"use server";

import { getProducts } from "@/src/data/products/get-products";
import { adminActionClient } from "@/src/lib/safe-action";
import getProductsSchema from "@/src/schemas/product/getProductsSchema";

export const getProductsAction = adminActionClient
  .inputSchema(getProductsSchema)
  .action(async ({ parsedInput }) => {
    const products = await getProducts(parsedInput.insurerId);

    return {
      products,
    };
  });
