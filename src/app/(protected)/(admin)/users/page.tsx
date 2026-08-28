import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";

import AddUserButton from "./components/add-user-button";

const ClientsPorto = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Usuários</PageTitle>
          <PageDescription>Gestão de usuários da empresa.</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddUserButton />
        </PageActions>
      </PageHeader>
      <PageContent>TODO: Tabela de Usuários</PageContent>
    </PageContainer>
  );
};

export default ClientsPorto;
