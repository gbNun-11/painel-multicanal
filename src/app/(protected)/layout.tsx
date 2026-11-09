import { type ReactNode, Suspense } from "react";

import { SidebarProvider, SidebarTrigger } from "@/src/components/ui/sidebar";
import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";

import { AppSidebar } from "./components/app-sidebar";
import { DistributionFiltersMemory } from "./components/distribution-filters-memory";

interface ProtectedLayoutProps {
  children: ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  await requirePageAccess(PAGE_ACCESS.administrative, {
    deniedRedirectTo: "/authentication",
  });

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <DistributionFiltersMemory />
      </Suspense>

      <AppSidebar />

      <main className="w-full">
        <SidebarTrigger />

        {children}
      </main>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
