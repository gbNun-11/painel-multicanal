import { LinkIcon, ShieldAlertIcon, UsersRoundIcon } from "lucide-react";
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

type Models = DistributionDashboardData["models"];

const modelInfo = {
  LEAD: { label: "Lead", icon: UsersRoundIcon },
  VINCULO: { label: "Vínculo", icon: LinkIcon },
  CONTINGENCIA: { label: "Contingência", icon: ShieldAlertIcon },
} as const;
const formatNumber = new Intl.NumberFormat("pt-BR");

const SalesModels = ({
  models,
  period,
  filters,
}: {
  models: Models;
  period: DistributionDashboardData["period"];
  filters: DistributionDashboardData["filters"];
}) => (
  <Card className="h-[380px]">
    <CardHeader>
      <CardTitle>Modelos de venda</CardTitle>
      <CardDescription>Oportunidades recebidas no período.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      {models.map((item) => {
        const { label, icon: Icon } = modelInfo[item.model];

        return (
          <Link
            key={item.model}
            href={dashboardHref(period, filters, {
              model: filters.model === item.model ? null : item.model,
            })}
            aria-label={
              (filters.model === item.model ? "Remover filtro" : "Filtrar") +
              " por modelo " + label
            }
            aria-current={filters.model === item.model ? "true" : undefined}
            className={
              "flex items-center gap-3 rounded-md p-1 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
              (filters.model === item.model
                ? "bg-primary/10 ring-1 ring-primary/50"
                : "")
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatNumber.format(item.received)}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role={item.progressPercent === null ? undefined : "progressbar"}
                aria-label={item.progressPercent === null ? undefined : label}
                aria-valuenow={item.progressPercent ?? undefined}
                aria-valuemin={item.progressPercent === null ? undefined : 0}
                aria-valuemax={item.progressPercent === null ? undefined : 100}
                title={
                  item.referenceTotal === null
                    ? item.model === "LEAD"
                      ? "Configure o Capacity de todos os produtos para calcular a meta de LEAD."
                      : "Não há meta de Vínculo/Contingência cadastrada por produto."
                    : "Meta de 100% para o período: " +
                      formatNumber.format(item.referenceTotal) +
                      " (" +
                      (item.model === "LEAD"
                        ? "soma dos Capacity diários cadastrados"
                        : "referência média diária da empresa") +
                      ")"
                }
              >
                {item.progressPercent !== null && (
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: item.progressPercent + "%" }}
                  />
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </CardContent>
  </Card>
);

export default SalesModels;
