import { DEFAULT_PAGE_SIZE } from "@/src/constants/pagination";

interface CalculatePaginationParams {
  page: number;
  total: number;
  pageSize?: number;
}

export const calculatePagination = ({
  page,
  total,
  pageSize = DEFAULT_PAGE_SIZE,
}: CalculatePaginationParams) => {
  const totalPages = Math.ceil(total / pageSize);

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;

  const safePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  const offset = (safePage - 1) * pageSize;

  return {
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },

    offset,
  };
};
