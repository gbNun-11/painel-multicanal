import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { auth } from "@/src/lib/auth";

export const authorizePortoOperator = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  const operatorId = session?.user?.id;
  if (!operatorId) {
    return { authorized: false as const, status: 401 as const };
  }

  const [operator] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, operatorId),
        inArray(usersTable.role, ["admin", "administrativo"]),
        eq(usersTable.status, "ativo"),
        eq(usersTable.banned, false),
      ),
    )
    .limit(1);

  if (!operator) {
    return { authorized: false as const, status: 403 as const };
  }

  return { authorized: true as const, operatorId: operator.id };
};
