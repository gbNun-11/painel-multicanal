"use client";

import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import type { DistributionDashboardData } from "@/src/data/dashboard/get-distribution-dashboard";

type Capacity = DistributionDashboardData["capacities"][number];

const numberFormatter = new Intl.NumberFormat("pt-BR");

const statusStyle: Record<
  Capacity["status"],
  { label: string; className: string }
> = {
  below: {
    label: "NÃO ATINGIDO",
    className: "border-red-500/15 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  met: {
    label: "ATINGIDO",
    className:
      "border-emerald-500/15 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  over: {
    label: "ULTRAPASSADO",
    className:
      "border-amber-500/15 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  unconfigured: {
    label: "NÃO CONFIGURADO",
    className: "border-border bg-muted/50 text-muted-foreground",
  },
};

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();

const CapacityTable = ({
  capacities,
  periodLabel,
}: {
  capacities: DistributionDashboardData["capacities"];
  periodLabel: string;
}) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = normalizeSearch(search);

    return term
      ? capacities.filter((item) =>
          normalizeSearch(item.product + " " + item.company).includes(term),
        )
      : capacities;
  }, [capacities, search]);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontalIcon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Capacidade de recebimento — Porto
            </CardTitle>
            <CardDescription>
              LEAD recebido em {periodLabel}; limite cadastrado por empresa,
              produto lógico e vínculo multicanal.
            </CardDescription>
          </div>
          <Badge variant="outline">LEAD</Badge>
        </div>
        <div className="relative w-full max-w-sm">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Pesquisar produto ou empresa"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar produto ou empresa..."
            className="h-9 pl-9"
            type="search"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Recebidos</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const appearance = statusStyle[item.status];
              return (
                <TableRow key={item.id}>
                  <TableCell className="min-w-48 py-3">
                    <div className="space-y-2">
                      <span className="font-medium">{item.product}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {item.company}
                        </span>
                        <Badge
                          variant="outline"
                          className={appearance.className}
                        >
                          {appearance.label}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormatter.format(item.received)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.capacity === null
                      ? "—"
                      : numberFormatter.format(item.capacity)}
                  </TableCell>
                  <TableCell
                    className={
                      "text-right font-medium tabular-nums " +
                      (item.status === "below"
                        ? "text-red-600 dark:text-red-400"
                        : item.status === "met"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : item.status === "over"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground")
                    }
                  >
                    {item.difference === null
                      ? "—"
                      : (item.difference > 0 ? "+" : "") +
                        numberFormatter.format(item.difference)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {capacities.length === 0
              ? "Nenhuma configuração multicanal ativa encontrada."
              : "Nenhum produto ou empresa corresponde à pesquisa."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CapacityTable;
