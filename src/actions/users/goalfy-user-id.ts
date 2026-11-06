"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";

const userIdSchema = z.object({ userId: z.uuid() });

export const getUserGoalfyIdAction = adminActionClient
  .inputSchema(userIdSchema)
  .action(async ({ parsedInput }) => {
    const [user] = await db
      .select({ goalfyUserId: usersTable.goalfyUserId })
      .from(usersTable)
      .where(eq(usersTable.id, parsedInput.userId))
      .limit(1);

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    return { goalfyUserId: user.goalfyUserId };
  });

export const saveUserGoalfyIdAction = adminActionClient
  .inputSchema(
    userIdSchema.extend({
      goalfyUserId: z.string().trim().max(120).nullable(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const goalfyUserId = parsedInput.goalfyUserId?.trim() || null;

    if (goalfyUserId) {
      const [alreadyLinked] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.goalfyUserId, goalfyUserId))
        .limit(1);

      if (alreadyLinked && alreadyLinked.id !== parsedInput.userId) {
        throw new Error("Este ID Goalfy já está vinculado a outro usuário.");
      }
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        goalfyUserId,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, parsedInput.userId))
      .returning({ id: usersTable.id });

    if (!updated) {
      throw new Error("Usuário não encontrado.");
    }

    return { success: true };
  });
