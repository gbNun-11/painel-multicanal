"use client";

import { useEffect, useState } from "react";

import { getGoalfyNotificationReviewAction } from "@/src/actions/clients/get-goalfy-notification-review";
import { resolveGoalfyNotificationReviewAction } from "@/src/actions/clients/resolve-goalfy-notification-review";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "@/src/components/ui/toast";

interface ReviewItem {
  id: string;
  opportunityId: string;
  clientName: string;
  product: string;
  enterpriseName: string;
  salespersonName: string;
  channel: string;
  status: string;
  attemptCount: number;
  lastErrorCode: string | null;
  claimedAt: string | null;
  updatedAt: string;
}

interface Props {
  batchId: string;
  onResolved?: () => void;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR");

const loadPage = async (batchId: string, page: number) => {
  const response = await getGoalfyNotificationReviewAction({
    batchId,
    page,
  });

  if (!response?.data) {
    throw new Error("Consulta administrativa não concluída.");
  }

  return response.data;
};

const GoalfyNotificationReview = ({
  batchId,
  onResolved,
}: Props) => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [evidenceReference, setEvidenceReference] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [attested, setAttested] = useState(false);

  useEffect(() => {
    let active = true;

    void loadPage(batchId, 0)
      .then((result) => {
        if (!active) return;

        setItems(result.items);
        setHasMore(result.hasMore);
        setPage(0);
        setLoading(false);
        setError(null);
      })
      .catch(() => {
        if (!active) return;

        setLoading(false);
        setError(
          "Não foi possível consultar os registros inconclusivos.",
        );
      });

    return () => {
      active = false;
    };
  }, [batchId]);

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const result = await loadPage(batchId, nextPage);

