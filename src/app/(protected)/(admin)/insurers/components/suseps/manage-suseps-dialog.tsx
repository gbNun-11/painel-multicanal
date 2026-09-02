"use client";

import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";

import { getSusepsAction } from "@/src/actions/insurers/suseps/get-suseps";
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
import type { SusepTableRow } from "./types";

interface ManageSusepsDialogProps {
  open: boolean;
  enterpriseInsurerId: string;
  insurerName: string;
  enterpriseName: string;
}

const ManageSusepsDialog = ({
  open,
  enterpriseInsurerId,
  insurerName,
  enterpriseName,
}: ManageSusepsDialogProps) => {
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
      enterpriseInsurerId,
    });
  }, [execute, enterpriseInsurerId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadSuseps();
  }, [open, loadSuseps]);

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Gerenciar SUSEPs</DialogTitle>

        <DialogDescription>
          Consulte as SUSEPs vinculadas à empresa e seguradora selecionadas.
        </DialogDescription>
      </DialogHeader>

      <Separator />

      <div className="grid gap-3 rounded-md border p-4">
        <div>
          <p className="text-sm text-muted-foreground">Seguradora</p>

          <p className="font-medium">{insurerName}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Empresa</p>

          <p className="font-medium">{enterpriseName}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted/60 dark:bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold">SUSEP</TableHead>

              <TableHead className="font-semibold">Status</TableHead>

              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2Icon className="size-4 animate-spin" />
                    Carregando SUSEPs...
                  </div>
                </TableCell>
              </TableRow>
            ) : suseps.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
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
                    <Badge
                      variant={
                        susep.status === "ativo" ? "default" : "secondary"
                      }
                    >
                      {statusLabels[susep.status]}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <SusepActions susep={susep} onSuccess={loadSuseps} />
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
