"use client";

import {
  type ColumnDef,
  type OnChangeFn,
  type RowData,
  type RowSelectionState,
  useTable,
} from "@tanstack/react-table";
import { Loader2Icon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

import { type DataTableFeatures, features } from "./data-table-features";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "./data-table-pagination";

export type DataTablePaginationMeta = DataTablePaginationProps;

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  pagination?: DataTablePaginationMeta;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (originalRow: TData, index: number) => string;
  onRowClick?: (originalRow: TData) => void;

  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
}

const shouldIgnoreRowClick = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        '[data-row-select-cell="true"]',
        '[data-no-row-click="true"]',
        "a",
        "button",
        "input",
        "select",
        "textarea",
        '[role="checkbox"]',
        '[role="button"]',
        '[role="switch"]',
      ].join(", "),
    ),
  );
};

export function DataTable<TData extends RowData>({
  columns,
  data,
  pagination,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  onRowClick,
  isLoading = false,
  loadingMessage = "Carregando registros...",
  emptyMessage = "Nenhum resultado encontrado.",
}: DataTableProps<TData>) {
  const table = useTable({
    features,
    data,
    columns,
    getRowId,

    state:
      rowSelection === undefined
        ? undefined
        : {
            rowSelection,
          },

    onRowSelectionChange,

    // Os dados já vêm paginados do servidor ou representam
    // a lista completa de um diálogo administrativo.
    manualPagination: true,

    rowCount: pagination?.total,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/60 dark:bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div
                    role="status"
                    className="flex items-center justify-center gap-2 text-muted-foreground"
                  >
                    <Loader2Icon
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {loadingMessage}
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={
                    onRowClick
                      ? "cursor-pointer hover:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      : "hover:bg-muted/40"
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={(event) => {
                    if (!onRowClick || shouldIgnoreRowClick(event.target)) {
                      return;
                    }

                    onRowClick(row.original);
                  }}
                  onKeyDown={(event) => {
                    if (
                      !onRowClick ||
                      event.key !== "Enter" ||
                      event.target !== event.currentTarget
                    ) {
                      return;
                    }

                    event.preventDefault();
                    onRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-foreground"
                      data-row-select-cell={
                        cell.column.id === "select" ? "true" : undefined
                      }
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && <DataTablePagination {...pagination} />}
    </div>
  );
}
