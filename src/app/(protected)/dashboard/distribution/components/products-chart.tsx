import { ChartColumnIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";

type Products = DistributionDashboardData["products"];
const formatNumber = new Intl.NumberFormat("pt-BR");

const ProductsChart = ({ products }: { products: Products }) => {
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
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    role="listitem"
                    title={
                      item.product + ": " +
                      formatNumber.format(item.received) + " recebidas, " +
                      formatNumber.format(item.distributed) + " distribuídas"
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
