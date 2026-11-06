import { z } from "zod";

import { statuses } from "@/src/constants/enums";

const changeProductCodeStatusSchema = z.object({
  id: z.uuid({
    error: "Código do produto inválido.",
  }),

  status: z.enum(statuses),
});

export default changeProductCodeStatusSchema;
