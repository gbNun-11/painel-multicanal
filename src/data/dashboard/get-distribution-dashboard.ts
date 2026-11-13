import "server-only";

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { ENTERPRISE_IDS } from "@/src/constants/enterprises";
import { INSURER_IDS } from "@/src/constants/insurers";
import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  multichannelAssignmentsTable,
  opportunitiesTable,
  productsTable,
  susepsTable,
  usersTable,
} from "@/src/db/schema";
import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";

const TIME_ZONE = "America/Sao_Paulo";
const PENDING_PAGE_SIZE = 10;

type SalesModel = "LEAD" | "VINCULO" | "CONTINGENCIA";
export type DashboardCompany = "all" | "ICX" | "INRI";
export type DashboardPeriodMode = "day" | "month" | "year";

export const normalizeDashboardPeriodMode = (
  value?: string,
): DashboardPeriodMode =>
  value === "day" || value === "year" ? value : "month";

const isValidDay = (value: string): boolean => {
  if (!/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  return (
    new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) ===
    value
  );
};

export const normalizeDashboardDate = (
  value: string | undefined,
  selectedMonth: string,
) => {
  if (value && isValidDay(value)) return value;

  const current = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date());

  return current.startsWith(selectedMonth) ? current : selectedMonth + "-01";
};

export const normalizeDashboardYear = (
  value: string | undefined,
  selectedMonth: string,
) => /^20\d{2}$/.test(value ?? "") ? value! : selectedMonth.slice(0, 4);

const MODEL_MONTHLY_AVERAGES: Record<
  Exclude<DashboardCompany, "all">,
  Record<SalesModel, number>
> = {
  ICX: { LEAD: 105, VINCULO: 30, CONTINGENCIA: 238 },
  INRI: { LEAD: 311, VINCULO: 473, CONTINGENCIA: 594 },
};

const getModelMonthlyAverage = (
  company: DashboardCompany,
  model: SalesModel,
) =>
  company === "all"
    ? MODEL_MONTHLY_AVERAGES.ICX[model] + MODEL_MONTHLY_AVERAGES.INRI[model]
    : MODEL_MONTHLY_AVERAGES[company][model];

export const normalizeDashboardCompany = (value?: string): DashboardCompany =>
  value === "ICX" || value === "INRI" ? value : "all";

export interface DistributionDashboardData {
  period: {
    month: string;
    date: string;
    year: string;
    granularity: DashboardPeriodMode;
    label: string;
    company: DashboardCompany;
  };
  summary: {
    received: number;
    distributed: number;
    errorBatches: number;
    averageDistributionMinutes: number | null;
  };
  products: { product: string; received: number; distributed: number }[];
  salespeople: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    distributed: number;
  }[];
  models: {
    model: SalesModel;
    received: number;
    progressPercent: number | null;
  }[];
  capacities: {
    id: string;
    product: string;
    company: "ICX" | "INRI";
    susepCode: string;
    received: number;
    capacity: number | null;
    difference: number | null;
    status: "below" | "met" | "over" | "unconfigured" | "reference";
  }[];
  pendingDates: {
    date: string | null;
    pending: number;
    lead: number;
    vinculo: number;
    contingencia: number;
    withoutModel: number;
  }[];
  pendingPage: number;
  pendingDatesHasMore: boolean;
}

const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));

  return formatted.charAt(0).toLocaleUpperCase("pt-BR") + formatted.slice(1);
};

const currentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    timeZone: TIME_ZONE,
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")!.value;
  const month = parts.find((part) => part.type === "month")!.value;
  return year + "-" + month;
};

export const normalizeDashboardMonth = (value?: string) =>
  value && /^20\d{2}-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : currentMonth();

