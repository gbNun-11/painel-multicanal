"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { Badge } from "@/src/components/ui/badge";
import type { DataTableFeatures } from "@/src/components/ui/data-table-features";
import { statusLabels } from "@/src/constants/enums";
import { formatCnpj } from "@/src/utils/formatters";

import EnterpriseActions from "./enterprise-actions";
import type { EnterpriseTableRow } from "./types";

const columnHelper = createColumnHelper<
  DataTableFeatures,
  EnterpriseTableRow
>();

export const enterprisesTableColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    id: "name",
    header: "Empresa",
  }),

  columnHelper.accessor("cnpj", {
    id: "cnpj",
    header: "CNPJ",
    cell: ({ getValue }) => formatCnpj(getValue()),
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();

      return (
        <Badge variant={status === "ativo" ? "default" : "secondary"}>
          {statusLabels[status]}
        </Badge>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <EnterpriseActions enterprise={row.original} />,
  }),
]);
