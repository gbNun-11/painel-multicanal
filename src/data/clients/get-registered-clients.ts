import "server-only";

import { asc, count, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/src/db";
import { clientsTable, opportunitiesTable } from "@/src/db/schema";
import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";
import { calculatePagination } from "@/src/utils/pagination";
import {
  escapeLikePattern,
  normalizeNumericSearch,
  normalizeSearchTerm,
} from "@/src/utils/search";

export interface RegisteredClientRow {
  id: string;
  name: string;
  document: string;
  phone: string | null;
  createdAt: Date;
  opportunitiesCount: number;
  lastOpportunityAt: Date | null;
}

interface GetRegisteredClientsParams {
  page: number;
  search?: string;
}

export const getRegisteredClients = async ({
  page,
  search,
}: GetRegisteredClientsParams) => {
  await requirePageAccess(PAGE_ACCESS.administrative);

  const normalizedSearch = normalizeSearchTerm(search)?.slice(0, 120) ?? null;

  const numericSearch = normalizedSearch
    ? normalizeNumericSearch(normalizedSearch)
    : null;

  const whereClause = normalizedSearch
    ? or(
        ilike(clientsTable.name, `%${escapeLikePattern(normalizedSearch)}%`),
        ...(numericSearch
          ? [
              ilike(
                clientsTable.document,
                `%${escapeLikePattern(numericSearch)}%`,
              ),
              ilike(
                clientsTable.phone,
                `%${escapeLikePattern(numericSearch)}%`,
              ),
            ]
          : []),
      )
    : undefined;

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(clientsTable)
    .where(whereClause);

  const total = countResult?.total ?? 0;

  const { pagination, offset } = calculatePagination({
    page,
    total,
  });

  const clients = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      document: clientsTable.document,
      phone: clientsTable.phone,
      createdAt: clientsTable.createdAt,

      opportunitiesCount: count(opportunitiesTable.id),

      lastOpportunityAt: sql<Date | null>`
        MAX(${opportunitiesTable.createdAt})
      `,
    })
    .from(clientsTable)
    .leftJoin(
      opportunitiesTable,
      eq(opportunitiesTable.clientId, clientsTable.id),
    )
    .where(whereClause)
    .groupBy(
      clientsTable.id,
      clientsTable.name,
      clientsTable.document,
      clientsTable.phone,
      clientsTable.createdAt,
    )
    .orderBy(asc(clientsTable.name), asc(clientsTable.id))
    .limit(pagination.pageSize)
    .offset(offset);

  return {
    clients: clients as RegisteredClientRow[],
    pagination,
  };
};