// Exibe somente meses com data de chegada informada pela Porto.
// Registros sem sourceCreatedAt não entram no filtro mensal.
export const getDashboardMonthOptions = async (
  company: DashboardCompany = "all",
) => {
  await requirePageAccess(PAGE_ACCESS.administrative);

  const creationMonth = sql<string>`
    to_char(
      ${opportunitiesTable.sourceCreatedAt} AT TIME ZONE 'America/Sao_Paulo',
      'YYYY-MM'
    )
  `;

  const selectedCompany = normalizeDashboardCompany(company);
  const companyInsurers = db
    .select({ id: enterpriseInsurersTable.id })
    .from(enterpriseInsurersTable)
    .where(
      selectedCompany === "all"
        ? inArray(enterpriseInsurersTable.enterpriseId, [
            ENTERPRISE_IDS.ICX,
            ENTERPRISE_IDS.INRI,
          ])
        : eq(enterpriseInsurersTable.enterpriseId, ENTERPRISE_IDS[selectedCompany]),
    );

  const months = await db
    .selectDistinct({ value: creationMonth })
    .from(opportunitiesTable)
    .where(
      and(
        inArray(opportunitiesTable.enterpriseInsurerId, companyInsurers),
        sql`${opportunitiesTable.sourceCreatedAt} IS NOT NULL`,
      ),
    )
    .orderBy(desc(creationMonth));

  return months.map(({ value }) => ({
    value,
    label: monthLabel(value),
  }));
};

