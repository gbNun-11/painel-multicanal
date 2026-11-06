"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { Badge } from "@/src/components/ui/badge";
import type { DataTableFeatures } from "@/src/components/ui/data-table-features";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { userRoleLabels } from "@/src/constants/enums";
import { formatPhone } from "@/src/utils/formatters";

import type { UserTableRow } from "./types";
import UserActions from "./user-actions";

const columnHelper = createColumnHelper<DataTableFeatures, UserTableRow>();

export const usersTableColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    id: "name",
    header: "Nome",
  }),

  columnHelper.accessor("phone", {
    id: "phone",
    header: "Telefone",
    cell: ({ getValue }) => formatPhone(getValue()),
  }),

  columnHelper.accessor("email", {
    id: "email",
    header: "Email",
  }),

  columnHelper.accessor("role", {
    id: "role",
    header: "Função",
    cell: ({ getValue }) => (
      <Badge variant="outline">{userRoleLabels[getValue()]}</Badge>
    ),
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),

  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <UserActions user={row.original} />,
  }),
]);
