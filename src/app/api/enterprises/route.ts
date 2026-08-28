import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { auth } from "@/src/lib/auth";
import createEnterpriseSchema from "@/src/schemas/enterprisesSchema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const body = await request.json();

  const result = createEnterpriseSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        issues: result.error.flatten(),
      },
      { status: 400 },
    );
  }

  const [enterprise] = await db
    .insert(enterprisesTable)
    .values({
      name: result.data.name,
      cnpj: result.data.cnpj,
      status: result.data.status,
    })
    .returning();

  return NextResponse.json({ enterprise }, { status: 201 });
}