export const getDistributionDashboard = async (input: {
  month?: string;
  date?: string;
  year?: string;
  granularity?: DashboardPeriodMode;
  company?: DashboardCompany;
  pendingPage?: number;
}): Promise<DistributionDashboardData> => {
  await requirePageAccess(PAGE_ACCESS.administrative);

  const month = normalizeDashboardMonth(input.month);
  const granularity = normalizeDashboardPeriodMode(input.granularity);
  const date = normalizeDashboardDate(input.date, month);
  const year = normalizeDashboardYear(input.year, month);
  const company = normalizeDashboardCompany(input.company);
  const companyInsurers = db
    .select({ id: enterpriseInsurersTable.id })
    .from(enterpriseInsurersTable)
    .where(
      company === "all"
        ? inArray(enterpriseInsurersTable.enterpriseId, [
            ENTERPRISE_IDS.ICX,
            ENTERPRISE_IDS.INRI,
          ])
        : eq(enterpriseInsurersTable.enterpriseId, ENTERPRISE_IDS[company]),
    );

  const opportunityCompanyCondition = inArray(
    opportunitiesTable.enterpriseInsurerId,
    companyInsurers,
  );
  const batchCompanyCondition = inArray(
    goalfyDistributionBatchItemsTable.enterpriseInsurerId,
    companyInsurers,
  );
  const [monthYear, monthNumber] = month.split("-").map(Number);

  const start =
    granularity === "day"
      ? date
      : granularity === "year"
        ? year + "-01-01"
        : month + "-01";

  const end = granularity === "day"
    ? new Date(Date.parse(start + "T12:00:00Z") + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : granularity === "year"
      ? String(Number(year) + 1) + "-01-01"
      : new Date(Date.UTC(monthYear, monthNumber, 1))
          .toISOString()
          .slice(0, 10);

  const periodLabel =
    granularity === "day"
      ? new Intl.DateTimeFormat("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(start + "T12:00:00Z"))
      : granularity === "year"
        ? year
        : monthLabel(month);

  const pendingPage =
    input.pendingPage &&
    Number.isSafeInteger(input.pendingPage) &&
    input.pendingPage >= 1 &&
    input.pendingPage <= 100000
      ? input.pendingPage
      : 1;

  // Mesmos limites (inclusivo/exclusivo) e fuso para todos os blocos.
  const arrivals = sql<boolean>`
    ${opportunitiesTable.sourceCreatedAt} >=
    (${start}::date AT TIME ZONE 'America/Sao_Paulo')
    AND ${opportunitiesTable.sourceCreatedAt} <
    (${end}::date AT TIME ZONE 'America/Sao_Paulo')
  `;

  // O período selecionado é sempre o da data informada pela Porto.
  // Distribuídos representam oportunidades dessa safra já confirmadas.
  const distributionConfirmed = and(
    arrivals,
    eq(opportunitiesTable.distributionStatus, "distribuido"),
  )!;

  // Mantém a mesma definição de elegibilidade da tela de distribuição.
  const backlogCondition = and(
    eq(opportunitiesTable.distributionStatus, "novo"),
    eq(opportunitiesTable.salesStatus, "aberto"),
    isNull(opportunitiesTable.salespersonId),
  )!;

  const arrivalDate = sql<string | null>`
    to_char(
      ${opportunitiesTable.sourceCreatedAt} AT TIME ZONE 'America/Sao_Paulo',
      'YYYY-MM-DD'
    )
  `;

  const [summaryRows, batchRows, productRows, salespersonRows, modelRows, pendingRows, capacityRows] =
    await Promise.all([
      db
        .select({
          received: sql<number>`
            count(*) FILTER (WHERE ${arrivals})::integer
          `,
          distributed: sql<number>`
            count(*) FILTER (WHERE ${distributionConfirmed})::integer
          `,
          averageSeconds: sql<number | null>`
            avg(extract(epoch from (
              ${opportunitiesTable.assignedAt} - ${opportunitiesTable.sourceCreatedAt}
            ))) FILTER (
              WHERE ${distributionConfirmed}
                AND ${opportunitiesTable.sourceCreatedAt} IS NOT NULL
                AND ${opportunitiesTable.assignedAt} >= ${opportunitiesTable.sourceCreatedAt}
            )::double precision
          `,
        })
        .from(opportunitiesTable)
        .where(and(arrivals, opportunityCompanyCondition)),

      // Um lote só é problemático se mantém criações não confirmadas.
      db
        .select({
          total: sql<number>`
            count(DISTINCT ${goalfyDistributionBatchItemsTable.batchId})::integer
          `,
        })
        .from(goalfyDistributionBatchItemsTable)
        .innerJoin(
          goalfyDistributionBatchesTable,
          eq(
            goalfyDistributionBatchItemsTable.batchId,
            goalfyDistributionBatchesTable.id,
          ),
        )
        .where(
          and(
            sql`${goalfyDistributionBatchItemsTable.status} IN ('sent', 'inconclusive')`,
            sql`${goalfyDistributionBatchesTable.status} IN ('reconciling', 'interrupted')`,
            batchCompanyCondition,
          ),
        ),

      // Barras: ambas as quantidades pertencem à mesma safra recebida.
      db
        .select({
          product: opportunitiesTable.product,
          received: sql<number>`count(*)::integer`,
          distributed: sql<number>`
            count(*) FILTER (
              WHERE ${opportunitiesTable.distributionStatus} = 'distribuido'
            )::integer
          `,
        })
        .from(opportunitiesTable)
        .where(and(arrivals, opportunityCompanyCondition))
        .groupBy(opportunitiesTable.product)
        .orderBy(desc(sql`count(*)`), asc(opportunitiesTable.product)),

      db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          role: usersTable.role,
          avatarUrl: usersTable.image,
          distributed: sql<number>`count(*)::integer`,
        })
        .from(opportunitiesTable)
        .innerJoin(usersTable, eq(opportunitiesTable.salespersonId, usersTable.id))
        .where(and(distributionConfirmed, opportunityCompanyCondition))
        .groupBy(usersTable.id, usersTable.name, usersTable.role, usersTable.image)
        .orderBy(desc(sql`count(*)`), asc(usersTable.name))
        .limit(10),

      db
        .select({
          model: opportunitiesTable.salesModel,
          received: sql<number>`count(*)::integer`,
        })
        .from(opportunitiesTable)
        .where(and(arrivals, opportunityCompanyCondition))
        .groupBy(opportunitiesTable.salesModel),

      // Backlog global: datas antigas não desaparecem com o filtro mensal.
      db
        .select({
          date: arrivalDate,
          pending: sql<number>`count(*)::integer`,
          lead: sql<number>`count(*) FILTER (WHERE ${opportunitiesTable.salesModel} = 'LEAD')::integer`,
          vinculo: sql<number>`count(*) FILTER (WHERE ${opportunitiesTable.salesModel} = 'VINCULO')::integer`,
          contingencia: sql<number>`count(*) FILTER (WHERE ${opportunitiesTable.salesModel} = 'CONTINGENCIA')::integer`,
          withoutModel: sql<number>`count(*) FILTER (WHERE ${opportunitiesTable.salesModel} IS NULL)::integer`,
        })
        .from(opportunitiesTable)
        .where(and(backlogCondition, opportunityCompanyCondition))
        .groupBy(arrivalDate)
        .orderBy(sql`${arrivalDate} DESC NULLS LAST`)
        .limit(PENDING_PAGE_SIZE + 1)
        .offset((pendingPage - 1) * PENDING_PAGE_SIZE),

      // A capacidade pertence a cada vínculo SUSEP / produto lógico / CPF.
      // LEFT JOIN mantém produtos configurados mesmo sem LEAD recebido.
      db
        .select({
          id: multichannelAssignmentsTable.id,
          enterpriseId: enterpriseInsurersTable.enterpriseId,
          product: productsTable.name,
          susepCode: susepsTable.code,
          capacity: multichannelAssignmentsTable.leadCapacity,
          received: sql<number>`count(${opportunitiesTable.id})::integer`,
        })
        .from(multichannelAssignmentsTable)
        .innerJoin(
          susepsTable,
          eq(multichannelAssignmentsTable.susepId, susepsTable.id),
        )
        .innerJoin(
          enterpriseInsurersTable,
          eq(susepsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
        )
        .innerJoin(
          productsTable,
          eq(multichannelAssignmentsTable.productId, productsTable.id),
        )
        .leftJoin(
          opportunitiesTable,
          and(
            eq(opportunitiesTable.susepId, susepsTable.id),
            eq(opportunitiesTable.enterpriseInsurerId, enterpriseInsurersTable.id),
            eq(opportunitiesTable.product, productsTable.name),
            eq(opportunitiesTable.salesModel, "LEAD"),
            eq(opportunitiesTable.externalSource, "PORTO"),
            arrivals,
          ),
        )
        .where(
          and(
            eq(enterpriseInsurersTable.insurerId, INSURER_IDS.PORTO),
            company === "all"
              ? inArray(enterpriseInsurersTable.enterpriseId, [
                  ENTERPRISE_IDS.ICX,
                  ENTERPRISE_IDS.INRI,
                ])
              : eq(
                  enterpriseInsurersTable.enterpriseId,
                  ENTERPRISE_IDS[company],
                ),
            eq(susepsTable.multichannel, true),
            eq(multichannelAssignmentsTable.status, "ativo"),
          ),
        )
        .groupBy(
          multichannelAssignmentsTable.id,
          enterpriseInsurersTable.enterpriseId,
          productsTable.name,
          susepsTable.code,
        )
        .orderBy(asc(productsTable.name), asc(enterpriseInsurersTable.enterpriseId)),
    ]);

  const summary = summaryRows[0];
  const modelCounts = new Map(modelRows.map((item) => [item.model, item.received]));

  return {
    period: { month, date, year, granularity, label: periodLabel, company },
    summary: {
      received: summary?.received ?? 0,
      distributed: summary?.distributed ?? 0,
      errorBatches: batchRows[0]?.total ?? 0,
      averageDistributionMinutes:
        summary?.averageSeconds === null ||
        summary?.averageSeconds === undefined
          ? null
          : Math.round(Number(summary.averageSeconds) / 60),
    },
    products: productRows.map((row) => ({
      product: row.product.trim() || "Não informado",
      received: row.received,
      distributed: row.distributed,
    })),
    salespeople: salespersonRows.map((row) => ({
      ...row,
      avatarUrl: row.avatarUrl?.trim() || null,
    })),
    models: (["LEAD", "VINCULO", "CONTINGENCIA"] as const).map((model) => {
      const received = modelCounts.get(model) ?? 0;
      const average = getModelMonthlyAverage(company, model);
      return {
        model,
        received,
        // Valores acima da média preenchem a barra, sem ultrapassar 100%.
        progressPercent: granularity === "month"
          ? Math.min(100, Math.round((received / average) * 100))
          : null,
      };
    }),
    capacities: capacityRows.map((row) => {
      const capacity = row.capacity;
      const difference =
        capacity === null || granularity !== "month"
          ? null
          : row.received - capacity;

      return {
        id: row.id,
        product: row.product,
        company: row.enterpriseId === ENTERPRISE_IDS.ICX ? "ICX" as const : "INRI" as const,
        susepCode: row.susepCode,
        received: row.received,
        capacity,
        difference,
        status: capacity === null
          ? "unconfigured" as const
          : granularity !== "month"
            ? "reference" as const
          : difference < 0
            ? "below" as const
            : difference === 0
              ? "met" as const
              : "over" as const,
      };
    }),
    pendingDates: pendingRows.slice(0, PENDING_PAGE_SIZE),
    pendingPage,
    pendingDatesHasMore: pendingRows.length > PENDING_PAGE_SIZE,
  };
};
