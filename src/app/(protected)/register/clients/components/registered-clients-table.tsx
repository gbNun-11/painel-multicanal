"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import {
  DataTable,
  type DataTablePaginationMeta,
} from "@/src/components/ui/data-table";

import type { DataTableFeatures } from "@/src/components/ui/data-table-features";

import type { RegisteredClientRow } from "@/src/data/clients/get-registered-clients";

import { formatDocument, formatPhone } from "@/src/utils/formatters";

interface RegisteredClientsTableProps {
  clients: RegisteredClientRow[];
  pagination: DataTablePaginationMeta;
}

const formatDate = (date: Date | null) => {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
};

const columns: ColumnDef<DataTableFeatures, RegisteredClientRow>[] = [
  {
    accessorKey: "name",
    header: "Cliente",

    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "document",
    header: "CPF/CNPJ",

    cell: ({ row }) => formatDocument(row.original.document),
  },
  {
    accessorKey: "phone",
    header: "Telefone",

    cell: ({ row }) =>
      row.original.phone ? formatPhone(row.original.phone) : "-",
  },
  {
    accessorKey: "opportunitiesCount",
    header: "Oportunidades",

    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.opportunitiesCount}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Cadastrado no V2",

    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "lastOpportunityAt",
    header: "Última oportunidade",

    cell: ({ row }) => formatDate(row.original.lastOpportunityAt),
  },
];

export default function RegisteredClientsTable({
  clients,
  pagination,
}: RegisteredClientsTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={clients}
      pagination={pagination}
      getRowId={(client) => client.id}
      onRowClick={(client) => {
        router.push(`/clients/${client.id}`);
      }}
    />
  );
}
