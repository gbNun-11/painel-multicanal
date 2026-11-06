"use client";

import { useRouter } from "next/navigation";

import {
  DataTable,
  type DataTablePaginationMeta,
} from "@/src/components/ui/data-table";

import { useClientsSelection } from "./clients-selection-context";
import { clientsTableColumns } from "./table-columns";
import type { ClientTableRow } from "./types";

interface ClientsTableProps {
  data: ClientTableRow[];

  pagination: DataTablePaginationMeta;
}

const ClientsTable = ({ data, pagination }: ClientsTableProps) => {
  const router = useRouter();

  const { rowSelection, setRowSelection } = useClientsSelection();

  const handleRowClick = (client: ClientTableRow) => {
    router.push(`/clients/${client.clientId}`);
  };

  return (
    <DataTable
      columns={clientsTableColumns}
      data={data}
      pagination={pagination}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      getRowId={(client) => client.id}
      onRowClick={handleRowClick}
    />
  );
};

export default ClientsTable;
