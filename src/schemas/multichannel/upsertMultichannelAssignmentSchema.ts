import { z } from "zod";

const upsertMultichannelAssignmentSchema = z.object({
  id: z.uuid().optional(),

  susepId: z.uuid(),

  productId: z.uuid(),

  userId: z.uuid(),

  // NULL preserva vínculos antigos que ainda não têm capacidade informada.
  leadCapacity: z.number().int().min(0).max(2147483647).nullable(),
}).refine(
  (input) => Boolean(input.id) || input.leadCapacity !== null,
  {
    message: "Informe a capacidade de LEAD para uma nova configuração.",
    path: ["leadCapacity"],
  },
);

export type UpsertMultichannelAssignmentFormData = z.infer<
  typeof upsertMultichannelAssignmentSchema
>;

export default upsertMultichannelAssignmentSchema;
