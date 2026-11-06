const DEFAULT_MAX_SEARCH_LENGTH = 120;

export const normalizeSearchTerm = (
  value: string | undefined,
  maxLength = DEFAULT_MAX_SEARCH_LENGTH,
) => {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
};

export const escapeLikePattern = (value: string) => {
  return value.replace(/[\\%_]/g, "\\$&");
};

export const normalizeNumericSearch = (value: string) => {
  return value.replace(/\D/g, "");
};
