import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";

import AddClientButton from "../components/add-client-button";

const ClientsPorto = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Clientes</PageTitle>
          <PageDescription>
            Informações dos Leads disponibilizados pela Porto Seguro
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddClientButton />
        </PageActions>
      </PageHeader>
      <PageContent>TODO: Tabela de Clientes</PageContent>
    </PageContainer>
  );
};

export default ClientsPorto;
