"use client";

import {
  DataTable,
  type DataTablePaginationMeta,
} from "@/src/components/ui/data-table";

import { usersTableColumns } from "./table-columns";
import type { UserTableRow } from "./types";

interface UsersTableProps {
  data: UserTableRow[];
  pagination: DataTablePaginationMeta;
}

const UsersTable = ({ data, pagination }: UsersTableProps) => {
  return (
    <DataTable
      columns={usersTableColumns}
      data={data}
      pagination={pagination}
    />
  );
};

export default UsersTable;
