"use client";

import { createColumnHelper } from "@tanstack/react-table";

import type { DataTableFeatures } from "@/src/components/ui/data-table-features";
import { StatusBadge } from "@/src/components/ui/status-badge";

import EnterpriseInsurerActions from "./enterprise-insurer-actions";
import type { EnterpriseInsurerTableRow } from "./types";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  EnterpriseInsurerTableRow
>();

export const enterpriseInsurersTableColumns = columnHelper.columns([
  columnHelper.accessor("insurerName", {
    id: "insurerName",
    header: "Seguradora",
  }),

  columnHelper.accessor("enterpriseName", {
    id: "enterpriseName",
    header: "Empresa",
  }),

  columnHelper.accessor("susepCount", {
    id: "susepCount",
    header: "SUSEPs",

    cell: ({ getValue }) => {
      const count = getValue();

      if (count === 0) {
        return <span className="text-muted-foreground">Nenhuma</span>;
      }

      return (
        <span>
          {count} {count === 1 ? "SUSEP" : "SUSEPs"}
        </span>
      );
    },
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),

  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <EnterpriseInsurerActions enterpriseInsurer={row.original} />
      </div>
    ),
    enableSorting: false,
  }),
]);
