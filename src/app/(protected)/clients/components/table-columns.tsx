"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import type { DataTableFeatures } from "@/src/components/ui/data-table-features";
import { formatDocument, formatPhone } from "@/src/utils/formatters";

import type { ClientTableRow } from "./types";

const SalesModelBadge = ({
  salesModel,
}: {
  salesModel: ClientTableRow["salesModel"];
}) => {
  switch (salesModel) {
    case "LEAD":
      return (
        <Badge
          variant="outline"
          className="border-blue-600 bg-blue-600 text-white dark:border-blue-600 dark:bg-blue-600 dark:text-white"
        >
          LEAD
        </Badge>
      );

    case "VINCULO":
      return (
        <Badge
          variant="outline"
          className="border-violet-600 bg-violet-600 text-white dark:border-violet-600 dark:bg-violet-600 dark:text-white"
        >
          VÍNCULO
        </Badge>
      );

    case "CONTINGENCIA":
      return (
        <Badge
          variant="outline"
          className="border-zinc-600 bg-zinc-600 text-white dark:border-zinc-600 dark:bg-zinc-600 dark:text-white"
        >
          CONTINGÊNCIA
        </Badge>
      );

    default:
      return <Badge variant="outline">Não informado</Badge>;
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
      <span data-no-row-click className="inline-flex">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
          aria-label={`Selecionar ${row.original.name}`}
        />
      </span>
    ),

    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "opportunityNumber",
    header: "Lead",

    cell: ({ row }) => {
      const number = row.original.opportunityNumber;

      return (
        <span className="whitespace-nowrap font-medium tabular-nums text-muted-foreground">
          {number == null ? "—" : number}
        </span>
      );
    },
  },

  {
    accessorKey: "name",
    header: "Nome",

    cell: ({ row }) => (
      <Link
        href={`/clients/${row.original.clientId}`}
        className="font-medium hover:underline focus-visible:underline"
        aria-label={`Abrir cadastro 360 de ${row.original.name}`}
      >
        {row.original.name}
      </Link>
    ),
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
    accessorKey: "enterpriseName",
    header: "Empresa",

    cell: ({ row }) => (
      <span className="font-medium">{row.original.enterpriseName || "-"}</span>
    ),
  },

  {
    accessorKey: "salesModel",
    header: "Modelo de Venda",

    cell: ({ row }) => <SalesModelBadge salesModel={row.original.salesModel} />,
  },
];
