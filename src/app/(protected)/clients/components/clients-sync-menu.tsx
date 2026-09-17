"use client";

import { RefreshCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { distributeGoalfyClientAction } from "@/src/actions/clients/distribute-goalfy-client";
import { distributeSelectedGoalfyClientAction } from "@/src/actions/clients/distribute-selected-goalfy-client";
import { sendGoalfyEmailListAction } from "@/src/actions/clients/send-goalfy-email-list";
import { sendGoalfyImportErrorReportAction } from "@/src/actions/clients/send-goalfy-import-error-report";
import { sendGoalfyWhatsAppListAction } from "@/src/actions/clients/send-goalfy-whatsapp-list";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { toast } from "@/src/components/ui/toast";
import type { GoalfyImportFailure } from "@/src/data/clients/goalfy-import-error-types";
import type {
  GoalfyBulkImportRunner,
  GoalfyImportOptions,
} from "@/src/data/clients/goalfy-import-types";
import type { GoalfySelectedImportRunner } from "@/src/data/clients/goalfy-selected-import-types";

import { useClientsSelection } from "./clients-selection-context";
import GoalfyBulkImportDialog from "./goalfy-bulk-import-dialog";
import GoalfySelectedImportDialog from "./goalfy-selected-import-dialog";

interface ClientsSyncMenuProps {
  syncLabel: string;

  goalfyOptions: GoalfyImportOptions;
}

const CLIENTS_PER_REQUEST = 500;

const chunkArray = <T,>(values: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

interface SuccessfulGroup {
  enterpriseInsurerId: string;

  clientIds: string[];

  products: Set<string>;
}

const getGroupProduct = (group: SuccessfulGroup) => {
  const products = [...group.products];

  if (products.length === 1) {
    return products[0];
  }

  return "Múltiplos produtos";
};

const ClientsSyncMenu = ({
  syncLabel,
  goalfyOptions,
}: ClientsSyncMenuProps) => {
  const router = useRouter();

  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const [selectedImportOpen, setSelectedImportOpen] = useState(false);

  const { selectedClientIds, hasSelection, clearSelection } =
    useClientsSelection();

  const sendErrorReport = async (failures: GoalfyImportFailure[]) => {
    if (failures.length === 0) {
      return false;
    }

    try {
      const result = await sendGoalfyImportErrorReportAction({
        failures,
      });

      if (!result?.data?.success) {
        console.error(
          "[GOALFY ERROR REPORT] Falha ao enviar relatório:",
          result,
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error("[GOALFY ERROR REPORT] Erro:", error);

      return true;
    }
  };

  const handleBulkImport: GoalfyBulkImportRunner = async (
    payload,
    onProgress,
  ) => {
    const totalImports = payload.blocks.reduce(
      (blocksTotal, block) =>
        blocksTotal +
        block.allocations.reduce(
          (allocationsTotal, allocation) =>
            allocationsTotal + allocation.quantity,
          0,
        ),
      0,
    );

    let completedImports = 0;
    let successfulImports = 0;
    let failedImports = 0;
    let whatsappFailures = 0;
    let emailFailures = 0;

    const importFailures: GoalfyImportFailure[] = [];

    onProgress(0, totalImports);

    for (const block of payload.blocks) {
      for (const allocation of block.allocations) {
        const successfulClientIds: string[] = [];

        for (let index = 0; index < allocation.quantity; index += 1) {
          try {
            const result = await distributeGoalfyClientAction({
              enterpriseInsurerId: block.enterpriseInsurerId,

              product: block.product,

              salespersonId: allocation.userId,
            });

            if (result?.data?.success === true && result.data.client) {
              successfulImports += 1;

              successfulClientIds.push(result.data.client.id);
            } else {
              failedImports += 1;

              if (result?.data?.success === false && result.data.failure) {
                const failure = result.data.failure;

                importFailures.push({
                  stage: failure.stage,

                  enterpriseInsurerId: failure.enterpriseInsurerId,

                  product: failure.product,

                  salespersonId: failure.salespersonId,

                  clientIds: failure.clientId ? [failure.clientId] : [],

                  message: failure.message,

                  details: failure.details,

                  attempts: failure.attempts,

                  statusCode: failure.statusCode,

                  occurredAt: failure.occurredAt,
                });
              }
            }
          } catch (error) {
            failedImports += 1;

            importFailures.push({
              stage: "database",

              enterpriseInsurerId: block.enterpriseInsurerId,

              product: block.product,

              salespersonId: allocation.userId,

              clientIds: [],

              message: getErrorMessage(
                error,
                "Erro inesperado ao distribuir o cliente.",
              ),

              details: null,

              attempts: null,

              statusCode: null,

              occurredAt: new Date().toISOString(),
            });
          } finally {
            completedImports += 1;

            onProgress(completedImports, totalImports);
          }
        }

        if (payload.sendListByWhatsApp && successfulClientIds.length > 0) {
          for (const clientIds of chunkArray(
            successfulClientIds,
            CLIENTS_PER_REQUEST,
          )) {
            const result = await sendGoalfyWhatsAppListAction({
              salespersonId: allocation.userId,

              enterpriseInsurerId: block.enterpriseInsurerId,

              clientIds,
            });

            if (!result?.data?.success) {
              whatsappFailures += 1;

              importFailures.push({
                stage: "whatsapp",

                enterpriseInsurerId: block.enterpriseInsurerId,

                product: block.product,

                salespersonId: allocation.userId,

                clientIds,

                message:
                  result?.data?.error ??
                  "Não foi possível enviar a lista pelo WhatsApp.",

                details: null,

                attempts: null,

                statusCode: null,

                occurredAt: new Date().toISOString(),
              });
            }
          }
        }

        if (payload.sendListByEmail && successfulClientIds.length > 0) {
          for (const clientIds of chunkArray(
            successfulClientIds,
            CLIENTS_PER_REQUEST,
          )) {
            const result = await sendGoalfyEmailListAction({
              salespersonId: allocation.userId,

              enterpriseInsurerId: block.enterpriseInsurerId,

              clientIds,
            });

            if (!result?.data?.success) {
              emailFailures += 1;

              importFailures.push({
                stage: "email",

                enterpriseInsurerId: block.enterpriseInsurerId,

                product: block.product,

                salespersonId: allocation.userId,

                clientIds,

                message:
                  result?.data?.error ??
                  "Não foi possível enviar a lista por e-mail.",

                details: null,

                attempts: null,

                statusCode: null,

                occurredAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    const errorReportFailed = await sendErrorReport(importFailures);

    router.refresh();

    if (failedImports === 0 && whatsappFailures === 0 && emailFailures === 0) {
      toast.add({
        type: "success",

        title: "Importação concluída",

        description: `${successfulImports} cliente(s) distribuído(s) com sucesso.`,
      });

      return;
    }

    const details = [`${successfulImports} cliente(s) distribuído(s)`];

    if (failedImports > 0) {
      details.push(`${failedImports} falha(s) na criação`);
    }

    if (whatsappFailures > 0) {
      details.push(`${whatsappFailures} falha(s) no WhatsApp`);
    }

    if (emailFailures > 0) {
      details.push(`${emailFailures} falha(s) no e-mail`);
    }

    if (importFailures.length > 0) {
      details.push(
        errorReportFailed
          ? "relatório de erros não enviado"
          : "relatório de erros enviado",
      );
    }

    toast.add({
      type: "error",

      title: "Importação concluída com falhas",

      description: details.join(" • "),
    });
  };

  const handleSelectedImport: GoalfySelectedImportRunner = async (
    payload,
    onProgress,
  ) => {
    let completedImports = 0;
    let successfulImports = 0;
    let failedImports = 0;
    let whatsappFailures = 0;
    let emailFailures = 0;

    const importFailures: GoalfyImportFailure[] = [];

    const successfulGroups = new Map<string, SuccessfulGroup>();

    onProgress(0, payload.clientIds.length);

    for (const clientId of payload.clientIds) {
      try {
        const result = await distributeSelectedGoalfyClientAction({
          clientId,

          salespersonId: payload.salespersonId,
        });

        if (result?.data?.success === true && result.data.client) {
          successfulImports += 1;

          const enterpriseInsurerId = result.data.enterpriseInsurerId;

          const existing = successfulGroups.get(enterpriseInsurerId);

          if (existing) {
            existing.clientIds.push(result.data.client.id);

            existing.products.add(result.data.product);
          } else {
            successfulGroups.set(enterpriseInsurerId, {
              enterpriseInsurerId,

              clientIds: [result.data.client.id],

              products: new Set([result.data.product]),
            });
          }
        } else {
          failedImports += 1;

          if (result?.data?.success === false && result.data.failure) {
            const failure = result.data.failure;

            importFailures.push({
              stage: failure.stage,

              enterpriseInsurerId: failure.enterpriseInsurerId,

              product: failure.product,

              salespersonId: failure.salespersonId,

              clientIds: failure.clientId ? [failure.clientId] : [],

              message: failure.message,

              details: failure.details,

              attempts: failure.attempts,

              statusCode: failure.statusCode,

              occurredAt: failure.occurredAt,
            });
          }
        }
      } catch (error) {
        failedImports += 1;

        console.error("[GOALFY SELECTED] Erro inesperado:", error);
      } finally {
        completedImports += 1;

        onProgress(completedImports, payload.clientIds.length);
      }
    }

    for (const group of successfulGroups.values()) {
      const product = getGroupProduct(group);

      if (payload.sendListByWhatsApp) {
        for (const clientIds of chunkArray(
          group.clientIds,
          CLIENTS_PER_REQUEST,
        )) {
          try {
            const result = await sendGoalfyWhatsAppListAction({
              salespersonId: payload.salespersonId,

              enterpriseInsurerId: group.enterpriseInsurerId,

              clientIds,
            });

            if (!result?.data?.success) {
              whatsappFailures += 1;

              importFailures.push({
                stage: "whatsapp",

                enterpriseInsurerId: group.enterpriseInsurerId,

                product,

                salespersonId: payload.salespersonId,

                clientIds,

                message:
                  result?.data?.error ??
                  "Não foi possível enviar a lista pelo WhatsApp.",

                details: null,

                attempts: null,

                statusCode: null,

                occurredAt: new Date().toISOString(),
              });
            }
          } catch (error) {
            whatsappFailures += 1;

            importFailures.push({
              stage: "whatsapp",

              enterpriseInsurerId: group.enterpriseInsurerId,

              product,

              salespersonId: payload.salespersonId,

              clientIds,

              message: getErrorMessage(
                error,
                "Não foi possível enviar a lista pelo WhatsApp.",
              ),

              details: null,

              attempts: null,

              statusCode: null,

              occurredAt: new Date().toISOString(),
            });
          }
        }
      }

      if (payload.sendListByEmail) {
        for (const clientIds of chunkArray(
          group.clientIds,
          CLIENTS_PER_REQUEST,
        )) {
          try {
            const result = await sendGoalfyEmailListAction({
              salespersonId: payload.salespersonId,

              enterpriseInsurerId: group.enterpriseInsurerId,

              clientIds,
            });

            if (!result?.data?.success) {
              emailFailures += 1;

              importFailures.push({
                stage: "email",

                enterpriseInsurerId: group.enterpriseInsurerId,

                product,

                salespersonId: payload.salespersonId,

                clientIds,

                message:
                  result?.data?.error ??
                  "Não foi possível enviar a lista por e-mail.",

                details: null,

                attempts: null,

                statusCode: null,

                occurredAt: new Date().toISOString(),
              });
            }
          } catch (error) {
            emailFailures += 1;

            importFailures.push({
              stage: "email",

              enterpriseInsurerId: group.enterpriseInsurerId,

              product,

              salespersonId: payload.salespersonId,

              clientIds,

              message: getErrorMessage(
                error,
                "Não foi possível enviar a lista por e-mail.",
              ),

              details: null,

              attempts: null,

              statusCode: null,

              occurredAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    const errorReportFailed = await sendErrorReport(importFailures);

    clearSelection();

    router.refresh();

    if (failedImports === 0 && whatsappFailures === 0 && emailFailures === 0) {
      toast.add({
        type: "success",

        title: "Transferência concluída",

        description: `${successfulImports} cliente(s) selecionado(s) distribuído(s) com sucesso.`,
      });

      return;
    }

    const details = [`${successfulImports} cliente(s) distribuído(s)`];

    if (failedImports > 0) {
      details.push(`${failedImports} falha(s) na distribuição`);
    }

    if (whatsappFailures > 0) {
      details.push(`${whatsappFailures} falha(s) no WhatsApp`);
    }

    if (emailFailures > 0) {
      details.push(`${emailFailures} falha(s) no e-mail`);
    }

    if (importFailures.length > 0) {
      details.push(
        errorReportFailed
          ? "relatório de erros não enviado"
          : "relatório de erros enviado",
      );
    }

    toast.add({
      type: "error",

      title: "Transferência concluída com falhas",

      description: details.join(" • "),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button>
              <RefreshCcwIcon />
              Sincronizar
            </Button>
          }
        />

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sincronização</DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled>{syncLabel}</DropdownMenuItem>

            <DropdownMenuItem
              disabled={hasSelection}
              onClick={() => setBulkImportOpen(true)}
            >
              Transferir dados da Goalfy
            </DropdownMenuItem>

            {hasSelection && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setSelectedImportOpen(true)}>
                  Transferir {selectedClientIds.length} selecionado(s)
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <GoalfyBulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        options={goalfyOptions}
        onImport={handleBulkImport}
      />

      <GoalfySelectedImportDialog
        open={selectedImportOpen}
        onOpenChange={setSelectedImportOpen}
        selectedClientIds={selectedClientIds}
        commercialUsers={goalfyOptions.commercialUsers}
        onImport={handleSelectedImport}
      />
    </>
  );
};

export default ClientsSyncMenu;
