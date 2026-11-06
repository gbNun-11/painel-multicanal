"use client";

import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  }, [context.enterpriseInsurerId, execute]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadSuseps();
  }, [open, loadSuseps]);

  const susepCodeById = useMemo(
    () => new Map(suseps.map((susep) => [susep.id, susep.code])),
    [suseps],
  );

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Gerenciar SUSEPs</DialogTitle>

        <DialogDescription>
          Consulte e gerencie as SUSEPs vinculadas à empresa e seguradora.
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

              <TableHead className="w-12" />
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

                  <TableCell>
                    {susep.masterSusepId
                      ? (susepCodeById.get(susep.masterSusepId) ?? "—")
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <Badge variant={susep.multichannel ? "default" : "outline"}>
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

                  <TableCell className="text-right">
                    <SusepActions
                      susep={susep}
                      context={context}
                      onSuccess={loadSuseps}
                    />
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
