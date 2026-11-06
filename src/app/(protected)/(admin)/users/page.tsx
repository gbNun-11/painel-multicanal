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
import SearchQueryInput from "@/src/components/ui/search-query-input";
import { getUsers } from "@/src/data/users/get-users";
import { getFirstSearchParam } from "@/src/utils/search-params";

import AddUserButton from "./components/add-user-button";
import UsersTable from "./components/users-table";

interface UserPageProps {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
}

const UserPage = async ({ searchParams }: UserPageProps) => {
  const params = await searchParams;

  const pageParam = getFirstSearchParam(params.page);

  const search = getFirstSearchParam(params.q);

  const parsedPage = Number(pageParam);

  const requestedPage =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { users, pagination } = await getUsers({
    page: requestedPage,
    search,
  });

  if (requestedPage !== pagination.page) {
    const redirectParams = new URLSearchParams();

    if (search) {
      redirectParams.set("q", search);
    }

    redirectParams.set("page", String(pagination.page));

    redirect(`/users?${redirectParams.toString()}`);
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Usuários</PageTitle>

          <PageDescription>Gestão de usuários da empresa.</PageDescription>
        </PageHeaderContent>

        <PageActions>
          <SearchQueryInput placeholder="Pesquisar nome ou CPF..." />

          <AddUserButton />
        </PageActions>
      </PageHeader>

      <PageContent>
        <UsersTable data={users} pagination={pagination} />
      </PageContent>
    </PageContainer>
  );
};

export default UserPage;
