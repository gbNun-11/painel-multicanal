"use client";

import {
  CircleCheckIcon,
  CircleXIcon,
  ListIcon,
  ShieldPlusIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

import { changeEnterpriseInsurerStatusAction } from "@/src/actions/insurers/change-enterprise-insurer-status";
import { Dialog } from "@/src/components/ui/dialog";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { TableRowActions } from "@/src/components/ui/table-row-actions";
import { toast } from "@/src/components/ui/toast";

import ManageSusepsDialog from "../../components/suseps/manage-suseps-dialog";
import UpsertSusepForm from "../../components/suseps/upsert-susep-form";
import type { EnterpriseInsurerTableRow } from "./types";

interface EnterpriseInsurerActionsProps {
  enterpriseInsurer: EnterpriseInsurerTableRow;
}

const EnterpriseInsurerActions = ({
  enterpriseInsurer,
}: EnterpriseInsurerActionsProps) => {
  const router = useRouter();

  const [susepDialogOpen, setSusepDialogOpen] = useState(false);

  const [manageSusepsDialogOpen, setManageSusepsDialogOpen] = useState(false);

  const { execute, isPending } = useAction(
    changeEnterpriseInsurerStatusAction,
    {
      onSuccess: () => {
        const isActive = enterpriseInsurer.status === "ativo";

        toast.add({
          type: "success",

          title: isActive ? "Vínculo inativado" : "Vínculo ativado",

          description: isActive
            ? "O vínculo foi inativado com sucesso."
            : "O vínculo foi ativado com sucesso.",
        });

        router.refresh();
      },

      onError: ({ error }) => {
        toast.add({
          type: "error",

          title: "Erro ao alterar vínculo",

          description:
            error.serverError ??
            "Não foi possível alterar o status do vínculo.",
        });
      },
    },
  );

  const handleChangeStatus = () => {
    execute({
      id: enterpriseInsurer.id,

      status: enterpriseInsurer.status === "ativo" ? "inativo" : "ativo",
    });
  };

  const susepContext = {
    type: "enterpriseInsurer" as const,

    enterpriseInsurerId: enterpriseInsurer.id,

    insurerName: enterpriseInsurer.insurerName,

    enterpriseName: enterpriseInsurer.enterpriseName,
  };

  return (
    <>
      <TableRowActions
        label="Abrir ações do vínculo entre empresa e seguradora"
        disabled={isPending}
      >
        <DropdownMenuItem
          disabled={enterpriseInsurer.status !== "ativo"}
          onClick={() => {
            setSusepDialogOpen(true);
          }}
        >
          <ShieldPlusIcon className="size-4" />
          Vincular SUSEP
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            setManageSusepsDialogOpen(true);
          }}
        >
          <ListIcon className="size-4" />
          Gerenciar SUSEPs
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleChangeStatus} disabled={isPending}>
          {enterpriseInsurer.status === "ativo" ? (
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

      <Dialog open={susepDialogOpen} onOpenChange={setSusepDialogOpen}>
        <UpsertSusepForm
          context={susepContext}
          onSuccess={() => {
            setSusepDialogOpen(false);
          }}
        />
      </Dialog>

      <Dialog
        open={manageSusepsDialogOpen}
        onOpenChange={setManageSusepsDialogOpen}
      >
        <ManageSusepsDialog
          open={manageSusepsDialogOpen}
          context={susepContext}
        />
      </Dialog>
    </>
  );
};

export default EnterpriseInsurerActions;
