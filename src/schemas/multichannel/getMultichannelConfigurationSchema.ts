import { z } from "zod";

const getMultichannelConfigurationSchema = z.object({
  susepId: z.uuid(),
});

export default getMultichannelConfigurationSchema;
