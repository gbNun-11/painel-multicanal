import { redirect } from "next/navigation";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";

import { getClientFilters } from "@/src/data/clients/get-client-filters";
import { getClients } from "@/src/data/clients/get-clients";
import { getGoalfyImportOptions } from "@/src/data/clients/get-goalfy-import-options";

import ClientsPageActions from "./clients-page-actions";
import { ClientsSelectionProvider } from "./clients-selection-context";
import ClientsTable from "./clients-table";
import type { ClientsSearchParams } from "./types";

interface ClientsPageProps {
  searchParams: Promise<ClientsSearchParams>;

  insurerId: string;

  pathname: string;

  title: string;

  description: string;

  syncLabel: string;
}

const getFirstParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const getArrayParam = (value: string | string[] | undefined) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const ClientsPage = async ({
  searchParams,
  insurerId,
  pathname,
  title,
  description,
  syncLabel,
}: ClientsPageProps) => {
  const params = await searchParams;

  const pageParam = getFirstParam(params.page);

  const parsedPage = Number(pageParam);

  const requestedPage =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const search = getFirstParam(params.q);

  const arrivalDateFrom = getFirstParam(params.from);

  const arrivalDateTo = getFirstParam(params.to);

  const products = getArrayParam(params.product);

  const salesModels = getArrayParam(params.salesModel);

  const [clientsResult, filtersResult, goalfyOptions] = await Promise.all([
    getClients({
      page: requestedPage,

      insurerId,

      search,

      arrivalDateFrom,

      arrivalDateTo,

      products,

      salesModels,
    }),

    getClientFilters({
      insurerId,
    }),

    getGoalfyImportOptions({
      insurerId,
    }),
  ]);

  const { clients, pagination } = clientsResult;

  if (requestedPage !== pagination.page) {
    const redirectParams = new URLSearchParams();

    if (search) {
      redirectParams.set("q", search);
    }

    if (arrivalDateFrom) {
      redirectParams.set("from", arrivalDateFrom);
    }

    if (arrivalDateTo) {
      redirectParams.set("to", arrivalDateTo);
    }

    for (const product of products) {
      redirectParams.append("product", product);
    }

    for (const salesModel of salesModels) {
      redirectParams.append("salesModel", salesModel);
    }

    redirectParams.set("page", String(pagination.page));

    redirect(`${pathname}?${redirectParams.toString()}`);
  }

  return (
    <ClientsSelectionProvider>
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>{title}</PageTitle>

            <PageDescription>{description}</PageDescription>
          </PageHeaderContent>

          <PageActions>
            <ClientsPageActions
              products={filtersResult.products}
              syncLabel={syncLabel}
              goalfyOptions={goalfyOptions}
            />
          </PageActions>
        </PageHeader>

        <PageContent>
          <ClientsTable data={clients} pagination={pagination} />
        </PageContent>
      </PageContainer>
    </ClientsSelectionProvider>
  );
};

export default ClientsPage;
