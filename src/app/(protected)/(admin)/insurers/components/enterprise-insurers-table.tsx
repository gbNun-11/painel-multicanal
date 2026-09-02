"use client";

import {
  DataTable,
  type DataTablePaginationMeta,
} from "@/src/components/ui/data-table";

import { enterpriseInsurersTableColumns } from "./table-columns";
import type { EnterpriseInsurerTableRow } from "./types";

interface EnterpriseInsurersTableProps {
  data: EnterpriseInsurerTableRow[];
  pagination: DataTablePaginationMeta;
}

const EnterpriseInsurersTable = ({
  data,
  pagination,
}: EnterpriseInsurersTableProps) => {
  return (
    <DataTable
      columns={enterpriseInsurersTableColumns}
      data={data}
      pagination={pagination}
    />
  );
};

export default EnterpriseInsurersTable;
