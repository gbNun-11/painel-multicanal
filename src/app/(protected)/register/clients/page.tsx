import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

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

import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";

import { getRegisteredClients } from "@/src/data/clients/get-registered-clients";

import { auth } from "@/src/lib/auth";

import RegisteredClientsTable from "./components/registered-clients-table";

interface RegisteredClientsPageProps {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
}

const firstParam = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value[0] : value;
};

export default async function RegisteredClientsPage({
  searchParams,
}: RegisteredClientsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/authentication");
  }

  const [authorizedUser] = await db
    .select({
      id: usersTable.id,
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, session.user.id),
        eq(usersTable.status, "ativo"),
        eq(usersTable.banned, false),
        inArray(usersTable.role, ["admin", "administrativo"]),
      ),
    )
    .limit(1);

  if (!authorizedUser) {
    notFound();
  }

  const params = await searchParams;

  const search = firstParam(params.q)?.trim().slice(0, 120) ?? "";

  const requestedPage = Number(firstParam(params.page) ?? "1");

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

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

    redirect(`/cadastros/clientes?${query.toString()}`);
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Cadastro de Clientes</PageTitle>

          <PageDescription>
            Consulte os clientes cadastrados no V2, independentemente da
            situação das suas oportunidades.
          </PageDescription>
        </PageHeaderContent>

        <PageActions>
          <div className="flex flex-wrap items-center gap-2">
            <SearchQueryInput placeholder="Pesquisar nome ou CPF/CNPJ..." />
          </div>
        </PageActions>
      </PageHeader>

      <PageContent>
        <RegisteredClientsTable clients={clients} pagination={pagination} />
      </PageContent>
    </PageContainer>
  );
}
