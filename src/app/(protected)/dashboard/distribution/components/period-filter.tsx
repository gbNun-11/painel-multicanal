"use client";

import { CalendarDaysIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ptBR } from "react-day-picker/locale";

import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import type {
  DashboardCompany,
  DashboardPeriodMode,
  DistributionDashboardData,
} from "@/src/data/dashboard/get-distribution-dashboard";

type Period = DistributionDashboardData["period"];

interface MonthOption {
  value: string;
  label: string;
}

const getDateParts = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};

const formatDayKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const buildPeriodHref = (
  mode: DashboardPeriodMode,
  value: string,
  company: DashboardCompany,
) => {
  const query = new URLSearchParams();

  if (company !== "all") query.set("company", company);

  if (mode === "day") {
    query.set("period", "day");
    query.set("date", value);
  } else if (mode === "year") {
    query.set("period", "year");
    query.set("year", value);
  } else {
    query.set("month", value);
  }

  return "/dashboard/distribution?" + query.toString();
};

const PeriodFilter = ({
  period,
  months,
}: {
  period: Period;
  months: MonthOption[];
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<DashboardPeriodMode>(period.granularity);

  useEffect(() => {
    setMode(period.granularity);
  }, [period.granularity]);

  const years = useMemo(
    () => Array.from(new Set(months.map(({ value }) => value.slice(0, 4)))),
    [months],
  );

  const oldestMonth = months[months.length - 1]?.value;
  const newestMonth = months[0]?.value;

  const dateLimitStart = oldestMonth
    ? getDateParts(oldestMonth + "-01")
    : undefined;
  const dateLimitEnd = newestMonth
    ? getDateParts(newestMonth + "-01")
    : undefined;

  const selectedDay = getDateParts(period.date);

  return (
    <details className="group relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-3 text-xs font-medium select-none hover:bg-accent [&::-webkit-details-marker]:hidden">
        <CalendarDaysIcon className="size-4" aria-hidden="true" />
        {months.length > 0 ? period.label : "Sem datas da Porto"}
        <ChevronDownIcon
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="absolute right-0 z-30 mt-1 w-[min(90vw,350px)] rounded-md border bg-popover p-3 shadow-md">
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-md bg-muted/60 p-1" aria-label="Agrupamento do período">
          {([
            ["day", "Dia"],
            ["month", "Mês"],
            ["year", "Ano"],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={mode === value ? "secondary" : "ghost"}
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className="w-full"
            >
              {label}
            </Button>
          ))}
        </div>

        {months.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Não há oportunidades com data de chegada informada pela Porto.
          </p>
        ) : mode === "day" ? (
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDay}
              defaultMonth={selectedDay}
              locale={ptBR}
              captionLayout="dropdown"
              startMonth={dateLimitStart}
              endMonth={dateLimitEnd}
              onSelect={(selected) => {
                if (!selected) return;

                router.push(
                  buildPeriodHref(
                    "day",
                    formatDayKey(selected),
                    period.company,
                  ),
                );
              }}
              className="p-0"
            />
          </div>
        ) : mode === "month" ? (
          <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto">
            {months.map(({ value, label }) => (
              <Link
                key={value}
                href={buildPeriodHref("month", value, period.company)}
                aria-current={
                  period.granularity === "month" && period.month === value
                    ? "page"
                    : undefined
                }
                className={
                  period.granularity === "month" && period.month === value
                    ? "rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
                    : "rounded-md px-3 py-2 text-xs hover:bg-accent"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto">
            {years.map((year) => (
              <Link
                key={year}
                href={buildPeriodHref("year", year, period.company)}
                aria-current={
                  period.granularity === "year" && period.year === year
                    ? "page"
                    : undefined
                }
                className={
                  period.granularity === "year" && period.year === year
                    ? "rounded-md bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary"
                    : "rounded-md px-3 py-2 text-center text-xs hover:bg-accent"
                }
              >
                {year}
              </Link>
            ))}
          </div>
        )}
      </div>
    </details>
  );
};

export default PeriodFilter;
