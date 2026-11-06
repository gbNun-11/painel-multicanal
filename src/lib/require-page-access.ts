import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

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

export const requirePageAccess = async (
  allowedRoles: readonly UserRole[],
  options: RequirePageAccessOptions = {},
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });

  if (!session?.user?.id) {
    redirect("/authentication");
  }

  if (allowedRoles.length === 0) {
    notFound();
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
        inArray(usersTable.role, [...allowedRoles]),
      ),
    )
    .limit(1);

  if (!user) {
    if (options.deniedRedirectTo) {
      redirect(options.deniedRedirectTo);
    }

    notFound();
  }

  return user;
};
