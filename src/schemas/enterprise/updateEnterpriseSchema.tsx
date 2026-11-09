import { z } from "zod";

import upsertEnterpriseSchema from "./upsertEnterprisesSchema";

const updateEnterpriseSchema = upsertEnterpriseSchema.extend({
  id: z.uuid(),
});

export type UpdateEnterpriseData = z.infer<typeof updateEnterpriseSchema>;

export default updateEnterpriseSchema;
