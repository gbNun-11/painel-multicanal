import { XIcon } from "lucide-react";
import Link from "next/link";

import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";

import { dashboardHref } from "./dashboard-links";

type Period = DistributionDashboardData["period"];
type Filters = DistributionDashboardData["filters"];

const modelLabels = {
  LEAD: "Lead",
  VINCULO: "Vínculo",
  CONTINGENCIA: "Contingência",
} as const;

const ActiveDashboardFilters = ({
  period,
  filters,
}: {
  period: Period;
  filters: Filters;
}) => {
  if (!filters.product && !filters.model && !filters.salespersonId) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros interativos ativos">
      <span className="text-xs text-muted-foreground">Filtros ativos:</span>
      {filters.product && (
        <Link
          href={dashboardHref(period, filters, { product: null })}
          title="Remover filtro de produto"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium hover:bg-muted"
        >
          Produto: {filters.product}
          <XIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </Link>
      )}
      {filters.model && (
        <Link
          href={dashboardHref(period, filters, { model: null })}
          title="Remover filtro de modelo"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium hover:bg-muted"
        >
          Modelo: {modelLabels[filters.model]}
          <XIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </Link>
      )}
      {filters.salespersonId && (
        <Link
          href={dashboardHref(period, filters, { salespersonId: null })}
          title="Remover filtro de vendedor"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium hover:bg-muted"
        >
          Vendedor: {filters.salespersonName ?? "Vendedor selecionado"}
          <XIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </Link>
      )}
      <Link
        href={dashboardHref(period, filters, { product: null, model: null, salespersonId: null })}
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Limpar filtros
      </Link>
    </div>
  );
};

export default ActiveDashboardFilters;
