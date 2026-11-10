import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { auth } from "@/src/lib/auth";

type UserRole = typeof usersTable.$inferSelect.role;

interface RequirePageAccessOptions {
  deniedRedirectTo?: string;
}

export const PAGE_ACCESS = {
  adminOnly: ["admin"],
  administrative: ["admin", "administrativo"],
} as const satisfies Record<string, readonly UserRole[]>;

const getCurrentAccessUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });

  if (!session?.user?.id) {
    return { hasSession: false as const, user: null };
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, session.user.id),
        eq(usersTable.status, "ativo"),
        eq(usersTable.banned, false),
      ),
    )
    .limit(1);

  return { hasSession: true as const, user: user ?? null };
});

export const requirePageAccess = async (
  allowedRoles: readonly UserRole[],
  options: RequirePageAccessOptions = {},
) => {
  const { hasSession, user } = await getCurrentAccessUser();

  if (!hasSession) {
    redirect("/authentication");
  }

  if (allowedRoles.length === 0) {
    notFound();
  }

  if (!user || !allowedRoles.includes(user.role)) {
    if (options.deniedRedirectTo) {
      redirect(options.deniedRedirectTo);
    }

    notFound();
  }

  return user;
};
