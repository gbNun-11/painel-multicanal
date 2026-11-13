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
import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";
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
}: Pending & { month: string }) => {
  const urlFor = (page: number) =>
    "/dashboard/distribution?month=" + encodeURIComponent(month) +
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
              className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0"
            >
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
