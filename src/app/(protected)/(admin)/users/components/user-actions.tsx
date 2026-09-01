"use client";

import {
  MoreHorizontalIcon,
  PencilIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { changeUserStatusAction } from "@/src/actions/users/change-user-status";
import { Button } from "@/src/components/ui/button";
import { Dialog } from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/toast";

import type { UserTableRow } from "./types";
import UpsertUserForm from "./upsert-user-form";

type UserActionsProps = {
  user: UserTableRow;
};

const UserActions = ({ user }: UserActionsProps) => {
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);

  const nextStatus = user.status === "ativo" ? "inativo" : "ativo";

  const { execute, isPending } = useAction(changeUserStatusAction, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: nextStatus === "ativo" ? "Usuário ativado" : "Usuário inativado",
        description:
          nextStatus === "ativo"
            ? "Usuário ativado com sucesso!"
            : "Usuário inativado com sucesso!",
      });

      router.refresh();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao alterar status",
        description:
          error.serverError ?? "Não foi possível alterar o status do usuário.",
      });
    },
  });

  const handleChangeStatus = () => {
    execute({
      id: user.id,
      status: nextStatus,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Abrir ações do usuário"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditOpen(true);
            }}
          >
            <PencilIcon className="size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem disabled={isPending} onClick={handleChangeStatus}>
            {user.status === "ativo" ? (
              <>
                <UserXIcon className="size-4" />
                Inativar
              </>
            ) : (
              <>
                <UserCheckIcon className="size-4" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <UpsertUserForm
          user={user}
          onSuccess={() => {
            setEditOpen(false);
          }}
        />
      </Dialog>
    </>
  );
};

export default UserActions;
