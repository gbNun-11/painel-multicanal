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
import { getUsers } from "@/src/data/users/get-users";

import AddUserButton from "./components/add-user-button";
import UsersTable from "./components/users-table";

interface UserPageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

const UserPage = async ({ searchParams }: UserPageProps) => {
  const params = await searchParams;

  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;

  const parsedPage = Number(pageParam);

  const requestedPage =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { users, pagination } = await getUsers({
    page: requestedPage,
  });

  if (requestedPage !== pagination.page) {
    redirect(`/users?page=${pagination.page}`);
  }

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

      <PageContent>
        <UsersTable data={users} pagination={pagination} />
      </PageContent>
    </PageContainer>
  );
};

export default UserPage;
