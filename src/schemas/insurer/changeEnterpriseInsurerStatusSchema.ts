import { z } from "zod";

import { statuses } from "@/src/constants/enums";

const changeEnterpriseInsurerStatusSchema = z.object({
  id: z.uuid(),

  status: z.enum(statuses),
});

export default changeEnterpriseInsurerStatusSchema;
