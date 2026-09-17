import "server-only";

import { ENTERPRISE_IDS } from "@/src/constants/enterprises";

import type { SmtpAccountKey } from "./types";

const SMTP_HOST = process.env.SMTP_HOST?.trim();

const SMTP_PORT = Number(process.env.SMTP_PORT);

const SMTP_INRI_USER = process.env.SMTP_INRI_USER?.trim();

const SMTP_ICX_USER = process.env.SMTP_ICX_USER?.trim();

const SMTP_GOALFY_PASSWORD = process.env.SMTP_GOALFY_PASSWORD;

const getRequiredValue = (value: string | undefined, variableName: string) => {
  if (!value) {
    throw new Error(`Variável de ambiente ${variableName} não configurada.`);
  }

  return value;
};

export const getSmtpAccountByEnterpriseId = (
  enterpriseId: string,
): SmtpAccountKey => {
  if (enterpriseId === ENTERPRISE_IDS.INRI) {
    return "INRI";
  }

  if (enterpriseId === ENTERPRISE_IDS.ICX) {
    return "ICX";
  }

  throw new Error(`Empresa ${enterpriseId} não possui conta SMTP configurada.`);
};

export const getSmtpConfig = (account: SmtpAccountKey) => {
  const host = getRequiredValue(SMTP_HOST, "SMTP_HOST");

  if (!Number.isInteger(SMTP_PORT) || SMTP_PORT <= 0) {
    throw new Error("Variável de ambiente SMTP_PORT inválida.");
  }

  const password = getRequiredValue(
    SMTP_GOALFY_PASSWORD,
    "SMTP_GOALFY_PASSWORD",
  );

  const user =
    account === "INRI"
      ? getRequiredValue(SMTP_INRI_USER, "SMTP_INRI_USER")
      : getRequiredValue(SMTP_ICX_USER, "SMTP_ICX_USER");

  return {
    host,

    port: SMTP_PORT,

    secure: SMTP_PORT === 465,

    auth: {
      user,
      pass: password,
    },
  };
};
