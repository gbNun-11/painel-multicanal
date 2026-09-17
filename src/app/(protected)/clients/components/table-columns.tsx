"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import type { DataTableFeatures } from "@/src/components/ui/data-table-features";
import { formatDocument, formatPhone } from "@/src/utils/formatters";

import type { ClientTableRow } from "./types";

const PropensityBadge = ({ propensity }: { propensity: string | null }) => {
  if (!propensity) {
    return <Badge variant="outline">Não informado</Badge>;
  }

  switch (propensity) {
    case "Super Quente":
      return <Badge>{propensity}</Badge>;

    case "Quente":
      return <Badge variant="secondary">{propensity}</Badge>;

    case "Morno":
    case "Frio":
      return <Badge variant="outline">{propensity}</Badge>;

    default:
      return <Badge variant="secondary">{propensity}</Badge>;
  }
};

export const clientsTableColumns: ColumnDef<
  DataTableFeatures,
  ClientTableRow
>[] = [
  {
    id: "select",

    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
        aria-label="Selecionar todos os clientes"
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
        aria-label={`Selecionar ${row.original.name}`}
      />
    ),

    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "name",
    header: "Nome",

    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },

  {
    accessorKey: "document",
    header: "Documento",

    cell: ({ row }) => {
      const document = row.original.document;

      return document ? formatDocument(document) : "-";
    },
  },

  {
    accessorKey: "phone",
    header: "Telefone",

    cell: ({ row }) => {
      const phone = row.original.phone;

      return phone ? formatPhone(phone) : "-";
    },
  },

  {
    accessorKey: "product",
    header: "Produto",

    cell: ({ row }) => row.original.product ?? "-",
  },

  {
    accessorKey: "propensity",
    header: "Propensão",

    cell: ({ row }) => <PropensityBadge propensity={row.original.propensity} />,
  },
];
