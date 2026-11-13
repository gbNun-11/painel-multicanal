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
  normalizeDashboardYear,
} from "@/src/data/dashboard/get-distribution-dashboard";

import CapacityTable from "./components/capacity-table";
import DashboardFilters from "./components/dashboard-filters";
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
          <DashboardFilters period={data.period} months={monthOptions} />
        </PageActions>
      </PageHeader>

      <PageContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Recebidos"
            value={formatNumber.format(data.summary.received)}
            icon={InboxIcon}
            description="Chegadas da Porto no período"
          />
          <SummaryCard
            title="Distribuídos"
            value={formatNumber.format(data.summary.distributed)}
            icon={SendIcon}
            description="Recebidas no período, já distribuídas"
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
            <ProductsChart products={data.products} />
          </section>
          <section className="min-w-0" aria-label="Ranking de vendedores">
            <SalespeopleRanking salespeople={data.salespeople} />
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
              pendingPage={data.pendingPage}
              pendingDatesHasMore={data.pendingDatesHasMore}
            />
          </section>
          <section className="min-w-0" aria-label="Modelos de venda recebidos">
            <SalesModels models={data.models} />
          </section>
        </div>

        <section aria-label="Capacidade de LEAD da Porto">
          <CapacityTable
            capacities={data.capacities}
            periodLabel={data.period.label}
            granularity={data.period.granularity}
          />
        </section>
      </PageContent>
    </PageContainer>
  );
};

export default DistributionDashboardPage;
