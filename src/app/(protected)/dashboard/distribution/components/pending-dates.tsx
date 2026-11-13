import { CalendarDaysIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type {
  DashboardCompany,
  DistributionDashboardData,
} from "@/src/data/dashboard/get-distribution-dashboard";
import { formatDate } from "@/src/utils/date-formatters";

type Pending = Pick<
  DistributionDashboardData,
  "pendingDates" | "pendingDatesHasMore" | "pendingPage"
>;

const formatNumber = new Intl.NumberFormat("pt-BR");

const PendingDates = ({
  pendingDates,
  pendingDatesHasMore,
  pendingPage,
  month,
  company,
}: Pending & { month: string; company: DashboardCompany }) => {
  const urlFor = (page: number) =>
    "/dashboard/distribution?month=" + encodeURIComponent(month) +
    (company === "all" ? "" : "&company=" + company) +
    "&pendingPage=" + page;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDaysIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          Datas com oportunidades pendentes
        </CardTitle>
        <CardDescription>
          Oportunidades disponíveis para distribuir, de qualquer mês.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {pendingDates.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Não há pendências nesta página.
          </p>
        ) : (
          pendingDates.map((item) => (
            <div
              key={item.date ?? "sem-data"}
              className="space-y-3 border-b border-border/60 py-3 last:border-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CalendarDaysIcon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-xs">
                    {item.date
                      ? formatDate(new Date(item.date + "T15:00:00Z"))
                      : "Sem data de chegada"}
                  </span>
                </div>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {formatNumber.format(item.pending)} pendentes
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([
                  { label: "LEAD", count: item.lead },
                  { label: "VÍNCULO", count: item.vinculo },
                  { label: "CONTINGÊNCIA", count: item.contingencia },
                ] as const).map(({ label, count }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2"
                  >
                    <span className="text-[11px] font-medium">{label}</span>
                    <Badge
                      variant={count === 0 ? "outline" : "secondary"}
                      className="shrink-0 tabular-nums"
                    >
                      {formatNumber.format(count)} {count > 1 ? "PENDENTES" : "PENDENTE"}
                    </Badge>
                  </div>
                ))}
              </div>
              {item.withoutModel > 0 && (
                <p className="text-xs text-muted-foreground">
                  Sem modelo: {formatNumber.format(item.withoutModel)} pendente(s)
                </p>
              )}
            </div>
          ))
        )}
        {(pendingPage > 1 || pendingDatesHasMore) && (
          <nav
            aria-label="Paginação das datas pendentes"
            className="flex justify-between gap-3 pt-4"
          >
            {pendingPage > 1 ? (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={urlFor(pendingPage - 1)} />}
              >
                Anterior
              </Button>
            ) : (
              <span />
            )}
            <span className="self-center text-xs text-muted-foreground">
              Página {pendingPage}
            </span>
            {pendingDatesHasMore ? (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={urlFor(pendingPage + 1)} />}
              >
                Próxima
              </Button>
            ) : (
              <span />
            )}
          </nav>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingDates;
