"use client";

import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
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

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

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

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

const buildPeriodHref = (
  mode: DashboardPeriodMode,
  value: string,
  company: DashboardCompany,
  endDate?: string,
) => {
  const query = new URLSearchParams();

  if (company !== "all") query.set("company", company);

  if (mode === "day") {
    query.set("period", "day");
    query.set("from", value);
    query.set("to", endDate ?? value);
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
  const [range, setRange] = useState<DateRange | undefined>({
    from: getDateParts(period.date),
    to: getDateParts(period.dateEnd),
  });
  const [visibleYear, setVisibleYear] = useState(
    Number(period.month.slice(0, 4)),
  );
  const years = useMemo(
    () =>
      Array.from(
        new Set(months.map(({ value }) => Number(value.slice(0, 4)))),
      ).sort((left, right) => left - right),
    [months],
  );
  const [yearPage, setYearPage] = useState(() =>
    Math.max(0, Math.floor(years.indexOf(Number(period.year)) / 9)),
  );

  const availableMonths = useMemo(
    () => new Set(months.map(({ value }) => value)),
    [months],
  );

  // As opções vêm do banco do mais recente para o mais antigo.
  const oldestMonth = months[months.length - 1]?.value;
  const newestMonth = months[0]?.value;
  const firstYear = years[0] ?? visibleYear;
  const lastYear = years[years.length - 1] ?? visibleYear;

  const startMonth = oldestMonth
    ? getDateParts(oldestMonth + "-01")
    : undefined;
  const endMonth = newestMonth
    ? getDateParts(newestMonth + "-01")
    : undefined;

  const selectedDay = getDateParts(period.date);
  const twoMonths = months.length > 1;
  const firstDisplayedMonth = new Date(
    selectedDay.getFullYear(),
    selectedDay.getMonth() - (twoMonths ? 1 : 0),
    1,
  );
  const calendarStart =
    startMonth && firstDisplayedMonth < startMonth
      ? startMonth
      : firstDisplayedMonth;

  const yearsOnPage = years.slice(yearPage * 9, (yearPage + 1) * 9);
  const lastYearPage = Math.max(0, Math.ceil(years.length / 9) - 1);

  const applyDayRange = () => {
    if (!range?.from) return;

    router.push(
      buildPeriodHref(
        "day",
        formatDayKey(range.from),
        period.company,
        formatDayKey(range.to ?? range.from),
      ),
    );
  };

  // O mesmo estado atende ao calendário de 1 mês (mobile) e ao de 2 meses.
  const rangeCalendarProps = {
    mode: "range" as const,
    selected: range,
    onSelect: setRange,
    locale: ptBR,
    captionLayout: "label" as const,
    navLayout: "after" as const,
    startMonth,
    endMonth,
    defaultMonth: calendarStart,
    className: "p-0",
  };

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

      <div className="absolute right-0 z-30 mt-1 w-[min(94vw,350px)] rounded-md border bg-popover p-3 shadow-md sm:w-[min(94vw,665px)]">
        <div
          className="mb-4 grid grid-cols-3 gap-1 rounded-md bg-muted/60 p-1"
          aria-label="Agrupamento do período"
        >
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
          <div className="space-y-3">
            <div className="flex justify-center sm:hidden">
              <Calendar {...rangeCalendarProps} numberOfMonths={1} />
            </div>
            <div className="hidden justify-center sm:flex">
              <Calendar
                {...rangeCalendarProps}
                numberOfMonths={twoMonths ? 2 : 1}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div className="text-xs text-muted-foreground">
                {range?.from
                  ? formatDay(range.from) +
                    " – " +
                    formatDay(range.to ?? range.from)
                  : "Selecione o dia inicial e o final."}
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!range?.from}
                onClick={applyDayRange}
              >
                Aplicar período
              </Button>
            </div>
          </div>
        ) : mode === "month" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Ano anterior"
                disabled={visibleYear <= firstYear}
                onClick={() => setVisibleYear((value) => value - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="text-sm font-medium">{visibleYear}</span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Ano seguinte"
                disabled={visibleYear >= lastYear}
                onClick={() => setVisibleYear((value) => value + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((name, index) => {
                const month = visibleYear + "-" + String(index + 1).padStart(2, "0");
                const active = availableMonths.has(month);
                const selected =
                  period.granularity === "month" && period.month === month;

                return (
                  <Button
                    key={month}
                    type="button"
                    size="lg"
                    variant={selected ? "secondary" : "ghost"}
                    disabled={!active}
                    aria-pressed={selected}
                    onClick={() =>
                      router.push(buildPeriodHref("month", month, period.company))
                    }
                    className="w-full"
                  >
                    {name}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Anos anteriores"
                disabled={yearPage === 0}
                onClick={() => setYearPage((value) => value - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="text-sm font-medium">
                {yearsOnPage[0]}
                {yearsOnPage.length > 1
                  ? " – " + yearsOnPage[yearsOnPage.length - 1]
                  : ""}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Próximos anos"
                disabled={yearPage >= lastYearPage}
                onClick={() => setYearPage((value) => value + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {yearsOnPage.map((year) => {
                const selected =
                  period.granularity === "year" && period.year === String(year);

                return (
                  <Button
                    key={year}
                    type="button"
                    size="lg"
                    variant={selected ? "secondary" : "ghost"}
                    aria-pressed={selected}
                    onClick={() =>
                      router.push(
                        buildPeriodHref("year", String(year), period.company),
                      )
                    }
                    className="w-full"
                  >
                    {year}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </details>
  );
};

export default PeriodFilter;
