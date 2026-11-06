"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getMultichannelConfigurationAction } from "@/src/actions/multichannel/get-multichannel-configuration";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Dialog } from "@/src/components/ui/dialog";
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

import MultichannelAssignmentActions from "./multichannel-assignment-actions";
import type { MultichannelConfiguration } from "./types";
import UpsertMultichannelAssignmentForm from "./upsert-multichannel-assignment-form";

interface ManageMultichannelDialogProps {
  open: boolean;

  susepId: string;

  susepCode: string;

  enterpriseName: string;

  insurerName: string;
}

const ManageMultichannelDialog = ({
  open,
  susepId,
  susepCode,
  enterpriseName,
  insurerName,
}: ManageMultichannelDialogProps) => {
  const [configuration, setConfiguration] =
    useState<MultichannelConfiguration | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { execute, isPending } = useAction(getMultichannelConfigurationAction, {
    onSuccess: ({ data }) => {
      setConfiguration(data?.configuration ?? null);
    },

    onError: ({ error }) => {
      setConfiguration(null);

      toast.add({
        type: "error",

        title: "Erro ao carregar configuração multicanal",

        description:
          error.serverError ??
          "Não foi possível carregar a configuração multicanal.",
      });
    },
  });

  const loadConfiguration = useCallback(() => {
    execute({
      susepId,
    });
  }, [execute, susepId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadConfiguration();
  }, [open, loadConfiguration]);

  const availableProducts = useMemo(() => {
    if (!configuration) {
      return [];
    }

    const configuredProductIds = new Set(
      configuration.assignments.map((assignment) => assignment.productId),
    );

    return configuration.products.filter(
      (product) => !configuredProductIds.has(product.id),
    );
  }, [configuration]);

  const susepIsActive = configuration?.susep.status === "ativo";

  return (
    <>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configuração multicanal</DialogTitle>

          <DialogDescription>
            Configure o usuário de entrada para cada produto lógico desta SUSEP
            multicanal.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Empresa</p>

            <p className="font-medium">{enterpriseName}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Seguradora</p>

            <p className="font-medium">{insurerName}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">SUSEP multicanal</p>

            <p className="font-medium">{susepCode}</p>
          </div>
        </div>

        {isPending && !configuration ? (
          <div className="flex h-24 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Carregando configuração...
          </div>
        ) : configuration ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Produtos configurados</p>

                <p className="text-sm text-muted-foreground">
                  Cada produto lógico pode possuir somente um usuário
                  multicanal.
                </p>
              </div>

              <Button
                type="button"
                disabled={!susepIsActive || availableProducts.length === 0}
                onClick={() => {
                  setCreateDialogOpen(true);
                }}
              >
                <PlusIcon className="size-4" />
                Nova configuração
              </Button>
            </div>

            {!susepIsActive && (
              <p className="text-sm text-muted-foreground">
                A SUSEP está inativa. Ative-a para alterar configurações
                multicanal.
              </p>
            )}

            {susepIsActive &&
              availableProducts.length === 0 &&
              configuration.products.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos os produtos ativos desta seguradora já possuem
                  configuração para esta SUSEP.
                </p>
              )}

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-muted/60 dark:bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">Produto</TableHead>

                    <TableHead className="font-semibold">Usuário</TableHead>

                    <TableHead className="font-semibold">Status</TableHead>

                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isPending ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2Icon className="size-4 animate-spin" />
                          Atualizando...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : configuration.assignments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum produto configurado para esta SUSEP multicanal.
                      </TableCell>
                    </TableRow>
                  ) : (
                    configuration.assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="grid gap-1">
                            <span className="font-medium">
                              {assignment.productName}
                            </span>

                            {assignment.productStatus === "inativo" && (
                              <span className="text-xs text-destructive">
                                Produto inativo
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="grid gap-1">
                            <span>{assignment.userName}</span>

                            {assignment.userStatus === "inativo" && (
                              <span className="text-xs text-destructive">
                                Usuário inativo
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              assignment.status === "ativo"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {statusLabels[assignment.status]}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <MultichannelAssignmentActions
                            susepId={configuration.susep.id}
                            susepCode={configuration.susep.code}
                            susepStatus={configuration.susep.status}
                            assignment={assignment}
                            products={configuration.products}
                            users={configuration.users}
                            onSuccess={loadConfiguration}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}
      </DialogContent>

      {configuration && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <UpsertMultichannelAssignmentForm
            susepId={configuration.susep.id}
            susepCode={configuration.susep.code}
            products={availableProducts}
            users={configuration.users}
            onSuccess={() => {
              setCreateDialogOpen(false);

              loadConfiguration();
            }}
          />
        </Dialog>
      )}
    </>
  );
};

export default ManageMultichannelDialog;
