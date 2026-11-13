import {
  AlertTriangleIcon,
  Building2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  Clock3Icon,
  InboxIcon,
  SendIcon,
} from "lucide-react";
import Link from "next/link";

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
  normalizeDashboardMonth,
} from "@/src/data/dashboard/get-distribution-dashboard";

import CapacityTable from "./components/capacity-table";
import PendingDates from "./components/pending-dates";
import ProductsChart from "./components/products-chart";
import SalesModels from "./components/sales-models";
import SalespeopleRanking from "./components/salespeople-ranking";
import SummaryCard from "./components/summary-card";

interface DashboardPageProps {
  searchParams: Promise<{
    month?: string | string[];
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
  const company = normalizeDashboardCompany(
    typeof params.company === "string" ? params.company : undefined,
  );
  const pendingPage =
    typeof params.pendingPage === "string"
      ? Number(params.pendingPage)
      : undefined;

  const monthOptions = await getDashboardMonthOptions(company);
  const requestedMonth = normalizeDashboardMonth(month);
  const selectedMonth = monthOptions.some(
    (option) => option.value === requestedMonth,
  )
    ? requestedMonth
    : (monthOptions[0]?.value ?? requestedMonth);

  const data = await getDistributionDashboard({
    month: selectedMonth,
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
          <details className="group relative">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-3 text-xs font-medium select-none hover:bg-accent [&::-webkit-details-marker]:hidden">
              <Building2Icon className="size-4" aria-hidden="true" />
              {company === "all" ? "Ambas as empresas" : company}
              <ChevronDownIcon
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="absolute right-0 z-30 mt-1 min-w-48 rounded-md border bg-popover p-1 shadow-md">
              {([
                { value: "all", label: "Ambas as empresas" },
                { value: "ICX", label: "ICX" },
                { value: "INRI", label: "INRI" },
              ] as const).map((option) => (
                <Link
                  key={option.value}
                  href={
                    "/dashboard/distribution?month=" +
                    encodeURIComponent(data.period.month) +
                    (option.value === "all" ? "" : "&company=" + option.value)
                  }
                  aria-current={option.value === company ? "page" : undefined}
                  className={
                    option.value === company
                      ? "block rounded-sm bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
                      : "block rounded-sm px-3 py-2 text-xs hover:bg-accent"
                  }
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </details>
          <details className="group relative">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-3 text-xs font-medium select-none hover:bg-accent [&::-webkit-details-marker]:hidden">
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
              {monthOptions.length > 0
                ? data.period.label
                : "Sem meses com oportunidades"}
              <ChevronDownIcon
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="absolute right-0 z-30 mt-1 max-h-72 min-w-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
              {monthOptions.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Nenhuma oportunidade cadastrada.
                </p>
              )}
              {monthOptions.map((option) => (
                <Link
                  key={option.value}
                  href={
                    "/dashboard/distribution?month=" +
                    encodeURIComponent(option.value) +
                    (company === "all" ? "" : "&company=" + company)
                  }
                  aria-current={
                    option.value === data.period.month ? "page" : undefined
                  }
                  className={
                    option.value === data.period.month
                      ? "block rounded-sm bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
                      : "block rounded-sm px-3 py-2 text-xs hover:bg-accent"
                  }
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </details>
        </PageActions>
      </PageHeader>

      <PageContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Recebidos"
            value={formatNumber.format(data.summary.received)}
            icon={InboxIcon}
            description="Chegadas no mês"
          />
          <SummaryCard
            title="Distribuídos"
            value={formatNumber.format(data.summary.distributed)}
            icon={SendIcon}
            description="Distribuições no mês"
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
          />
        </section>
      </PageContent>
    </PageContainer>
  );
};

export default DistributionDashboardPage;
