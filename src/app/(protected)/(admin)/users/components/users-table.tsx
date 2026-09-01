"use client";

import { DataTable } from "@/src/components/ui/data-table";

import { usersTableColumns } from "./table-columns";
import type { UserTableRow } from "./types";

interface UsersTableProps {
  data: UserTableRow[];
}

const UsersTable = ({ data }: UsersTableProps) => {
  return <DataTable columns={usersTableColumns} data={data} />;
};

export default UsersTable;
