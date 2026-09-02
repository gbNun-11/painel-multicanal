"use client";

import {
  CircleCheckIcon,
  CircleXIcon,
  EllipsisIcon,
  PencilIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { changeSusepStatusAction } from "@/src/actions/insurers/suseps/change-susep-status";
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

import EditSusepForm from "./edit-susep-form";
import type { SusepTableRow } from "./types";

interface SusepActionsProps {
  susep: SusepTableRow;
  onSuccess: () => void;
}

const SusepActions = ({ susep, onSuccess }: SusepActionsProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { execute, isPending } = useAction(changeSusepStatusAction, {
    onSuccess: () => {
      const isActive = susep.status === "ativo";

      toast.add({
        type: "success",
        title: isActive ? "SUSEP inativada" : "SUSEP ativada",
        description: isActive
          ? "A SUSEP foi inativada com sucesso."
          : "A SUSEP foi ativada com sucesso.",
      });

      onSuccess();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao alterar SUSEP",
        description:
          error.serverError ?? "Não foi possível alterar o status da SUSEP.",
      });
    },
  });

  const handleChangeStatus = () => {
    execute({
      id: susep.id,

      status: susep.status === "ativo" ? "inativo" : "ativo",
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
              disabled={isPending}
            >
              <EllipsisIcon className="size-4" />

              <span className="sr-only">Abrir ações da SUSEP</span>
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditDialogOpen(true);
            }}
          >
            <PencilIcon className="size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleChangeStatus} disabled={isPending}>
            {susep.status === "ativo" ? (
              <>
                <CircleXIcon className="size-4" />
                Inativar
              </>
            ) : (
              <>
                <CircleCheckIcon className="size-4" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <EditSusepForm
          susep={susep}
          onSuccess={() => {
            setEditDialogOpen(false);

            onSuccess();
          }}
        />
      </Dialog>
    </>
  );
};

export default SusepActions;
