import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),

    query: {
      disableCookieCache: true,
    },
  });
  if (!session) {
    redirect("/authentication");
  }
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
};

export default AdminLayout;
