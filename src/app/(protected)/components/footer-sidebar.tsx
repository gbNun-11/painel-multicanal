import {
  Building2Icon,
  BuildingIcon,
  LogOutIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import { authClient } from "@/src/lib/auth-client";

const FooterSidebar = () => {
  const session = authClient.useSession();
  const router = useRouter();
  const isAdmin = session.data?.user.role === "admin";

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  return (
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
              <DropdownMenuGroup>
                <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                <DropdownMenuItem render={<Link href="/dashboard" />}>
                  <UserIcon />
                  Perfil
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem render={<Link href="/users" />}>
                      <UsersIcon />
                      Usuários
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem render={<Link href="/enterprises" />}>
                      <Building2Icon />
                      Empresas
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/insurers" />}>
                      <BuildingIcon />
                      Seguradoras
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOutIcon />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export default FooterSidebar;
