"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getSusepsAction } from "@/src/actions/suseps/get-suseps";
import { Badge } from "@/src/components/ui/badge";
import { DataTable } from "@/src/components/ui/data-table";
import type { DataTableFeatures } from "@/src/components/ui/data-table-features";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { StatusBadge } from "@/src/components/ui/status-badge";
import { toast } from "@/src/components/ui/toast";

import ConfigureMultichannelButton from "./configure-multichannel-button";
import SusepActions from "./susep-actions";
import type { SusepContext, SusepTableRow } from "./types";

interface ManageSusepsDialogProps {
  open: boolean;
  context: SusepContext;
}

const ManageSusepsDialog = ({ open, context }: ManageSusepsDialogProps) => {
  const [suseps, setSuseps] = useState<SusepTableRow[]>([]);

  const { execute, isPending } = useAction(getSusepsAction, {
    onSuccess: ({ data }) => {
      setSuseps(data?.suseps ?? []);
    },

    onError: ({ error }) => {
      toast.add({
        type: "error",
        title: "Erro ao carregar SUSEPs",
        description:
          error.serverError ?? "Não foi possível carregar as SUSEPs.",
      });
    },
  });

  const loadSuseps = useCallback(() => {
    execute({
      enterpriseInsurerId: context.enterpriseInsurerId,
    });
  }, [execute, context.enterpriseInsurerId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadSuseps();
  }, [open, loadSuseps]);

  const susepCodes = useMemo(
    () => new Map(suseps.map((susep) => [susep.id, susep.code])),
    [suseps],
  );

  const columns = useMemo<ColumnDef<DataTableFeatures, SusepTableRow>[]>(
    () => [
      {
        accessorKey: "code",
        header: "SUSEP",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.code}</span>
        ),
      },
      {
        id: "master",
        header: "Master",
        cell: ({ row }) => {
          const masterId = row.original.masterSusepId;

          return masterId ? (susepCodes.get(masterId) ?? "—") : "—";
        },
      },
      {
        accessorKey: "multichannel",
        header: "Multicanal",
        cell: ({ row }) => (
          <Badge variant={row.original.multichannel ? "default" : "secondary"}>
            {row.original.multichannel ? "Sim" : "Não"}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const susep = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              {susep.multichannel && (
                <ConfigureMultichannelButton
                  susepId={susep.id}
                  susepCode={susep.code}
                  enterpriseName={context.enterpriseName}
                  insurerName={context.insurerName}
                />
              )}

              <SusepActions
                susep={susep}
                context={context}
                onSuccess={loadSuseps}
              />
            </div>
          );
        },
      },
    ],
    [context, loadSuseps, susepCodes],
  );

  return (
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Gerenciar SUSEPs</DialogTitle>

        <DialogDescription>
          Consulte e gerencie as SUSEPs vinculadas à empresa e seguradora
          selecionadas.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Seguradora</p>

          <p className="font-medium">{context.insurerName}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Empresa</p>

          <p className="font-medium">{context.enterpriseName}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suseps}
        getRowId={(susep) => susep.id}
        isLoading={isPending}
        loadingMessage="Carregando SUSEPs..."
        emptyMessage="Nenhuma SUSEP vinculada."
      />
    </DialogContent>
  );
};

export default ManageSusepsDialog;
