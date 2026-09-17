import "server-only";

import nodemailer from "nodemailer";

import { getSmtpConfig } from "./config";
import type { SmtpAccountKey } from "./types";

export const createEmailTransporter = (account: SmtpAccountKey) => {
  const config = getSmtpConfig(account);

  return nodemailer.createTransport({
    host: config.host,

    port: config.port,

    secure: config.secure,

    auth: config.auth,

    pool: false,

    connectionTimeout: 30_000,

    greetingTimeout: 30_000,

    socketTimeout: 30_000,
  });
};
