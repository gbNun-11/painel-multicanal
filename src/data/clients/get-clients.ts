import "server-only";

import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { INSURER_IDS } from "@/src/constants/insurers";
import { DEFAULT_PAGE_SIZE } from "@/src/constants/pagination";
import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  opportunitiesTable,
  opportunitySalesModelEnum,
} from "@/src/db/schema";

import {
  escapeLikePattern,
  normalizeNumericSearch,
  normalizeSearchTerm,
} from "@/src/utils/search";

const MAX_SEARCH_LENGTH = 120;
const MAX_FILTER_VALUES = 50;

type OpportunitySalesModel =
  (typeof opportunitySalesModelEnum.enumValues)[number];

interface GetClientsParams {
  page: number;

  insurerId: string;

  search?: string;

  arrivalDateFrom?: string;
  arrivalDateTo?: string;

  products?: string[];
  salesModels?: string[];
  enterpriseIds?: string[];
}

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
): OpportunitySalesModel[] => {
  if (!values?.length) {
    return [];
  }

  const allowedValues = new Set<string>(opportunitySalesModelEnum.enumValues);

  return [
    ...new Set(
      values
        .map((value) => value.trim().toUpperCase())
        .filter((value): value is OpportunitySalesModel =>
          allowedValues.has(value),
        ),
    ),
  ];
};

// Não envia strings arbitrárias para comparações UUID.
const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

const normalizeEnterpriseIds = (values: string[] | undefined) =>
  normalizeFilterValues(values).filter((value) => UUID_PATTERN.test(value));

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
  enterpriseIds,
}: GetClientsParams) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;

  const normalizedSearch =
    normalizeSearchTerm(search)?.slice(0, MAX_SEARCH_LENGTH) ?? null;

  const normalizedProducts = normalizeFilterValues(products);

  const normalizedSalesModels = normalizeSalesModels(salesModels);

  const normalizedEnterpriseIds = normalizeEnterpriseIds(enterpriseIds);

  const dateRange = getDateRange(arrivalDateFrom, arrivalDateTo);

  // A aba Porto reúne oportunidades de ambas as empresas
  // pela origem. Nas demais abas, permanece o filtro
  // pela seguradora selecionada.
  const insurerCondition =
    insurerId === INSURER_IDS.PORTO
      ? eq(opportunitiesTable.externalSource, "PORTO")
      : eq(enterpriseInsurersTable.insurerId, insurerId);

  const conditions: SQL[] = [
    insurerCondition,

    eq(opportunitiesTable.distributionStatus, "novo"),

    eq(opportunitiesTable.salesStatus, "aberto"),

    isNull(opportunitiesTable.salespersonId),
  ];

  if (normalizedSearch) {
    const escapedSearch = escapeLikePattern(normalizedSearch);

    const documentSearch = normalizeNumericSearch(normalizedSearch);

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
        ${opportunitiesTable.sourceCreatedAt}
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
        ${opportunitiesTable.sourceCreatedAt}
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
    conditions.push(inArray(opportunitiesTable.product, normalizedProducts));
  }

  if (normalizedSalesModels.length > 0) {
    conditions.push(
      inArray(opportunitiesTable.salesModel, normalizedSalesModels),
    );
  }

  if (normalizedEnterpriseIds.length > 0) {
    conditions.push(
      inArray(enterpriseInsurersTable.enterpriseId, normalizedEnterpriseIds),
    );
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(opportunitiesTable)
    .innerJoin(clientsTable, eq(opportunitiesTable.clientId, clientsTable.id))
    .innerJoin(
      enterpriseInsurersTable,
      eq(opportunitiesTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .where(whereClause);

  const total = countResult?.total ?? 0;

  const totalPages = Math.ceil(total / pageSize);

  const safePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  const offset = (safePage - 1) * pageSize;

  const clients = await db
    .select({
      // ID da oportunidade para seleção/distribuição.
      id: opportunitiesTable.id,

      // ID do cliente para abrir o Cliente 360.
      clientId: opportunitiesTable.clientId,

      // Numeração real do lead.
      opportunityNumber: opportunitiesTable.opportunityNumber,

      name: clientsTable.name,

      document: clientsTable.document,

      phone: clientsTable.phone,

      product: opportunitiesTable.product,

      // Empresa associada à oportunidade.
      enterpriseName: enterprisesTable.name,

      propensity: opportunitiesTable.propensity,

      salesModel: opportunitiesTable.salesModel,
    })
    .from(opportunitiesTable)
    .innerJoin(clientsTable, eq(opportunitiesTable.clientId, clientsTable.id))
    .innerJoin(
      enterpriseInsurersTable,
      eq(opportunitiesTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .innerJoin(
      enterprisesTable,
      eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id),
    )
    .where(whereClause)
    .orderBy(
      sql`
        ${opportunitiesTable.sourceCreatedAt}
        DESC NULLS LAST
      `,

      asc(clientsTable.name),

      asc(opportunitiesTable.id),
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
