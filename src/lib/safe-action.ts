import { headers } from "next/headers";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "@/src/lib/auth";

class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",

  handleServerError(error) {
    console.error("Safe Action Error:", error);

    if (error instanceof ActionError) {
      return error.message;
    }

    return "Ocorreu um erro interno. Tente novamente.";
  },
});

export const protectedActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new ActionError("Usuário não autenticado.");
  }

  if (session.user.status !== "ativo") {
    throw new ActionError("Usuário inativo.");
  }

  return next({
    ctx: {
      session,
      user: session.user,
    },
  });
});

export const adminActionClient = protectedActionClient.use(
  async ({ next, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new ActionError(
        "Você não possui permissão para realizar esta operação.",
      );
    }

    return next();
  },
);
