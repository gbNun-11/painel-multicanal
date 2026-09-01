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

const UserPage = async () => {
  const users = await getUsers();

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
        <UsersTable data={users} />
      </PageContent>
    </PageContainer>
  );
};

export default UserPage;
