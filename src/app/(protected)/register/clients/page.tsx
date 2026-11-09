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
import SearchQueryInput from "@/src/components/ui/search-query-input";
import { getRegisteredClients } from "@/src/data/clients/get-registered-clients";
import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";
import {
  getFirstSearchParam,
  parsePageSearchParam,
} from "@/src/utils/search-params";

import RegisteredClientsTable from "./components/registered-clients-table";

interface RegisteredClientsPageProps {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
}

export default async function RegisteredClientsPage({
  searchParams,
}: RegisteredClientsPageProps) {
  await requirePageAccess(PAGE_ACCESS.administrative);

  const params = await searchParams;

  const search = getFirstSearchParam(params.q)?.trim().slice(0, 120) ?? "";

  const page = parsePageSearchParam(params.page);

  const { clients, pagination } = await getRegisteredClients({
    page,
    search,
  });

  if (page !== pagination.page) {
    const query = new URLSearchParams();

    if (search) {
      query.set("q", search);
    }

    query.set("page", String(pagination.page));

    redirect(`/register/clients?${query.toString()}`);
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Cadastro de Clientes</PageTitle>

          <PageDescription>
            Consulte os clientes cadastrados no sistema, independentemente da
            situação das suas oportunidades.
          </PageDescription>
        </PageHeaderContent>

        <PageActions>
          <SearchQueryInput placeholder="Pesquisar nome ou CPF/CNPJ..." />
        </PageActions>
      </PageHeader>

      <PageContent>
        <RegisteredClientsTable clients={clients} pagination={pagination} />
      </PageContent>
    </PageContainer>
  );
}
