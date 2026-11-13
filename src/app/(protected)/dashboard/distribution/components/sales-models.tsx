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
      <CardDescription>Oportunidades recebidas no mês.</CardDescription>
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
                role="progressbar"
                aria-label={label}
                aria-valuenow={item.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                title={item.progressPercent + "% da média mensal"}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: item.progressPercent + "%" }}
                />
              </div>
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">
        Progresso em relação à média mensal de chegadas.
      </p>
    </CardContent>
  </Card>
);

export default SalesModels;
