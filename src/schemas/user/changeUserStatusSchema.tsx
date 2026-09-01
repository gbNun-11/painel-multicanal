import z from "zod";

import { statuses } from "@/src/constants/enums";

const changeUserStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(statuses, {
    error: "Selecione um status.",
  }),
});

export type ChangeUserFormData = z.infer<typeof changeUserStatusSchema>;

export default changeUserStatusSchema;
