"use client";

import { useEffect, useState } from "react";

import { finishGoalfyDistributionBatchAction } from "@/src/actions/clients/finish-goalfy-distribution-batch";
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

interface PendingBatch {
  batchId: string;
  mode: string;
  status: string;
  operatorName: string;
  canReconcile: boolean;
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

  const reconcileBatch = async (batchId: string) => {
    if (reconcilingId || view.loading || view.loadingMore) {
      return;
    }

    setReconcilingId(batchId);
    setReconcileMessage(null);

    let confirmedCount = 0;
    let result: {
      confirmed: { opportunityId: string }[];
      unresolved: { opportunityId: string; reason: string }[];
      remaining: number;
    } | null = null;

    try {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        if (attempt === 2) {
          // Tempo para eventual atualização do índice Goalfy.
          await new Promise<void>((resolve) => setTimeout(resolve, 3000));
        }

        try {
          // Esta ação consulta e confirma cards existentes.
          // NÃO executa novo POST de criação.
          const response = await finishGoalfyDistributionBatchAction({
            batchId,
          });

          if (!response?.data) {
            throw new Error("Consulta sem resultado válido.");
          }

          result = response.data;
          confirmedCount += result.confirmed.length;

          if (result.remaining === 0) {
            break;
          }

          const retryable = result.unresolved.some(
            (item) =>
              item.reason === "not_found" ||
              item.reason === "incomplete_response",
          );

          // Divergência de responsável, duplicidade ou erro
          // transacional exige revisão, não mais tentativas.
          if (!retryable) {
            break;
          }
        } catch (error) {
          if (attempt === 2) {
            throw error;
          }

          console.warn(
            "[GOALFY RECONCILIATION] Primeira consulta falhou:",
            error instanceof Error ? error.message : "Erro desconhecido",
          );
        }
      }

      if (!result) {
        throw new Error("Nenhuma conferência concluída.");
      }

      if (result.remaining === 0) {
        const message =
          `${confirmedCount} oportunidade(s) confirmada(s). ` +
          "Lote concluído sem novos envios.";

        setReconcileMessage(message);

        toast.add({
          type: "success",
          title: "Conciliação concluída",
          description: message,
        });
      } else {
        const notFound = result.unresolved.some(
          (item) =>
            item.reason === "not_found" ||
            item.reason === "incomplete_response",
        );

        const message = notFound
          ? "Possível instabilidade ou atraso no Goalfy. " +
            "A oportunidade ainda não foi localizada após as conferências. " +
            "Tente novamente em alguns minutos. " +
            "Ela permanece protegida contra duplicidade."
          : "A conciliação encontrou uma divergência que exige revisão. " +
            "Nenhum card será reenviado automaticamente.";

        setReconcileMessage(message);

        toast.add({
          type: "error",
          title: notFound
            ? "Goalfy: confirmação pendente"
            : "Conciliação exige revisão",
          description: message,
        });
      }
    } catch (error) {
      console.error(
        "[GOALFY RECONCILIATION] Falha:",
        error instanceof Error ? error.message : "Erro desconhecido",
      );

      const message =
        "Não foi possível consultar o Goalfy após duas tentativas. " +
        "Pode haver instabilidade. Tente novamente em alguns minutos. " +
        "Nenhum card foi reenviado e as oportunidades permanecem protegidas.";

      setReconcileMessage(message);

      toast.add({
        type: "error",
        title: "Instabilidade na conferência Goalfy",
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
            Esta tela não realiza novos envios.
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

                {batch.canReconcile && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        reconcilingId !== null ||
                        view.loading ||
                        view.loadingMore
                      }
                      onClick={() => {
                        void reconcileBatch(batch.batchId);
                      }}
                    >
                      {reconcilingId === batch.batchId
                        ? "Conferindo..."
                        : "Conferir novamente"}
                    </Button>
                  </div>
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
