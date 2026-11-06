import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authorizePortoOperator } from "@/src/services/porto/authorize-porto-operator";
import { resolvePortoMultichannelContext } from "@/src/services/porto/resolve-porto-multichannel-context";

export const runtime = "nodejs";

const contextSchema = z
  .object({
    portoCpf: z.string().trim().min(1).max(20),
    portoSusepCode: z.string().trim().min(3).max(16),
  })
  .strict();

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const sameOrigin = (request: NextRequest) =>
  request.headers.get("origin") === request.nextUrl.origin;

export async function GET(request: NextRequest) {
  const operator = await authorizePortoOperator(request);
  if (!operator.authorized) {
    return json({ authorized: false }, operator.status);
  }
  return json({ authorized: true });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return json({ error: "Origem não autorizada." }, 403);
  }
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return json({ error: "Conteúdo JSON obrigatório." }, 415);
  }
  const operator = await authorizePortoOperator(request);
  if (!operator.authorized) {
    return json({ error: "Operador não autorizado." }, operator.status);
  }
  const input: unknown = await request.json().catch(() => null);
  const parsed = contextSchema.safeParse(input);
  if (!parsed.success) {
    return json({ error: "Identificação Porto inválida." }, 400);
  }

  try {
    const context = await resolvePortoMultichannelContext(parsed.data);
    return json({
      operatorId: operator.operatorId,
      multichannelUserId: context.userId,
      enterpriseInsurerId: context.enterpriseInsurerId,
      susepId: context.susepId,
      susepCode: context.susepCode,
      productId: context.productId,
      productName: context.productName,
    });
  } catch {
    return json(
      { error: "Vínculo multicanal não encontrado ou ambíguo." },
      422,
    );
  }
}
