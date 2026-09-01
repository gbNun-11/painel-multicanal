"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { statuses } from "@/src/constants/enums";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";

const changeUserStatusSchema = z.object({
  id: z.uuid(),

  status: z.enum(statuses),
});

export const changeUserStatusAction = adminActionClient
  .inputSchema(changeUserStatusSchema)
  .action(async ({ parsedInput }) => {
    const [user] = await db
      .update(usersTable)
      .set({
        status: parsedInput.status,
      })
      .where(eq(usersTable.id, parsedInput.id))
      .returning({
        id: usersTable.id,
        status: usersTable.status,
      });

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    return user;
  });
