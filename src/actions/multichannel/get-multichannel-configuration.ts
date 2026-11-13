"use server";

import { getMultichannelConfiguration } from "@/src/data/multichannel/get-multichannel-configuration";
import { adminActionClient } from "@/src/lib/safe-action";
import getMultichannelConfigurationSchema from "@/src/schemas/multichannel/getMultichannelConfigurationSchema";

export const getMultichannelConfigurationAction = adminActionClient
  .inputSchema(getMultichannelConfigurationSchema)
  .action(async ({ parsedInput }) => {
    const configuration = await getMultichannelConfiguration(
      parsedInput.susepId,
    );

    return {
      configuration: {
        susep: {
          id: configuration.susep.id,
          code: configuration.susep.code,
          status: configuration.susep.status,
        },

        assignments: configuration.assignments.map((assignment) => ({
          id: assignment.id,

          productId: assignment.productId,

          productName: assignment.productName,

          productStatus: assignment.productStatus,

          userId: assignment.userId,

          userName: assignment.userName,

          leadCapacity: assignment.leadCapacity,

          userStatus: assignment.userStatus,

          status: assignment.status,
        })),

        products: configuration.products.map((product) => ({
          id: product.id,
          name: product.name,
        })),

        users: configuration.users.map((user) => ({
          id: user.id,
          name: user.name,
        })),
      },
    };
  });
