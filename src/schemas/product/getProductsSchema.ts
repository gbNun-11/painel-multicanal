import { z } from "zod";

const getProductsSchema = z.object({
  insurerId: z.uuid({
    error: "Seguradora inválida.",
  }),
});

export type GetProductsInput = z.infer<typeof getProductsSchema>;

export default getProductsSchema;
