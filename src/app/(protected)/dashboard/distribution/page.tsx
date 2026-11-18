import {
  AlertTriangleIcon,
  Clock3Icon,
  InboxIcon,
  SendIcon,
} from "lucide-react";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";
import {
  getDashboardMonthOptions,
  getDistributionDashboard,
  normalizeDashboardCompany,
  normalizeDashboardDate,
  normalizeDashboardMonth,
  normalizeDashboardPeriodMode,
  normalizeDashboardSalespersonId,
  normalizeDashboardYear,
} from "@/src/data/dashboard/get-distribution-dashboard";

import CapacityTable from "./components/capacity-table";
import DashboardFilters from "./components/dashboard-filters";
import ActiveDashboardFilters from "./components/active-dashboard-filters";
import PendingDates from "./components/pending-dates";
import ProductsChart from "./components/products-chart";
import SalesModels from "./components/sales-models";
import SalespeopleRanking from "./components/salespeople-ranking";
import SummaryCard from "./components/summary-card";

interface DashboardPageProps {
  searchParams: Promise<{
    month?: string | string[];
    date?: string | string[];
    from?: string | string[];
    to?: string | string[];
    year?: string | string[];
    period?: string | string[];
    company?: string | string[];
    product?: string | string[];
    model?: string | string[];
    salespersonId?: string | string[];
    pendingPage?: string | string[];
  }>;
}

const formatNumber = new Intl.NumberFormat("pt-BR");

const formatMinutes = (minutes: number | null) => {
  if (minutes === null) return "—";

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainder = minutes % 60;

  if (days > 0) {
    return days + "d " + hours + "h";
  }

  if (hours > 0) {
    return hours + "h " + remainder + "m";
  }

  return minutes + "m";
};

const DistributionDashboardPage = async ({
  searchParams,
}: DashboardPageProps) => {
  const params = await searchParams;
  const month = typeof params.month === "string" ? params.month : undefined;
  const rawDate = typeof params.from === "string"
    ? params.from
    : typeof params.date === "string"
      ? params.date
      : undefined;
  const rawDateEnd = typeof params.to === "string" ? params.to : undefined;
  const rawYear = typeof params.year === "string" ? params.year : undefined;
  const granularity = normalizeDashboardPeriodMode(
    typeof params.period === "string" ? params.period : undefined,
  );
  const company = normalizeDashboardCompany(
    typeof params.company === "string" ? params.company : undefined,
  );
  const pendingPage =
    typeof params.pendingPage === "string"
      ? Number(params.pendingPage)
      : undefined;
  const product = typeof params.product === "string" &&
    params.product.trim().length > 0 && params.product.length <= 150
      ? params.product.trim()
      : undefined;
  const model = params.model === "LEAD" ||
    params.model === "VINCULO" ||
    params.model === "CONTINGENCIA"
      ? params.model
      : undefined;

  const salespersonId = normalizeDashboardSalespersonId(
    typeof params.salespersonId === "string" ? params.salespersonId : undefined,
  );

  const monthOptions = await getDashboardMonthOptions(company);

  const requestedMonth = normalizeDashboardMonth(
    granularity === "day" && rawDate
      ? rawDate.slice(0, 7)
      : granularity === "year" && rawYear
        ? monthOptions.find((option) => option.value.startsWith(rawYear))?.value
        : month,
  );

  const selectedMonth = monthOptions.some(
    (option) => option.value === requestedMonth,
  )
    ? requestedMonth
    : (monthOptions[0]?.value ?? requestedMonth);

  const selectedDate = normalizeDashboardDate(rawDate, selectedMonth);
  const selectedDateEnd = rawDateEnd
    ? normalizeDashboardDate(rawDateEnd, selectedMonth)
    : selectedDate;
  const selectedYear = normalizeDashboardYear(rawYear, selectedMonth);

  const data = await getDistributionDashboard({
    month: selectedMonth,
    date: selectedDate,
    dateEnd: selectedDateEnd,
    year: selectedYear,
    granularity,
    company,
    product,
    model,
    salespersonId,
    pendingPage,
  });


  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard de Distribuição</PageTitle>
          <PageDescription>
            Visão operacional das oportunidades recebidas e distribuídas.
          </PageDescription>
        </PageHeaderContent>

        <PageActions>
          <DashboardFilters period={data.period} months={monthOptions} filters={data.filters} />
        </PageActions>
      </PageHeader>

      <PageContent>
        <ActiveDashboardFilters period={data.period} filters={data.filters} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Recebidos"
            value={formatNumber.format(data.summary.received)}
            icon={InboxIcon}
            description={
              data.filters.salespersonId
                ? "Chegadas atribuídas ao vendedor no período"
                : "Chegadas da Porto no período"
            }
          />
          <SummaryCard
            title="Distribuídos"
            value={formatNumber.format(data.summary.distributed)}
            icon={SendIcon}
            description={
              data.filters.salespersonId
                ? "Atribuídas ao vendedor e já distribuídas"
                : "Recebidas no período, já distribuídas"
            }
          />
          <SummaryCard
            title="Lotes com erro"
            value={formatNumber.format(data.summary.errorBatches)}
            icon={AlertTriangleIcon}
            description="Pendências atuais"
            negative
          />
          <SummaryCard
            title="Tempo médio"
            value={formatMinutes(data.summary.averageDistributionMinutes)}
            icon={Clock3Icon}
            description="Da chegada à distribuição"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <section
            className="min-w-0 xl:col-span-2"
            aria-label="Comparativo de produtos"
          >
            <ProductsChart products={data.products} period={data.period} filters={data.filters} />
          </section>
          <section className="min-w-0" aria-label="Ranking de vendedores">
            <SalespeopleRanking
              salespeople={data.salespeople}
              period={data.period}
              filters={data.filters}
            />
          </section>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <section
            className="min-w-0 xl:col-span-2"
            aria-label="Pendências por data de chegada"
          >
            <PendingDates
              month={data.period.month}
              date={data.period.date}
              dateEnd={data.period.dateEnd}
              year={data.period.year}
              granularity={data.period.granularity}
              company={company}
              pendingDates={data.pendingDates}
              filters={data.filters}
              pendingPage={data.pendingPage}
              pendingDatesHasMore={data.pendingDatesHasMore}
            />
          </section>
          <section className="min-w-0" aria-label="Modelos de venda recebidos">
            <SalesModels models={data.models} period={data.period} filters={data.filters} />
          </section>
        </div>

        <section aria-label="Capacidade de LEAD da Porto">
          {data.filters.model && data.filters.model !== "LEAD" ? (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              O Capacity é exclusivo de LEAD. Remova o filtro de modelo ou selecione LEAD para comparar os limites por produto.
            </div>
          ) : data.filters.salespersonId ? (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              O Capacity é definido por empresa e produto, não por vendedor. Remova o filtro de vendedor para comparar recebimento e capacidade total.
            </div>
          ) : (
            <CapacityTable
              capacities={data.capacities}
              periodLabel={data.period.label}
              period={data.period}
              filters={data.filters}
            />
          )}
        </section>
      </PageContent>
    </PageContainer>
  );
};

export default DistributionDashboardPage;
