"use client";

import { useEffect, useState } from "react";

import { dispatchGoalfyBatchNotificationsAction } from "@/src/actions/clients/dispatch-goalfy-batch-notifications";
import { reconcileGoalfyDistributionBatchAction } from "@/src/actions/clients/reconcile-goalfy-distribution-batch";
import { getGoalfyBatchClientsAction } from "@/src/actions/clients/get-goalfy-batch-clients";
import { getPendingGoalfyDistributionBatchesAction } from "@/src/actions/clients/get-pending-goalfy-distribution-batches";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "@/src/components/ui/toast";

import GoalfyNotificationReview from "./goalfy-notification-review";

interface PendingBatch {
  batchId: string;
  mode: string;
  status: string;
  operatorName: string;
  canReconcile: boolean;
  canDispatch: boolean;
  whatsappPending: number;
  emailPending: number;
  notificationSending: number;
  notificationUncertain: number;
  notificationDelivered: number;
  startedAt: string;
  reserved: number;
  sent: number;
  inconclusive: number;
  remaining: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ViewState {
  batches: PendingBatch[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  canViewAll: boolean;
  page: number;
  error: string | null;
}

const statusLabel: Record<string, string> = {
  running: "Em andamento",
  reconciling: "Em conciliação",
  interrupted: "Interrompido",
};

const loadBatches = async (page: number) => {
  const response = await getPendingGoalfyDistributionBatchesAction({ page });

  if (!response?.data || !Array.isArray(response.data.batches)) {
    throw new Error("Falha ao consultar lotes pendentes.");
  }

  return response.data;
};

const GoalfyPendingBatchesDialog = ({ open, onOpenChange }: Props) => {
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [reviewBatchId, setReviewBatchId] = useState<string | null>(null);
  const [clientsBatchId, setClientsBatchId] = useState<string | null>(null);
  const [clientsPage, setClientsPage] = useState(0);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsMore, setClientsMore] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{
    opportunityId: string;
    name: string;
    product: string;
    salesModel: string | null;
    distributionStatus: string;
    batchStatus: string;
    attemptCount: number;
    errorCode: string | null;
    lastHttpStatus: number | null;
    salespersonName: string;
  }>>([]);
  const [reconcileMessage, setReconcileMessage] = useState<string | null>(null);

  const [view, setView] = useState<ViewState>({
    batches: [],
    loading: true,
    loadingMore: false,
    hasMore: false,
    canViewAll: false,
    page: 0,
    error: null,
  });

  useEffect(() => {
    let active = true;

    void loadBatches(0)
      .then((result) => {
        if (!active) return;

        setView({
          batches: result.batches,
          loading: false,
          loadingMore: false,
          hasMore: result.hasMore,
          canViewAll: result.canViewAll,
          page: 0,
          error: null,
        });
      })
      .catch(() => {
        if (!active) return;

        setView((current) => ({
          ...current,
          loading: false,
          error: "Falha ao consultar os lotes pendentes.",
        }));
      });

    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    if (view.loading || view.loadingMore) return;

    setView((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const result = await loadBatches(0);

      setView({
        batches: result.batches,
        loading: false,
        loadingMore: false,
        hasMore: result.hasMore,
        canViewAll: result.canViewAll,
        page: 0,
        error: null,
      });
    } catch {
      setView((current) => ({
        ...current,
        loading: false,
        error: "Falha ao atualizar os lotes.",
      }));
    }
  };

  const loadMore = async () => {
    if (view.loading || view.loadingMore || !view.hasMore) return;

    const nextPage = view.page + 1;

    setView((current) => ({
      ...current,
      loadingMore: true,
      error: null,
    }));

    try {
      const result = await loadBatches(nextPage);

      setView((current) => {
        const existingIds = new Set(
          current.batches.map((batch) => batch.batchId),
        );

        return {
          ...current,
          batches: [
            ...current.batches,
            ...result.batches.filter(
              (batch) => !existingIds.has(batch.batchId),
            ),
          ],
          loadingMore: false,
          hasMore: result.hasMore,
          page: nextPage,
          error: null,
        };
      });
    } catch {
      setView((current) => ({
        ...current,
        loadingMore: false,
        error: "Falha ao carregar mais lotes.",
      }));
    }
  };

  const dispatchBatch = async (batchId: string) => {
    if (
      reconcilingId ||
      dispatchingId ||
      view.loading ||
      view.loadingMore
    ) {
      return;
    }

    setDispatchingId(batchId);
    setReconcileMessage(null);

    try {
      // Esta é a única ação da tela que pode enviar mensagens.
      const response = await dispatchGoalfyBatchNotificationsAction({
        batchId,
      });

      if (!response?.data) {
        throw new Error(
          "Não foi possível processar as notificações.",
        );
      }

      const result = response.data;
      const counts = result.notifications;

      const message = result.completed
        ? result.acceptedGroups > 0
          ? `Lote encerrado. ${result.acceptedGroups} grupo(s) ` +
            "aceito(s) nesta execução."
          : "Lote finalizado sem novos envios."
        : `${result.acceptedGroups} grupo(s) aceito(s). ` +
          `${counts.pending} notificação(ões) aguardando envio, ` +
          `${counts.sending} em processamento e ` +
          `${counts.uncertain} exigindo revisão.`;

      const requiresAttention =
        result.attentionGroups > 0 ||
        counts.sending > 0 ||
        counts.uncertain > 0;

      setReconcileMessage(message);

      toast.add({
        type: requiresAttention ? "error" : "success",
        title: requiresAttention
          ? "Notificações exigem atenção"
          : result.completed
            ? "Lote concluído"
            : "Notificações processadas",
        description: message,
      });
    } catch (error) {
      console.error(
        "[GOALFY NOTIFICATIONS] Falha:",
        error instanceof Error ? error.message : "Erro desconhecido",
      );

      const message =
        "Não foi possível confirmar o processamento das notificações. " +
        "Consulte novamente o lote antes de qualquer outra ação.";

      setReconcileMessage(message);

      toast.add({
        type: "error",
        title: "Falha no processamento",
        description: message,
      });
    } finally {
      await refresh();
      setDispatchingId(null);
    }
  };

  const consultClients = async (batchId: string, nextPage = 0) => {
    if (clientsLoading) return;
    setClientsBatchId(batchId);
    setClientsLoading(true);
    setClientsError(null);

    try {
      const result = await getGoalfyBatchClientsAction({
        batchId,
        page: nextPage,
      });

      if (!result?.data) throw new Error("Consulta de clientes indisponível.");

      setClients((current) =>
        nextPage === 0 ? result.data.clients : [...current, ...result.data.clients],
      );
      setClientsPage(nextPage);
      setClientsMore(result.data.hasMore);
    } catch {
      setClientsError("Não foi possível carregar os clientes deste lote.");
    } finally {
      setClientsLoading(false);
    }
  };

  const reconcileBatch = async (batchId: string) => {
    if (reconcilingId || dispatchingId || view.loading || view.loadingMore) {
      return;
    }

    setReconcilingId(batchId);
    setReconcileMessage(null);

    try {
      // Uma ação = uma consulta consolidada ao AdvancedFilter por empresa,
      // com um único reenvio por oportunidade ausente.
      const response = await reconcileGoalfyDistributionBatchAction({ batchId });

      if (!response?.data) {
        throw new Error("Conferência sem resposta válida.");
      }

      const result = response.data;
      const message = result.remaining === 0
        ? `${result.confirmed.length} oportunidade(s) confirmada(s). ` +
          "Nenhuma criação pendente neste lote."
        : `${result.confirmed.length} oportunidade(s) confirmada(s), ` +
          `${result.remaining} ainda pendente(s). ` +
          "As pendências permanecem disponíveis para a próxima conferência.";

      setReconcileMessage(message);
      toast.add({
        type: result.remaining === 0 ? "success" : "error",
        title: result.remaining === 0
          ? "Conferência concluída"
          : "Conferência com pendências",
        description: message,
      });

      if (clientsBatchId === batchId) {
        setClients([]);
        setClientsBatchId(null);
      }
    } catch (error) {
      console.error(
        "[GOALFY RECONCILIATION] Falha:",
        error instanceof Error ? error.message : "Erro desconhecido",
      );

      const message =
        "A conferência não foi concluída. O lote permanece protegido. " +
        "Confira novamente quando desejar.";
      setReconcileMessage(message);
      toast.add({
        type: "error",
        title: "Falha na conferência",
        description: message,
      });
    } finally {
      try {
        const refreshed = await loadBatches(0);
        setView({
          batches: refreshed.batches,
          loading: false,
          loadingMore: false,
          hasMore: refreshed.hasMore,
          canViewAll: refreshed.canViewAll,
          page: 0,
          error: null,
        });
      } catch {
        setView((current) => ({
          ...current,
          error: "Não foi possível atualizar a lista de lotes.",
        }));
      }
      setReconcilingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lotes pendentes do Goalfy</DialogTitle>

          <DialogDescription>
            {view.canViewAll
              ? "Visualização de todos os lotes pendentes."
              : "Visualização dos seus lotes pendentes."}{" "}
            Conferir novamente consulta o AdvancedFilter e tenta criar
            somente os cards ausentes. As notificações permanecem separadas.
          </DialogDescription>
        </DialogHeader>

        {view.loading && (
          <p className="text-muted-foreground text-sm">Consultando lotes...</p>
        )}

        {view.error && (
          <p role="alert" className="text-destructive text-sm">
            {view.error}
          </p>
        )}

        {!view.loading && view.batches.length === 0 && !view.error && (
          <p className="text-muted-foreground text-sm">
            Nenhum lote pendente encontrado.
          </p>
        )}

        {view.batches.length > 0 && (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {view.batches.map((batch) => (
              <div
                key={batch.batchId}
                className="space-y-2 rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">
                    {statusLabel[batch.status] ?? batch.status}
                  </strong>

                  <span className="text-muted-foreground text-xs">
                    {new Date(batch.startedAt).toLocaleString("pt-BR")}
                  </span>
                </div>

                {view.canViewAll && (
                  <p className="text-xs">
                    Operador: <strong>{batch.operatorName}</strong>
                  </p>
                )}

                <p className="text-muted-foreground text-xs">
                  Modalidade:{" "}
                  {batch.mode === "automatic" ? "Automática" : "Selecionada"}
                </p>

                <p className="break-all text-xs">
                  Lote: <code>{batch.batchId}</code>
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <span>Reservados: {batch.reserved}</span>
                  <span>Enviados: {batch.sent}</span>
                  <span>Inconclusivos: {batch.inconclusive}</span>
                  <span className="font-medium">
                    Pendentes: {batch.remaining}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p>
                    WhatsApp pendente: {batch.whatsappPending}
                    {" · "}E-mail pendente: {batch.emailPending}
                  </p>
                  <p className="text-muted-foreground">
                    Entregues: {batch.notificationDelivered}
                    {" · "}Em processamento: {batch.notificationSending}
                    {" · "}Revisão necessária: {batch.notificationUncertain}
                  </p>
                </div>

                {batch.status === "running" && !batch.canReconcile && (
                  <p className="text-muted-foreground text-xs">
                    Importação inicial ainda em andamento.
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  {view.canViewAll &&
                    (batch.notificationUncertain > 0 ||
                      batch.notificationSending > 0) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setReviewBatchId((current) =>
                            current === batch.batchId
                              ? null
                              : batch.batchId,
                          );
                        }}
                      >
                        {reviewBatchId === batch.batchId
                          ? "Ocultar análise"
                          : "Analisar notificações"}
                      </Button>
                    )}

                  {batch.remaining > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={clientsLoading || reconcilingId !== null || dispatchingId !== null}
                      onClick={() => {
                        if (clientsBatchId === batch.batchId) {
                          setClientsBatchId(null);
                          setClients([]);
                        } else {
                          setClients([]);
                          void consultClients(batch.batchId);
                        }
                      }}
                    >
                      {clientsBatchId === batch.batchId
                        ? "Ocultar clientes"
                        : "Consultar clientes"}
                    </Button>
                  )}

                  {batch.canReconcile && batch.remaining > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        reconcilingId !== null ||
                        dispatchingId !== null ||
                        view.loading ||
                        view.loadingMore
                      }
                      onClick={() => { void reconcileBatch(batch.batchId); }}
                    >
                      {reconcilingId === batch.batchId
                        ? "Conferindo..."
                        : "Conferir novamente"}
                    </Button>
                  )}

                  {batch.canDispatch && (
                    <Button
                      type="button"
                      disabled={
                        dispatchingId !== null ||
                        reconcilingId !== null ||
                        view.loading ||
                        view.loadingMore
                      }
                      onClick={() => {
                        void dispatchBatch(batch.batchId);
                      }}
                    >
                      {dispatchingId === batch.batchId
                        ? "Enviando..."
                        : batch.whatsappPending + batch.emailPending > 0
                          ? "Enviar notificações pendentes"
                          : "Finalizar lote"}
                    </Button>
                  )}
                </div>

                {clientsBatchId === batch.batchId && (
                  <div className="space-y-2 rounded-md border p-3">
                    <strong className="text-sm">Clientes problemáticos deste lote</strong>
                    {clientsLoading && (
                      <p className="text-muted-foreground text-xs">Consultando clientes...</p>
                    )}
                    {clientsError && (
                      <p role="alert" className="text-destructive text-xs">{clientsError}</p>
                    )}
                    {!clientsLoading && clients.length === 0 && !clientsError && (
                      <p className="text-muted-foreground text-xs">
                        Nenhuma oportunidade pendente.
                      </p>
                    )}
                    {clients.map((item) => (
                      <div key={item.opportunityId} className="space-y-1 border-t py-2 text-xs">
                        <p><strong>{item.name}</strong> · {item.product} · {item.salesModel ?? "Sem modelo"}</p>
                        <p>Vendedor: {item.salespersonName}</p>
                        <p>Status: {item.distributionStatus} / {item.batchStatus}
                          {" · "}Tentativas: {item.attemptCount}
                        </p>
                        {item.errorCode && (
                          <p className="text-muted-foreground">
                            Último erro: {item.errorCode}
                            {item.lastHttpStatus ? ` (HTTP ${item.lastHttpStatus})` : ""}
                          </p>
                        )}
                        <p className="text-muted-foreground break-all">
                          Oportunidade: {item.opportunityId}
                        </p>
                      </div>
                    ))}
                    {clientsMore && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={clientsLoading}
                        onClick={() => { void consultClients(batch.batchId, clientsPage + 1); }}
                      >
                        Carregar mais clientes
                      </Button>
                    )}
                  </div>
                )}

                {view.canViewAll &&
                  reviewBatchId === batch.batchId && (
                    <GoalfyNotificationReview
                      batchId={batch.batchId}
                      onResolved={() => {
                        void refresh();
                      }}
                    />
                  )}
              </div>
            ))}
          </div>
        )}

        {!view.loading && view.hasMore && (
          <Button
            variant="outline"
            disabled={view.loadingMore}
            onClick={loadMore}
          >
            {view.loadingMore ? "Carregando..." : "Carregar mais 30"}
          </Button>
        )}

        {reconcileMessage && (
          <p role="status" className="text-muted-foreground text-xs">
            {reconcileMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={view.loading || view.loadingMore}
            onClick={refresh}
          >
            Atualizar
          </Button>

          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalfyPendingBatchesDialog;
