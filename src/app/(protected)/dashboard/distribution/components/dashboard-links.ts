import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";

type Period = DistributionDashboardData["period"];
type Filters = DistributionDashboardData["filters"];

type Changes = {
  company?: Period["company"];
  product?: string | null;
  model?: Filters["model"];
  pendingPage?: number;
};

// Uma única origem para links dos gráficos, chips e paginação.
// Nunca perde data/empresa nem os outros filtros ao alterar um deles.
export const dashboardHref = (
  period: Period,
  filters: Filters,
  changes: Changes = {},
) => {
  const query = new URLSearchParams();
  const company = changes.company ?? period.company;
  const product = changes.product === undefined ? filters.product : changes.product;
  const model = changes.model === undefined ? filters.model : changes.model;

  if (company !== "all") query.set("company", company);

  if (period.granularity === "day") {
    query.set("period", "day");
    query.set("from", period.date);
    query.set("to", period.dateEnd);
  } else if (period.granularity === "year") {
    query.set("period", "year");
    query.set("year", period.year);
  } else {
    query.set("month", period.month);
  }

  if (product) query.set("product", product);
  if (model) query.set("model", model);
  if (changes.pendingPage && changes.pendingPage > 1) {
    query.set("pendingPage", String(changes.pendingPage));
  }

  return "/dashboard/distribution?" + query.toString();
};
