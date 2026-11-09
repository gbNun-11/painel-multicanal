type SearchParamValue = string | string[] | undefined;

export const getFirstSearchParam = (value: SearchParamValue) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const getSearchParamArray = (value: SearchParamValue) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

export const parsePageSearchParam = (value: SearchParamValue): number => {
  const pageParam = getFirstSearchParam(value);

  const parsedPage = Number(pageParam);

  return Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
};
