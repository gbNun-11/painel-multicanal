import z from "zod";

import { statuses } from "@/src/constants/enums";

const changeEnterpriseStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(statuses, {
    error: "Selecione um status.",
  }),
});

export type ChangeEnterpriseFormData = z.infer<
  typeof changeEnterpriseStatusSchema
>;

export default changeEnterpriseStatusSchema;
