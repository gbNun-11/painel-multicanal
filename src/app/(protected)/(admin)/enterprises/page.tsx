import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";

import AddEnterpriseButton from "./components/add-enterprises-button";

const ClientsPorto = () => {
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
      <PageContent>TODO: Tabela de Empresas</PageContent>
    </PageContainer>
  );
};

export default ClientsPorto;
