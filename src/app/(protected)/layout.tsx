import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import { SidebarProvider, SidebarTrigger } from "@/src/components/ui/sidebar";
import { auth } from "@/src/lib/auth";
import { hasAllowedLoginRole } from "@/src/utils/auth-policy";

import { AppSidebar } from "./components/app-sidebar";

const ProtectLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),

    query: {
      disableCookieCache: true,
    },
  });
  if (!session) {
    redirect("/authentication");
  }

  if (session.user.status !== "ativo") {
    redirect("/authentication");
  }

  if (!hasAllowedLoginRole(session.user.role)) {
    redirect("/authentication");
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="w-full">
        <SidebarTrigger />

        {children}
      </main>
    </SidebarProvider>
  );
};

export default ProtectLayout;
