import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }
  return (
    <>
      <h2>{session?.user?.name}</h2>
      <p>Dashboard</p>
    </>
  );
};

export default DashboardPage;
