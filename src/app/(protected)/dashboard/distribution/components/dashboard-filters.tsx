"use client";

import { Building2Icon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";

import PeriodFilter from "./period-filter";

type Period = DistributionDashboardData["period"];
type Company = Period["company"];
type OpenFilter = "company" | "period" | null;

interface MonthOption {
  value: string;
  label: string;
}

const DashboardFilters = ({
  period,
  months,
}: {
  period: Period;
  months: MonthOption[];
}) => {
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const toggleFilter = (filter: Exclude<OpenFilter, null>) => {
    setOpenFilter((current) => (current === filter ? null : filter));
  };

  useEffect(() => {
    if (openFilter === null) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilter(null);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openFilter]);

  const companyHref = (selectedCompany: Company) => {
    const query = new URLSearchParams();
    if (selectedCompany !== "all") query.set("company", selectedCompany);

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

    return "/dashboard/distribution?" + query.toString();
  };

  return (
    <div ref={filtersRef} className="flex flex-wrap items-center gap-2">
      <details open={openFilter === "company"} className="group relative">
        <summary
          onClick={(event) => {
            event.preventDefault();
            toggleFilter("company");
          }}
          className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-3 text-xs font-medium select-none hover:bg-accent [&::-webkit-details-marker]:hidden"
        >
          <Building2Icon className="size-4" aria-hidden="true" />
          {period.company === "all" ? "Ambas as empresas" : period.company}
          <ChevronDownIcon
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="absolute right-0 z-30 mt-1 min-w-48 rounded-md border bg-popover p-1 shadow-md">
          {([
            { value: "all", label: "Ambas as empresas" },
            { value: "ICX", label: "ICX" },
            { value: "INRI", label: "INRI" },
          ] as const).map((option) => (
            <Link
              key={option.value}
              href={companyHref(option.value)}
              onClick={() => setOpenFilter(null)}
              aria-current={option.value === period.company ? "page" : undefined}
              className={
                option.value === period.company
                  ? "block rounded-sm bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
                  : "block rounded-sm px-3 py-2 text-xs hover:bg-accent"
              }
            >
              {option.label}
            </Link>
          ))}
        </div>
      </details>
      <PeriodFilter
        key={[period.granularity, period.label, period.company].join(":")}
        period={period}
        months={months}
        open={openFilter === "period"}
        onToggle={() => toggleFilter("period")}
        onClose={() => setOpenFilter(null)}
      />
    </div>
  );
};

export default DashboardFilters;
