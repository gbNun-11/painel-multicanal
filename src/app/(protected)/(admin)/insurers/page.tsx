import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";

import AddInsurersButton from "./components/add-insurers-button";

const InsurersPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Seguradoras</PageTitle>
          <PageDescription>
            Gestão de seguradoras cadastradas e vinculos de SUSEPs.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddInsurersButton />
        </PageActions>
      </PageHeader>
      <PageContent>TODO: Tabela de Seguradoras</PageContent>
    </PageContainer>
  );
};

export default InsurersPage;
