import { ChartColumnIcon } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";

import { dashboardHref } from "./dashboard-links";

type Products = DistributionDashboardData["products"];
const formatNumber = new Intl.NumberFormat("pt-BR");

const ProductsChart = ({
  products,
  period,
  filters,
}: {
  products: Products;
  period: DistributionDashboardData["period"];
  filters: DistributionDashboardData["filters"];
}) => {
  const max = Math.max(1, ...products.map((item) => item.received));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartColumnIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          Produtos
        </CardTitle>
        <CardDescription>
          Recebidos no período e quantos desses já foram distribuídos.
        </CardDescription>
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500" />
            Recebidos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" />
            Distribuídos
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
            Nenhum produto recebido neste período.
          </p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div
              className="flex min-h-64 items-end gap-3"
              style={{ minWidth: Math.max(products.length * 75, 320) }}
              role="list"
              aria-label="Comparativo de oportunidades por produto"
            >
              {products.map((item) => {
                const received = (item.received / max) * 100;
                const distributed = (item.distributed / max) * 100;

                return (
                  <div
                    key={item.product}
                    className="flex min-w-0 flex-1"
                    role="listitem"
                  >
                    <Link
                      href={dashboardHref(period, filters, {
                        product: filters.product === item.product ? null : item.product,
                      })}
                      aria-label={
                        (filters.product === item.product ? "Remover filtro" : "Filtrar") +
                        " por produto " + item.product
                      }
                      aria-current={filters.product === item.product ? "true" : undefined}
                      title={
                        item.product + ": " +
                        formatNumber.format(item.received) + " recebidas, " +
                        formatNumber.format(item.distributed) + " distribuídas"
                      }
                      className={
                        "flex w-full min-w-0 flex-col items-center gap-2 rounded-md px-1 pb-1 pt-2 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring " +
                        (filters.product === item.product
                          ? "bg-primary/10 ring-1 ring-primary/50"
                          : "")
                      }
                    >
                      <div
                        className="relative h-52 w-full max-w-12"
                        aria-hidden="true"
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-t-md bg-emerald-500"
                          style={{ height: received + "%" }}
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-t-md bg-primary"
                          style={{ height: distributed + "%" }}
                        />
                      </div>
                      <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                        {item.product}
                      </span>
                      <span className="sr-only">
                        {formatNumber.format(item.received)} recebidas;
                        {formatNumber.format(item.distributed)} distribuídas.
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsChart;
