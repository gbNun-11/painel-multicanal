export const getFirstSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const getSearchParamArray = (value: string | string[] | undefined) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};
