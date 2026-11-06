"use client";

import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";

import { getSusepsAction } from "@/src/actions/suseps/get-suseps";
import { Badge } from "@/src/components/ui/badge";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { toast } from "@/src/components/ui/toast";
import { statusLabels } from "@/src/constants/enums";

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

  const getMasterCode = (masterSusepId: string | null) => {
    if (!masterSusepId) {
      return "—";
    }

    return suseps.find((susep) => susep.id === masterSusepId)?.code ?? "—";
  };

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

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted/60 dark:bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold">SUSEP</TableHead>

              <TableHead className="font-semibold">Master</TableHead>

              <TableHead className="font-semibold">Multicanal</TableHead>

              <TableHead className="font-semibold">Status</TableHead>

              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    Carregando SUSEPs...
                  </div>
                </TableCell>
              </TableRow>
            ) : suseps.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhuma SUSEP vinculada.
                </TableCell>
              </TableRow>
            ) : (
              suseps.map((susep) => (
                <TableRow key={susep.id}>
                  <TableCell className="font-medium">{susep.code}</TableCell>

                  <TableCell>{getMasterCode(susep.masterSusepId)}</TableCell>

                  <TableCell>
                    <Badge
                      variant={susep.multichannel ? "default" : "secondary"}
                    >
                      {susep.multichannel ? "Sim" : "Não"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        susep.status === "ativo" ? "default" : "secondary"
                      }
                    >
                      {statusLabels[susep.status]}
                    </Badge>
                  </TableCell>

                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  );
};

export default ManageSusepsDialog;
