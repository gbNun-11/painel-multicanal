"use client";

import { LayoutDashboard, LogOutIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { authClient } from "@/src/lib/auth-client";

export function AppSidebar() {
  const session = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  const itemsClient = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Clientes - Porto Seguro",
      url: "/clients",
      image: "/porto.svg",
    },
  ];
  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center justify-center border-b">
        <Image src="./logo.svg" alt="INRI Corretora" width={150} height={30} />
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton size="lg" />}
                className="mb-1 w-full"
              >
                <Avatar className="shrink-0">
                  <AvatarFallback>
                    <UserIcon className="size-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm">{session?.data?.user.name}</p>

                  <p className="truncate text-sm text-muted-foreground">
                    {session?.data?.user.email}
                  </p>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOutIcon />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
