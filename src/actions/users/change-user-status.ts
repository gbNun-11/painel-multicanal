"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { auth } from "@/src/lib/auth";
import { adminActionClient } from "@/src/lib/safe-action";
import changeUserStatusSchema from "@/src/schemas/user/changeUserStatusSchema";

export const changeUserStatusAction = adminActionClient
  .inputSchema(changeUserStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.id === ctx.user.id && parsedInput.status === "inativo") {
      throw new Error("Você não pode inativar o próprio usuário.");
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set({
        status: parsedInput.status,
      })
      .where(eq(usersTable.id, parsedInput.id))
      .returning({
        id: usersTable.id,
      });

    if (!updatedUser) {
      throw new Error("Usuário não encontrado.");
    }

    if (parsedInput.status === "inativo") {
      await auth.api.revokeUserSessions({
        body: {
          userId: parsedInput.id,
        },
        headers: await headers(),
      });
    }

    return {
      success: true,
    };
  });
