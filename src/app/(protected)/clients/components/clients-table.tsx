"use client";

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
  const { rowSelection, setRowSelection } = useClientsSelection();

  return (
    <DataTable
      columns={clientsTableColumns}
      data={data}
      pagination={pagination}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      getRowId={(client) => client.id}
    />
  );
};

export default ClientsTable;
