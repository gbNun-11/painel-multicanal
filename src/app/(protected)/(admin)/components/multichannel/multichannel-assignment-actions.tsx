"use client";

import { CircleCheckIcon, CircleXIcon, PencilIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { changeMultichannelAssignmentStatusAction } from "@/src/actions/multichannel/change-multichannel-assignment-status";
import { Dialog } from "@/src/components/ui/dialog";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { TableRowActions } from "@/src/components/ui/table-row-actions";
import { toast } from "@/src/components/ui/toast";

import type {
  MultichannelAssignmentTableRow,
  MultichannelProductOption,
  MultichannelUserOption,
} from "./types";
import UpsertMultichannelAssignmentForm from "./upsert-multichannel-assignment-form";

interface MultichannelAssignmentActionsProps {
  susepId: string;
  susepCode: string;
  susepStatus: "ativo" | "inativo";
  assignment: MultichannelAssignmentTableRow;
  products: MultichannelProductOption[];
  users: MultichannelUserOption[];
  onSuccess: () => void;
}

const MultichannelAssignmentActions = ({
  susepId,
  susepCode,
  susepStatus,
  assignment,
  products,
  users,
  onSuccess,
}: MultichannelAssignmentActionsProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const canEdit =
    susepStatus === "ativo" && assignment.productStatus === "ativo";

  const canActivate =
    susepStatus === "ativo" &&
    assignment.productStatus === "ativo" &&
    assignment.userStatus === "ativo";

  const { execute, isPending } = useAction(
    changeMultichannelAssignmentStatusAction,
    {
      onSuccess: () => {
        const isActive = assignment.status === "ativo";

        toast.add({
          type: "success",
          title: isActive ? "Configuração inativada" : "Configuração ativada",
          description: isActive
            ? "A configuração multicanal foi inativada."
            : "A configuração multicanal foi ativada.",
        });

        onSuccess();
      },

      onError: ({ error }) => {
        toast.add({
          type: "error",
          title: "Erro ao alterar configuração",
          description:
            error.serverError ??
            "Não foi possível alterar a configuração multicanal.",
        });
      },
    },
  );

  const handleChangeStatus = () => {
    execute({
      id: assignment.id,
      status: assignment.status === "ativo" ? "inativo" : "ativo",
    });
  };

  return (
    <>
      <TableRowActions
        label={`Abrir ações da configuração do produto ${assignment.productName}`}
        disabled={isPending}
      >
        <DropdownMenuItem
          disabled={!canEdit}
          onClick={() => {
            setEditDialogOpen(true);
          }}
        >
          <PencilIcon className="size-4" />
          Editar configuração
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleChangeStatus}
          disabled={
            isPending || (assignment.status === "inativo" && !canActivate)
          }
        >
          {assignment.status === "ativo" ? (
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <UpsertMultichannelAssignmentForm
          susepId={susepId}
          susepCode={susepCode}
          assignment={assignment}
          products={products}
          users={users}
          onSuccess={() => {
            setEditDialogOpen(false);
            onSuccess();
          }}
        />
      </Dialog>
    </>
  );
};

export default MultichannelAssignmentActions;
