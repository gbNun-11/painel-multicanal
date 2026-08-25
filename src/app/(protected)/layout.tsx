import React from "react";

import { SidebarProvider, SidebarTrigger } from "@/src/components/ui/sidebar";

import { AppSidebar } from "./components/app-sidebar";

const ProtectLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default ProtectLayout;
