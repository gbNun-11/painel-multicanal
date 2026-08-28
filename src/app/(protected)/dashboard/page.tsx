import { CalendarDaysIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
import { auth } from "@/src/lib/auth";

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            Informações referente a distribuição de clientes no Goalfy
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <Button>
            <CalendarDaysIcon />
            Filtro de Data
          </Button>
        </PageActions>
      </PageHeader>
      <PageContent>TODO: Dashboard</PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
