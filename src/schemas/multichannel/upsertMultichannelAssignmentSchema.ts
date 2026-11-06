import { z } from "zod";

const upsertMultichannelAssignmentSchema = z.object({
  id: z.uuid().optional(),

  susepId: z.uuid(),

  productId: z.uuid(),

  userId: z.uuid(),
});

export type UpsertMultichannelAssignmentFormData = z.infer<
  typeof upsertMultichannelAssignmentSchema
>;

export default upsertMultichannelAssignmentSchema;
