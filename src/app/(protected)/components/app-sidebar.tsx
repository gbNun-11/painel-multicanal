"use client";

import { LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";

import FooterSidebar from "./footer-sidebar";

export function AppSidebar() {
  const pathname = usePathname();

  const itemsClient = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Clientes - Porto Seguro",
      url: "/clients/porto",
      image: "/porto.svg",
    },
    {
      title: "Clientes - Zaion ADS",
      url: "/clients/zaion",
      image: "/zaion.svg",
    },
    {
      title: "Clientes - Suhai Seguradora",
      url: "/clients/suhai",
      image: "/suhai.svg",
    },
  ];
  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-center border-b">
        <Image
          src="/logo.svg"
          alt="INRI Corretora"
          width={150}
          height={30}
          loading="eager"
          className="w-32 h-auto"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-2 pb-2">
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {itemsClient.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={
                        isActive
                          ? "w-[calc(100%+0.5rem)] rounded-r-none"
                          : undefined
                      }
                      isActive={isActive}
                      render={<Link href={item.url} />}
                    >
                      {item.icon && <item.icon className="size-4 shrink-0" />}

                      {item.image && (
                        <Image
                          src={item.image}
                          alt=""
                          width={16}
                          height={16}
                          className="size-4 shrink-0 object-contain"
                        />
                      )}

                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <FooterSidebar />
    </Sidebar>
  );
}
