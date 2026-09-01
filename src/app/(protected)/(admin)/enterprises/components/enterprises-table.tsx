"use client";

import {
  DataTable,
  type DataTablePaginationMeta,
} from "@/src/components/ui/data-table";

import { enterprisesTableColumns } from "./table-columns";
import type { EnterpriseTableRow } from "./types";

interface EnterprisesTableProps {
  data: EnterpriseTableRow[];
  pagination: DataTablePaginationMeta;
}

const EnterprisesTable = ({ data, pagination }: EnterprisesTableProps) => {
  return (
    <DataTable
      columns={enterprisesTableColumns}
      data={data}
      pagination={pagination}
    />
  );
};

export default EnterprisesTable;
