import { redirect } from "next/dist/client/components/navigation";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";
import { getEnterprises } from "@/src/data/enterprises/get-enterprises";

import EnterprisesTable from "../enterprises/components/enterprises-table";
import AddEnterpriseButton from "./components/add-enterprises-button";

interface EnterprisePageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

const EnterprisePage = async ({ searchParams }: EnterprisePageProps) => {
  const params = await searchParams;

  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;

  const parsedPage = Number(pageParam);

  const requestedPage =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { enterprises, pagination } = await getEnterprises({
    page: requestedPage,
  });

  if (requestedPage !== pagination.page) {
    redirect(`/enterprises?page=${pagination.page}`);
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Empresas</PageTitle>
          <PageDescription>Gestão de empresas cadastradas.</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddEnterpriseButton />
        </PageActions>
      </PageHeader>

      <PageContent>
        <EnterprisesTable data={enterprises} pagination={pagination} />
      </PageContent>
    </PageContainer>
  );
};

export default EnterprisePage;
