import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { portoOpportunitiesResponseSchema } from "@/src/integrations/porto/schema";

export const MAX_ITEMS = 100;
const MAX_BODY_BYTES = 4 * 1024 * 1024;

export const portoBatchSchema = z
  .object({
    portoCpf: z.string().trim().min(11).max(20),
    portoSusepCode: z.string().trim().min(3).max(16),
    opportunityStatus: z.enum(["7", "1"]),
    payload: z.unknown(),
  })
  .strict();

export const importBatchSchema = portoBatchSchema
  .extend({
    confirmed: z.literal(true),
    previewDigest: z.string().regex(/^[a-f0-9]{64}$/),
    selectedExternalIds: z
      .array(z.string().trim().min(1).max(200))
      .max(MAX_ITEMS),
  })
  .strict();

export type PortoBatch = z.infer<typeof portoBatchSchema>;

export function parsePortoResponse(payload: unknown) {
  const parsed = portoOpportunitiesResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.itens.length > MAX_ITEMS) {
    throw new Error("Lote Porto inválido ou superior a 100 oportunidades.");
  }
  return parsed.data;
}

export function batchDigest(batch: PortoBatch): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        portoCpf: batch.portoCpf.replace(/\D/g, ""),
        portoSusepCode: batch.portoSusepCode.toUpperCase(),
        opportunityStatus: batch.opportunityStatus,
        payload: batch.payload,
      }),
    )
    .digest("hex");
}

export async function readPortoBatchBody(
  request: NextRequest,
): Promise<unknown> {
  if (!request.body) throw new Error("empty_body");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let consumed = 0;
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    consumed += value.byteLength;
    if (consumed > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error("payload_too_large");
    }
    result += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(result + decoder.decode()) as unknown;
  } catch {
    throw new Error("invalid_json");
  }
}

export function isAuthorizedPortoPost(request: NextRequest) {
  return (
    request.headers.get("origin") === request.nextUrl.origin &&
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json") === true
  );
}

export function sanitizePortoSourcePayload(value: unknown, depth = 0): unknown {
  if (depth > 12) return null;
  if (Array.isArray(value)) {
    return value
      .slice(0, 500)
      .map((entry) => sanitizePortoSourcePayload(entry, depth + 1));
  }
  if (typeof value === "string") {
    return value
      .replace(/https?:\/\/[^\s"'<>]+/gi, (match) => {
        try {
          const url = new URL(match);
          return url.origin + url.pathname;
        } catch {
          return "[URL REMOVIDA]";
        }
      })
      .replace(
        /\b[A-Za-z0-9_-]{25,}\.[A-Za-z0-9_-]{25,}\.[A-Za-z0-9_-]{15,}\b/g,
        "[TOKEN REMOVIDO]",
      );
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (
        /(?:auth(?:orization)?|bearer|access.?token|refresh.?token|sm.?session|jwt|api.?key|secret|password|passwd|cookie|credential)/i.test(
          key,
        )
      ) {
        continue;
      }
      result[key] = sanitizePortoSourcePayload(child, depth + 1);
    }
    return result;
  }
  return value;
}
