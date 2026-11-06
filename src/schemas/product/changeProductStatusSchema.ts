import { z } from "zod";

import { statuses } from "@/src/constants/enums";

const changeProductStatusSchema = z.object({
  id: z.uuid({
    error: "Produto inválido.",
  }),

  status: z.enum(statuses),
});

export default changeProductStatusSchema;
