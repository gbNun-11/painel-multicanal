"use client";

import { RefreshCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { dispatchGoalfyBatchNotificationsAction } from "@/src/actions/clients/dispatch-goalfy-batch-notifications";
import { distributeGoalfyClientAction } from "@/src/actions/clients/distribute-goalfy-client";
import { distributeSelectedGoalfyClientAction } from "@/src/actions/clients/distribute-selected-goalfy-client";
import { finishGoalfyDistributionBatchAction } from "@/src/actions/clients/finish-goalfy-distribution-batch";
import { sendGoalfyImportErrorReportAction } from "@/src/actions/clients/send-goalfy-import-error-report";
import { startGoalfyDistributionBatchAction } from "@/src/actions/clients/start-goalfy-distribution-batch";
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
import GoalfyPendingBatchesDialog from "./goalfy-pending-batches-dialog";
import GoalfySelectedImportDialog from "./goalfy-selected-import-dialog";

interface ClientsSyncMenuProps {
  syncLabel: string;
  goalfyOptions: GoalfyImportOptions;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

interface SuccessfulGroup {
  enterpriseInsurerId: string;
  clientIds: string[];
  products: Set<string>;
}

interface BulkEmailGroup extends SuccessfulGroup {
  salespersonId: string;
}

const ClientsSyncMenu = ({
  syncLabel,
  goalfyOptions,
}: ClientsSyncMenuProps) => {
  const router = useRouter();

  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const [selectedImportOpen, setSelectedImportOpen] = useState(false);

  const [pendingBatchesOpen, setPendingBatchesOpen] = useState(false);

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

    const importFailures: GoalfyImportFailure[] = [];

    const confirmedGroups = new Map<string, BulkEmailGroup>();
    const confirmedOpportunityIds = new Set<string>();

    const rememberConfirmed = (item: {
      opportunityId: string;
      enterpriseInsurerId: string;
      salespersonId: string;
      product: string;
    }) => {
      if (confirmedOpportunityIds.has(item.opportunityId)) {
        return false;
      }

      confirmedOpportunityIds.add(item.opportunityId);

      const key = `${item.enterpriseInsurerId}:${item.salespersonId}`;
      const existing = confirmedGroups.get(key);

      if (existing) {
        existing.clientIds.push(item.opportunityId);
        existing.products.add(item.product);
      } else {
        confirmedGroups.set(key, {
          enterpriseInsurerId: item.enterpriseInsurerId,
          salespersonId: item.salespersonId,
          clientIds: [item.opportunityId],
          products: new Set([item.product]),
        });
      }

      return true;
    };

    let batchId: string;
    let completionToken: string;

    try {
      const started = await startGoalfyDistributionBatchAction({
        mode: "automatic",
        sendListByWhatsApp: payload.sendListByWhatsApp,
        sendListByEmail: payload.sendListByEmail,
      });

      if (
        !started?.data?.batchId ||
        !started.data.completionToken
      ) {
        throw new Error("Não foi possível abrir o lote.");
      }

      batchId = started.data.batchId;
      completionToken = started.data.completionToken;
    } catch {
      toast.add({
        type: "error",
        title: "Importação não iniciada",
        description: "Falha ao registrar o lote no PostgreSQL.",
      });

      return;
    }

    onProgress(0, totalImports);

    for (const block of payload.blocks) {
      for (const allocation of block.allocations) {
        for (let index = 0; index < allocation.quantity; index += 1) {
          try {
            const result = await distributeGoalfyClientAction({
              enterpriseInsurerId: block.enterpriseInsurerId,

              product: block.product,

              salesModel: block.salesModel,

              salespersonId: allocation.userId,
              batchId,
            });

            if (
          result?.data?.success === false &&
          "awaitingReconciliation" in result.data &&
          result.data.awaitingReconciliation === true
        ) {
          // POST aceito; a confirmação será feita
          // exclusivamente pela conciliação do lote.
        } else if (result?.data?.success === true && result.data.client) {
              if (
                rememberConfirmed({
                  opportunityId: result.data.client.id,
                  enterpriseInsurerId: block.enterpriseInsurerId,
                  salespersonId: allocation.userId,
                  product: block.product,
                })
              ) {
                successfulImports += 1;
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

      }
    }

    // Todas as ações individuais terminaram.
    // Somente agora executamos a conciliação consolidada.
    let finishedResult;

    try {
      finishedResult = await finishGoalfyDistributionBatchAction({
        batchId,
        completionToken,
      });
    } catch {
      finishedResult = null;
    }

    if (!finishedResult?.data) {
      router.refresh();

      toast.add({
        type: "error",
        title: "Lote aguardando conciliação",
        description:
          `Lote ${batchId}: não foi possível concluir a consulta. ` +
          "Nenhuma lista foi enviada. Não repita a importação.",
      });

      return;
    }

    const reconciliation = finishedResult.data;
    const recoveredIds = new Set<string>();

    for (const item of reconciliation.confirmed) {
      recoveredIds.add(item.opportunityId);

      if (rememberConfirmed(item)) {
        successfulImports += 1;
      }
    }

    // Uma falha recuperada não deve continuar sendo apresentada
    // como falha de criação no relatório final.
    for (let index = importFailures.length - 1; index >= 0; index -= 1) {
      const failure = importFailures[index];

      if (
        failure.stage === "goalfy" &&
        failure.clientIds.some((id) => recoveredIds.has(id))
      ) {
        importFailures.splice(index, 1);
        failedImports = Math.max(0, failedImports - 1);
      }
    }

    // Todas as notificações confirmadas são controladas
    // pelo despachante compartilhado, nunca por envio direto.
    let notificationsPending = false;
    let notificationMessage = "";

    if (payload.sendListByWhatsApp || payload.sendListByEmail) {
      try {
        const dispatched =
          await dispatchGoalfyBatchNotificationsAction({
            batchId,
          });

        if (!dispatched?.data) {
          notificationsPending = true;
          notificationMessage =
            "Despacho não concluído. Consulte os lotes pendentes.";
        } else {
          const state = dispatched.data;
          const counts = state.notifications;

          notificationsPending =
            counts.pending > 0 ||
            counts.sending > 0 ||
            counts.uncertain > 0;

          if (notificationsPending) {
            notificationMessage =
              `${counts.pending} notificação(ões) aguardando envio, ` +
              `${counts.sending} em processamento e ` +
              `${counts.uncertain} exigindo revisão.`;
          }
        }
      } catch (error) {
        console.error(
          "[GOALFY NOTIFICATIONS] Falha ao despachar:",
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        );

        notificationsPending = true;
        notificationMessage =
          "Notificações não concluídas. Consulte os lotes pendentes.";
      }
    }

    const errorReportFailed = await sendErrorReport(importFailures);

    router.refresh();

    if (
      failedImports === 0 &&
      !notificationsPending &&
      reconciliation.remaining === 0
    ) {
      toast.add({
        type: "success",

        title: "Importação concluída",

        description:
          `${successfulImports} cliente(s) ` + "distribuído(s) com sucesso.",
      });

      return;
    }

    const details = [`${successfulImports} cliente(s) distribuído(s)`];

    if (reconciliation.remaining > 0) {
      details.push(
        `${reconciliation.remaining} oportunidade(s) aguardando conciliação`,
      );
    }

    if (failedImports > 0) {
      details.push(`${failedImports} falha(s) na criação`);
    }

    if (notificationsPending) {
      details.push(notificationMessage);
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

      title:
        reconciliation.remaining > 0 || notificationsPending
          ? "Importação com pendências"
          : "Importação concluída com falhas",

      description: details.join(" • "),
    });
  };

  const handleSelectedImport: GoalfySelectedImportRunner = async (
    payload,
    onProgress,
  ) => {
    let batchId: string;
    let completionToken: string;

    // O lote deve existir antes de reservar qualquer oportunidade.
    try {
      const started = await startGoalfyDistributionBatchAction({
        mode: "selected",
        sendListByWhatsApp: payload.sendListByWhatsApp,
        sendListByEmail: payload.sendListByEmail,
      });

      if (
        !started?.data?.batchId ||
        !started.data.completionToken
      ) {
        throw new Error("Não foi possível registrar o lote.");
      }

      batchId = started.data.batchId;
      completionToken = started.data.completionToken;
    } catch {
      toast.add({
        type: "error",
        title: "Transferência não iniciada",
        description:
          "Falha ao abrir o lote no PostgreSQL. " +
          "Nenhuma distribuição foi iniciada.",
      });
      return;
    }

    const failedIds = new Set<string>();
    const importFailures: GoalfyImportFailure[] = [];

    let completedImports = 0;

    onProgress(0, payload.clientIds.length);

    for (const clientId of payload.clientIds) {
      try {
        const response = await distributeSelectedGoalfyClientAction({
          clientId,
          salespersonId: payload.salespersonId,
          batchId,
        });

        const result = response?.data;

        if (
          result?.success === false &&
          "awaitingReconciliation" in result &&
          result.awaitingReconciliation === true
        ) {
          // POST iniciado, mas ainda não confirmado no Goalfy.
          // Não repetir e não contar como falha.
          continue;
        }

        if (result?.success === false && result.failure) {
          failedIds.add(clientId);

          const failure = result.failure;

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
        } else if (result?.success !== true) {
          failedIds.add(clientId);
        }
      } catch (error) {
        failedIds.add(clientId);

        console.error(
          "[GOALFY SELECTED] Falha ao distribuir:",
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        );
      } finally {
        completedImports += 1;
        onProgress(completedImports, payload.clientIds.length);
      }
    }

    // Conciliação única após todos os POSTs individuais.
    // O fechamento nunca cria um novo card.
    let finished;

    try {
      finished = await finishGoalfyDistributionBatchAction({
        batchId,
        completionToken,
      });
    } catch {
      finished = null;
    }

    if (!finished?.data) {
      router.refresh();

      toast.add({
        type: "error",
        title: "Transferência aguardando conciliação",
        description:
          `Lote ${batchId}: não foi possível confirmar os cards. ` +
          "Consulte Lotes pendentes. Não repita a transferência.",
      });

      return;
    }

    const reconciliation = finished.data;

    const confirmedIds = new Set(
      reconciliation.confirmed.map((item) => item.opportunityId),
    );

    // Remover falhas de criação posteriormente recuperadas.
    for (const opportunityId of confirmedIds) {
      failedIds.delete(opportunityId);
    }

    const finalFailures = importFailures.filter(
      (failure) =>
        !failure.clientIds.some((id) => confirmedIds.has(id)),
    );

    let notificationsPending = false;
    let notificationMessage = "";

    if (payload.sendListByWhatsApp || payload.sendListByEmail) {
      try {
        const dispatched =
          await dispatchGoalfyBatchNotificationsAction({
            batchId,
          });

        if (!dispatched?.data) {
          notificationsPending = true;
          notificationMessage =
            "Falha ao processar notificações. " +
            "Consulte Lotes pendentes.";
        } else {
          const state = dispatched.data;
          const counts = state.notifications;

          notificationsPending =
            counts.pending > 0 ||
            counts.sending > 0 ||
            counts.uncertain > 0 ||
            state.attentionGroups > 0 ||
            (!state.completed && reconciliation.remaining === 0);

          if (notificationsPending) {
            notificationMessage =
              `${counts.pending} notificação(ões) aguardando envio, ` +
              `${counts.sending} em processamento e ` +
              `${counts.uncertain} exigindo revisão.`;
          }
        }
      } catch {
        notificationsPending = true;
        notificationMessage =
          "Envio de notificações não concluído. " +
          "Consulte Lotes pendentes.";
      }
    }

    const errorReportFailed = await sendErrorReport(finalFailures);

    clearSelection();
    router.refresh();

    const hasPending =
      reconciliation.remaining > 0 ||
      reconciliation.unresolved.length > 0 ||
      notificationsPending;

    if (failedIds.size === 0 && !hasPending) {
      toast.add({
        type: "success",
        title: "Transferência concluída",
        description:
          `${confirmedIds.size} oportunidade(s) selecionada(s) ` +
          "confirmada(s) no Goalfy.",
      });

      return;
    }

    const details = [
      `${confirmedIds.size} oportunidade(s) confirmada(s)`,
    ];

    if (reconciliation.remaining > 0) {
      details.push(
        `${reconciliation.remaining} aguardando conciliação`,
      );
    }

    if (
      reconciliation.unresolved.length > 0 &&
      reconciliation.remaining === 0
    ) {
      details.push("conciliação exige revisão");
    }

    if (failedIds.size > 0) {
      details.push(`${failedIds.size} falha(s) na distribuição`);
    }

    if (notificationsPending) {
      details.push(notificationMessage);
    }

    if (finalFailures.length > 0) {
      details.push(
        errorReportFailed
          ? "relatório de erros não enviado"
          : "relatório de erros enviado",
      );
    }

    toast.add({
      type: "error",
      title: hasPending
        ? "Transferência com pendências"
        : "Transferência concluída com falhas",
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

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setPendingBatchesOpen(true)}
            >
              Lotes pendentes
            </DropdownMenuItem>

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

      {pendingBatchesOpen && (
        <GoalfyPendingBatchesDialog
          open={pendingBatchesOpen}
          onOpenChange={setPendingBatchesOpen}
        />
      )}

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
