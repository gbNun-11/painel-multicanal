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
import { getEnterprises } from "@/src/data/enterprises/get-enterprises";
import { parsePageSearchParam } from "@/src/utils/search-params";

import AddEnterpriseButton from "./components/add-enterprises-button";
import EnterprisesTable from "./components/enterprises-table";

interface EnterprisePageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

const EnterprisePage = async ({ searchParams }: EnterprisePageProps) => {
  const params = await searchParams;

  const requestedPage = parsePageSearchParam(params.page);

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
