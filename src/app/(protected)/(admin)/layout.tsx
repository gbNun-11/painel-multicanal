import type { ReactNode } from "react";

import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = async ({ children }: AdminLayoutProps) => {
  await requirePageAccess(PAGE_ACCESS.adminOnly, {
    deniedRedirectTo: "/dashboard",
  });

  return <>{children}</>;
};

export default AdminLayout;
