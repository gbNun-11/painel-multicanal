"use client";

import {
  Building2Icon,
  BuildingIcon,
  ChartColumnIcon,
  ChartNoAxesCombinedIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  SendIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
import { authClient } from "@/src/lib/auth-client";

import FooterSidebar from "./footer-sidebar";

type GroupId = "dashboard" | "distribuicao" | "cadastro" | "financeiro";

interface MenuLink {
  title: string;
  url?: string;
  icon?: LucideIcon;
  image?: string;
  adminOnly?: boolean;
  staffOnly?: boolean;
}

interface MenuGroup {
  id: GroupId;
  title: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  items: MenuLink[];
}

const menuGroups: MenuGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboardIcon,
    items: [
      {
        title: "Dashboard de Distribuição",
        url: "/dashboard",
        icon: ChartColumnIcon,
      },
      {
        title: "Dashboard de Clientes",
        icon: UserGroupIcon,
      },
      {
        title: "Dashboard Financeiro",
        adminOnly: true,
        icon: ChartNoAxesCombinedIcon,
      },
    ],
  },
  {
    id: "distribuicao",
    title: "Distribuição",
    icon: SendIcon,
    items: [
      {
        title: "Porto Seguro",
        url: "/clients/porto",
        image: "/porto.svg",
      },
      {
        title: "Suhai Seguradora",
        url: "/clients/suhai",
        image: "/suhai.svg",
      },
      {
        title: "Zaion ADS",
        url: "/clients/zaion",
        image: "/zaion.svg",
      },
    ],
  },
  {
    id: "cadastro",
    title: "Cadastro",
    icon: FolderOpenIcon,
    items: [
      {
        title: "Clientes 360",
        url: "/register/clients",
        icon: UserIcon,
        staffOnly: true,
      },
      {
        title: "Colaboradores",
        url: "/users",
        icon: UsersIcon,
        adminOnly: true,
      },
      {
        title: "Empresas",
        url: "/enterprises",
        icon: BuildingIcon,
        adminOnly: true,
      },
      {
        title: "Seguradoras, SUSEPs e Produtos",
        url: "/insurers",
        icon: Building2Icon,
        adminOnly: true,
      },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    icon: WalletIcon,
    adminOnly: true,
    items: [
      {
        title: "Módulos em desenvolvimento",
      },
    ],
  },
];

const isRouteActive = (pathname: string, url: string) =>
  pathname === url || pathname.startsWith(`${url}/`);

const findActiveGroup = (pathname: string): GroupId | undefined =>
  menuGroups.find((group) =>
    group.items.some((item) => item.url && isRouteActive(pathname, item.url)),
  )?.id;

export function AppSidebar() {
  const pathname = usePathname();

  const session = authClient.useSession();

  const role = session.data?.user.role;

  const isAdmin = role === "admin";

  const canViewClients = role === "admin" || role === "administrativo";

  const [expandedGroups, setExpandedGroups] = useState<GroupId[]>(() => {
    const activeGroup = findActiveGroup(pathname);

    return activeGroup ? [activeGroup] : ["dashboard"];
  });

  // Expande o grupo ao mudar de rota,
  // preservando o fechamento manual na rota atual.
  const [previousPathname, setPreviousPathname] = useState(pathname);

  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);

    const activeGroup = findActiveGroup(pathname);

    if (activeGroup) {
      setExpandedGroups((current) =>
        current.includes(activeGroup)
          ? current
          : [...current, activeGroup],
      );
    }
  }

  const toggleGroup = (groupId: GroupId) => {
    setExpandedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  };

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
              {menuGroups
                .filter((group) => !group.adminOnly || isAdmin)
                .map((group) => {
                  const visibleItems = group.items.filter(
                    (item) =>
                      (!item.adminOnly || isAdmin) &&
                      (!item.staffOnly || canViewClients),
                  );

                  const isExpanded = expandedGroups.includes(group.id);

                  const isGroupActive = visibleItems.some(
                    (item) => item.url && isRouteActive(pathname, item.url),
                  );

                  const GroupIcon = group.icon;

                  return (
                    <SidebarMenuItem key={group.id}>
                      <SidebarMenuButton
                        className="border"
                        isActive={isGroupActive}
                        render={
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`sidebar-group-${group.id}`}
                          />
                        }
                      >
                        <GroupIcon className="size-4 shrink-0" />

                        <span className="flex-1 text-left">{group.title}</span>

                        {isExpanded ? (
                          <ChevronDownIcon className="size-4 shrink-0" />
                        ) : (
                          <ChevronRightIcon className="size-4 shrink-0" />
                        )}
                      </SidebarMenuButton>

                      {isExpanded && (
                        <div
                          id={`sidebar-group-${group.id}`}
                          className="mt-1 pl-4"
                        >
                          <SidebarMenu className="gap-1 border-l pl-2">
                            {visibleItems.map((item) => {
                              const ItemIcon = item.icon;

                              if (!item.url) {
                                return (
                                  <SidebarMenuItem key={item.title}>
                                    <div
                                      className="flex min-h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground/70"
                                      aria-disabled="true"
                                      title="Em desenvolvimento"
                                    >
                                      {ItemIcon && (
                                        <ItemIcon className="size-4 shrink-0" />
                                      )}

                                      <span className="min-w-0 flex-1 truncate">
                                        {item.title}
                                      </span>

                                      <span className="shrink-0 text-[10px]">
                                        Em breve
                                      </span>
                                    </div>
                                  </SidebarMenuItem>
                                );
                              }

                              const isActive = isRouteActive(
                                pathname,
                                item.url,
                              );

                              return (
                                <SidebarMenuItem key={item.url}>
                                  <SidebarMenuButton
                                    className={
                                      isActive
                                        ? "w-[calc(100%+0.5rem)] rounded-r-none"
                                        : undefined
                                    }
                                    isActive={isActive}
                                    render={<Link href={item.url} />}
                                  >
                                    {ItemIcon && (
                                      <ItemIcon className="size-4 shrink-0" />
                                    )}

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
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <FooterSidebar />
    </Sidebar>
  );
}