      setItems((current) => {
        const existing = new Set(
          current.map((item) => item.id),
        );

        return [
          ...current,
          ...result.items.filter(
            (item) => !existing.has(item.id),
          ),
        ];
      });

      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch {
      setError("Falha ao carregar mais notificações.");
    } finally {
      setLoadingMore(false);
    }
  };

  const openReview = (notificationId: string) => {
    setReviewingId((current) =>
      current === notificationId ? null : notificationId,
    );
    setEvidenceReference("");
    setResolutionNote("");
    setAttested(false);
    setError(null);
  };

  const resolveNotification = async (item: ReviewItem) => {
    if (
      resolvingId !== null ||
      item.status !== "uncertain" ||
      reviewingId !== item.id ||
      !attested
    ) {
      return;
    }

    const reference = evidenceReference.trim();
    const note = resolutionNote.trim();

    if (reference.length < 6 || reference.length > 240) {
      setError("Informe uma referência válida da evidência.");
      return;
    }

    if (note.length < 20 || note.length > 500) {
      setError(
        "A justificativa deve conter entre 20 e 500 caracteres.",
      );
      return;
    }

    if (!["email", "whatsapp"].includes(item.channel)) {
      setError("Canal de notificação inválido.");
      return;
    }

    if (
      !window.confirm(
        "Confirma que verificou no serviço externo o aceite " +
          "da mensagem para todos os destinatários obrigatórios? " +
          "Esta operação registrará uma auditoria permanente, " +
          "sem reenviar a mensagem.",
      )
    ) {
      return;
    }

    setResolvingId(item.id);
    setError(null);

    try {
      const result = await resolveGoalfyNotificationReviewAction({
        notificationId: item.id,
        evidenceSource:
          item.channel === "email"
            ? "smtp_log"
            : "whatsapp_log",
        evidenceReference: reference,
        resolutionNote: note,
      });

      if (!result?.data || result.data.status !== "delivered") {
        throw new Error(
          result?.serverError ??
            "Não foi possível registrar a resolução.",
        );
      }

      setReviewingId(null);
      setEvidenceReference("");
      setResolutionNote("");
      setAttested(false);

      toast.add({
        type: "success",
        title: "Aceite registrado",
        description:
          "A resolução foi auditada. Nenhuma mensagem foi reenviada.",
      });

      onResolved?.();

      // Atualizar a consulta sem reenviar nada.
      try {
        const refreshed = await loadPage(batchId, 0);
        setItems(refreshed.items);
        setPage(0);
        setHasMore(refreshed.hasMore);
      } catch {
        setError(
          "Resolução registrada com sucesso, mas a lista não " +
            "foi atualizada. Reabra a análise para consultar.",
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Falha ao registrar a resolução administrativa.",
      );
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <section
      aria-label="Análise de notificações"
      className="space-y-3 rounded-md border p-3"
    >
      <p className="text-sm font-medium">
        Conferência administrativa
      </p>

      <p className="text-muted-foreground text-xs">
        Consulta somente de leitura. Os registros permanecem
        bloqueados contra reenvio automático. Confirme o
        resultado diretamente no serviço externo antes de
        qualquer decisão operacional.
      </p>

      {loading && (
        <p className="text-muted-foreground text-xs">
          Carregando registros...
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="text-muted-foreground text-xs">
          Nenhuma notificação inconclusiva encontrada.
        </p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="space-y-1 rounded-md border p-2 text-xs"
        >
          <p className="font-medium">
            {item.clientName} — {item.product}
          </p>

          <p>
            {item.enterpriseName} · {item.salespersonName}
          </p>

          <p>
            Canal:{" "}
            <strong>
              {item.channel === "whatsapp"
                ? "WhatsApp"
                : "E-mail"}
            </strong>
            {" · "}
            {item.status === "uncertain"
              ? "Resultado inconclusivo"
              : "Envio em processamento/sem confirmação final"}
          </p>

          <p>
            Tentativas registradas: {item.attemptCount}
          </p>

          <p className="break-all">
            Oportunidade: {item.opportunityId}
          </p>

          {item.lastErrorCode && (
            <p>
              Código: <code>{item.lastErrorCode}</code>
            </p>
          )}

          <p className="text-muted-foreground">
            Início:{" "}
            {item.claimedAt
              ? formatDate(item.claimedAt)
              : "Não registrado"}
            {" · "}
            Atualização: {formatDate(item.updatedAt)}
          </p>

          {item.status === "uncertain" && (
            <div className="space-y-2 border-t pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resolvingId !== null}
                onClick={() => openReview(item.id)}
              >
                {reviewingId === item.id
                  ? "Cancelar resolução"
                  : "Registrar aceite comprovado"}
              </Button>

              {reviewingId === item.id && (
                <div className="space-y-3 rounded-md border p-3">
                  <p className="font-medium">
                    Confirmação administrativa
                  </p>

                  <p className="text-muted-foreground">
                    Confira a mensagem diretamente no{" "}
                    {item.channel === "email"
                      ? "SMTP, inclusive todos os destinatários em cópia"
                      : "registro do webhook de WhatsApp"}
                    . Somente registre o aceite se houver
                    evidência suficiente.
                  </p>

                  <div className="space-y-1">
                    <label
                      className="block font-medium"
                      htmlFor={`evidence-${item.id}`}
                    >
                      Referência da evidência
                    </label>

                    <Input
                      id={`evidence-${item.id}`}
                      value={evidenceReference}
                      onChange={(event) =>
                        setEvidenceReference(event.target.value)
                      }
                      placeholder="ID da mensagem ou evento"
                      minLength={6}
                      maxLength={240}
                      disabled={resolvingId !== null}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className="block font-medium"
                      htmlFor={`note-${item.id}`}
                    >
                      Justificativa da confirmação
                    </label>

                    <Textarea
                      id={`note-${item.id}`}
                      value={resolutionNote}
                      onChange={(event) =>
                        setResolutionNote(event.target.value)
                      }
                      placeholder="Descreva como o aceite foi verificado..."
                      minLength={20}
                      maxLength={500}
                      disabled={resolvingId !== null}
                    />
                  </div>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={attested}
                      onChange={(event) =>
                        setAttested(event.target.checked)
                      }
                      disabled={resolvingId !== null}
                      className="mt-0.5"
                    />
                    <span>
                      Confirmo que consultei o serviço externo e
                      verifiquei o aceite para todos os
                      destinatários obrigatórios. Estou ciente
                      de que a decisão ficará registrada
                      permanentemente.
                    </span>
                  </label>

                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      resolvingId !== null ||
                      !attested ||
                      evidenceReference.trim().length < 6 ||
                      resolutionNote.trim().length < 20
                    }
                    onClick={() => {
                      void resolveNotification(item);
                    }}
                  >
                    {resolvingId === item.id
                      ? "Registrando..."
                      : "Confirmar aceite e registrar auditoria"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {item.status === "sending" && (
            <p className="text-muted-foreground">
              Este envio ainda não possui resultado final
              registrado. Nenhuma resolução automática
              está autorizada.
            </p>
          )}
        </div>
      ))}

      {hasMore && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loadingMore}
          onClick={() => {
            void loadMore();
          }}
        >
          {loadingMore ? "Carregando..." : "Carregar mais 25"}
        </Button>
      )}
    </section>
  );
};

export default GoalfyNotificationReview;
