import "server-only";

import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { DEFAULT_PAGE_SIZE } from "@/src/constants/pagination";
import { db } from "@/src/db";
import {
  clientsTable,
  clientSalesModelEnum,
  enterpriseInsurersTable,
} from "@/src/db/schema";

const MAX_SEARCH_LENGTH = 120;
const MAX_FILTER_VALUES = 50;

type ClientSalesModel = (typeof clientSalesModelEnum.enumValues)[number];

interface GetClientsParams {
  page: number;
  insurerId: string;

  search?: string;

  arrivalDateFrom?: string;
  arrivalDateTo?: string;

  products?: string[];
  salesModels?: string[];
}

const normalizeSearch = (value: string | undefined) => {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_SEARCH_LENGTH);
};

const escapeLikePattern = (value: string) => {
  return value.replace(/[\\%_]/g, "\\$&");
};

const normalizeFilterValues = (values: string[] | undefined) => {
  if (!values?.length) {
    return [];
  }

  return [
    ...new Set(values.map((value) => value.trim()).filter(Boolean)),
  ].slice(0, MAX_FILTER_VALUES);
};

const normalizeSalesModels = (
  values: string[] | undefined,
): ClientSalesModel[] => {
  if (!values?.length) {
    return [];
  }

  const allowedValues = new Set<string>(clientSalesModelEnum.enumValues);

  return [
    ...new Set(
      values
        .map((value) => value.trim().toUpperCase())
        .filter((value): value is ClientSalesModel => allowedValues.has(value)),
    ),
  ];
};

const normalizeDate = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);

  const month = Number(match[2]);

  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValid ? normalized : null;
};

const getDateRange = (from: string | undefined, to: string | undefined) => {
  let normalizedFrom = normalizeDate(from);

  let normalizedTo = normalizeDate(to);

  if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
    [normalizedFrom, normalizedTo] = [normalizedTo, normalizedFrom];
  }

  return {
    from: normalizedFrom,
    to: normalizedTo,
  };
};

export const getClients = async ({
  page,
  insurerId,
  search,
  arrivalDateFrom,
  arrivalDateTo,
  products,
  salesModels,
}: GetClientsParams) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;

  const normalizedSearch = normalizeSearch(search);

  const normalizedProducts = normalizeFilterValues(products);

  const normalizedSalesModels = normalizeSalesModels(salesModels);

  const dateRange = getDateRange(arrivalDateFrom, arrivalDateTo);

  const conditions: SQL[] = [
    eq(enterpriseInsurersTable.insurerId, insurerId),

    eq(clientsTable.status, "novo"),
  ];

  if (normalizedSearch) {
    const escapedSearch = escapeLikePattern(normalizedSearch);

    const documentSearch = normalizedSearch.replace(/\D/g, "");

    const nameCondition = ilike(clientsTable.name, `%${escapedSearch}%`);

    if (documentSearch) {
      const documentCondition =
        documentSearch.length === 11 || documentSearch.length === 14
          ? eq(clientsTable.document, documentSearch)
          : ilike(
              clientsTable.document,
              `%${escapeLikePattern(documentSearch)}%`,
            );

      const searchCondition = or(nameCondition, documentCondition);

      if (searchCondition) {
        conditions.push(searchCondition);
      }
    } else {
      conditions.push(nameCondition);
    }
  }

  if (dateRange.from) {
    conditions.push(
      sql`
        ${clientsTable.sourceCreatedAt}
        >= (
          ${dateRange.from}::date
          AT TIME ZONE 'America/Sao_Paulo'
        )
      `,
    );
  }

  if (dateRange.to) {
    conditions.push(
      sql`
        ${clientsTable.sourceCreatedAt}
        < (
          (
            ${dateRange.to}::date
            + INTERVAL '1 day'
          )
          AT TIME ZONE 'America/Sao_Paulo'
        )
      `,
    );
  }

  if (normalizedProducts.length > 0) {
    conditions.push(inArray(clientsTable.product, normalizedProducts));
  }

  if (normalizedSalesModels.length > 0) {
    conditions.push(inArray(clientsTable.salesModel, normalizedSalesModels));
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(clientsTable)
    .innerJoin(
      enterpriseInsurersTable,
      eq(clientsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .where(whereClause);

  const total = countResult?.total ?? 0;

  const totalPages = Math.ceil(total / pageSize);

  const safePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  const offset = (safePage - 1) * pageSize;

  const clients = await db
    .select({
      id: clientsTable.id,

      name: clientsTable.name,

      document: clientsTable.document,

      phone: clientsTable.phone,

      product: clientsTable.product,

      propensity: clientsTable.propensity,
    })
    .from(clientsTable)
    .innerJoin(
      enterpriseInsurersTable,
      eq(clientsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .where(whereClause)
    .orderBy(
      sql`
          ${clientsTable.sourceCreatedAt}
          DESC NULLS LAST
        `,
      asc(clientsTable.name),
      asc(clientsTable.id),
    )
    .limit(pageSize)
    .offset(offset);

  return {
    clients,

    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
};
