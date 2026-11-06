import "server-only";

export const resolveGoalfyResponsibleValue = (
  v2UserId: string,
): string | null => {
  const raw = process.env.GOALFY_RESPONSIBLE_MAP_JSON?.trim();
  if (!raw) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "GOALFY_RESPONSIBLE_MAP_JSON deve ser um objeto JSON válido.",
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("GOALFY_RESPONSIBLE_MAP_JSON deve ser um objeto JSON.");
  }

  const value = (data as Record<string, unknown>)[v2UserId];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};
