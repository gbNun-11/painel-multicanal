import "server-only";

import { getGoalfyWhatsAppWebhookUrl } from "./config";
import { goalfyFetch } from "./goalfy-fetch";
import type { GoalfyWhatsAppPayload } from "./types";

const normalizeBrazilianWhatsAppPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Telefone do usuário comercial não informado.");
  }

  if (
    digits.startsWith("55") &&
    (digits.length === 12 || digits.length === 13)
  ) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  throw new Error(
    "Telefone do usuário comercial possui formato inválido para WhatsApp.",
  );
};

export const sendGoalfyWhatsAppList = async (
  payload: GoalfyWhatsAppPayload,
) => {
  const telefone = normalizeBrazilianWhatsAppPhone(payload.telefone);

  const empresa = payload.empresa.trim();

  const clientes = payload.clientes.trim();

  if (!empresa) {
    throw new Error("Empresa não informada para envio da lista.");
  }

  if (!clientes) {
    throw new Error("Nenhum cliente informado para envio da lista.");
  }

  return goalfyFetch({
    url: getGoalfyWhatsAppWebhookUrl(),

    operation: `Enviar lista de WhatsApp para ${telefone}`,

    init: {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        telefone,
        empresa,
        clientes,
      }),
    },
  });
};
