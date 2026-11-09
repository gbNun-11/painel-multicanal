"use client";

import { CircleCheckIcon, CircleXIcon, PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { changeEnterpriseStatusAction } from "@/src/actions/enterprises/change-enterprise-status";
import { Dialog } from "@/src/components/ui/dialog";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { TableRowActions } from "@/src/components/ui/table-row-actions";
import { toast } from "@/src/components/ui/toast";

import type { EnterpriseTableRow } from "./types";
import UpsertEnterpriseForm from "./upsert-enterprise-form";

type EnterpriseActionsProps = {
  enterprise: EnterpriseTableRow;
};

const EnterpriseActions = ({ enterprise }: EnterpriseActionsProps) => {
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);

  const nextStatus = enterprise.status === "ativo" ? "inativo" : "ativo";

  const { execute, isPending } = useAction(changeEnterpriseStatusAction, {
    onSuccess: () => {
      toast.add({
        type: "success",
        title: nextStatus === "ativo" ? "Empresa ativada" : "Empresa inativada",
        description:
          nextStatus === "ativo"
            ? "Empresa ativada com sucesso!"
            : "Empresa inativada com sucesso!",
      });

      router.refresh();
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao alterar status",
        description:
          error.serverError ?? "Não foi possível alterar o status da empresa.",
      });
    },
  });

  const handleChangeStatus = () => {
    execute({
      id: enterprise.id,
      status: nextStatus,
    });
  };

  return (
    <>
      <TableRowActions label="Abrir ações da empresa">
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
          {enterprise.status === "ativo" ? (
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
      </TableRowActions>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <UpsertEnterpriseForm
          enterprise={enterprise}
          onSuccess={() => {
            setEditOpen(false);
          }}
        />
      </Dialog>
    </>
  );
};

export default EnterpriseActions;
