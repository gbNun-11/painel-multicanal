import { PlusIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/src/components/ui/page-container";

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
          <Button>
            <PlusIcon />
            Adicionar Cliente
          </Button>
        </PageActions>
      </PageHeader>
      <PageContent>TODO: Tabela de Clientes</PageContent>
    </PageContainer>
  );
};

export default ClientsPorto;
