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
import { getEnterpriseInsurerOptions } from "@/src/data/insurers/get-enterprise-insurer-options";
import { getEnterpriseInsurers } from "@/src/data/insurers/get-enterprise-insurers";
import { parsePageSearchParam } from "@/src/utils/search-params";

import AddEnterpriseInsurerButton from "./components/add-enterprise-insurer-button";
import AddInsurersButton from "./components/add-insurers-button";
import EnterpriseInsurersTable from "./components/enterprise-insurers-table";
import ManageProductsButton from "./components/manage-products-button";

interface InsurersPageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

const InsurersPage = async ({ searchParams }: InsurersPageProps) => {
  const params = await searchParams;

  const requestedPage = parsePageSearchParam(params.page);

  const [
    { enterpriseInsurers, pagination },
    { insurers, enterprises, existingLinks },
  ] = await Promise.all([
    getEnterpriseInsurers({
      page: requestedPage,
    }),
    getEnterpriseInsurerOptions(),
  ]);

  if (requestedPage !== pagination.page) {
    redirect(`/insurers?page=${pagination.page}`);
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Seguradoras</PageTitle>

          <PageDescription>
            Gestão de seguradoras cadastradas e vínculos de SUSEPs.
          </PageDescription>
        </PageHeaderContent>

        <PageActions>
          <AddEnterpriseInsurerButton
            insurers={insurers}
            enterprises={enterprises}
            existingLinks={existingLinks}
          />

          <AddInsurersButton />

          <ManageProductsButton insurers={insurers} />
        </PageActions>
      </PageHeader>

      <PageContent>
        <EnterpriseInsurersTable
          data={enterpriseInsurers}
          pagination={pagination}
        />
      </PageContent>
    </PageContainer>
  );
};

export default InsurersPage;
