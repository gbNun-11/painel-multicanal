import { LinkIcon, ShieldAlertIcon, UsersRoundIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";

type Models = DistributionDashboardData["models"];

const modelInfo = {
  LEAD: { label: "Lead", icon: UsersRoundIcon },
  VINCULO: { label: "Vínculo", icon: LinkIcon },
  CONTINGENCIA: { label: "Contingência", icon: ShieldAlertIcon },
} as const;
const formatNumber = new Intl.NumberFormat("pt-BR");

const SalesModels = ({ models }: { models: Models }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>Modelos de venda</CardTitle>
      <CardDescription>Oportunidades recebidas no período.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      {models.map((item) => {
        const { label, icon: Icon } = modelInfo[item.model];

        return (
          <div key={item.model} className="flex items-center gap-3">
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
                title={item.progressPercent === null
                  ? "Referência " +
                    (item.referencePeriod === "daily" ? "diária" : "mensal") +
                    "; sem comparação neste período."
                  : item.progressPercent + "% da referência " +
                    (item.referencePeriod === "daily" ? "diária" : "mensal") +
                    " (" + formatNumber.format(item.received) +
                    " de " + formatNumber.format(item.referenceTotal ?? 0) + ")"}
              >
                {item.progressPercent !== null && (
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: item.progressPercent + "%" }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">
        LEAD: referência diária (proporcional aos dias selecionados). Vínculo
        e Contingência: referências mensais.
      </p>
    </CardContent>
  </Card>
);

export default SalesModels;
