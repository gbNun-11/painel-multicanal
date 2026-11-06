import type { NextRequest } from "next/server";

export function isAuthorizedPortoJsonPost(request: NextRequest): boolean {
  const originHeader = request.headers.get("origin");
  const hostHeader = request.headers.get("host");
  const contentType = request.headers.get("content-type")?.toLowerCase();

  if (
    !originHeader ||
    !hostHeader ||
    !contentType?.startsWith("application/json") ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return false;
  }

  try {
    const origin = new URL(originHeader);
    return (
      (origin.protocol === "http:" || origin.protocol === "https:") &&
      origin.origin === originHeader &&
      origin.host.toLowerCase() === hostHeader.trim().toLowerCase()
    );
  } catch {
    return false;
  }
}
