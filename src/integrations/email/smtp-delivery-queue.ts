import "server-only";

const INTERVAL_MS = 5_000;
const MAX_ATTEMPTS = 5;

let pending: Promise<void> = Promise.resolve();
let nextAllowedAt = 0;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

type SmtpConnectionError = Error & {
  code?: string;
  command?: string;
  syscall?: string;
};

const PRE_CONNECTION_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ETIMEDOUT",
  "ESOCKET",
  "ECONNECTION",
]);

const isRetryableConnectionError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const smtpError = error as SmtpConnectionError;
  const connectionPhase =
    smtpError.command === "CONN" || smtpError.syscall === "connect";
  return connectionPhase && PRE_CONNECTION_CODES.has(smtpError.code ?? "");
};

export class SmtpSendError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "SmtpSendError";
  }
}

export const runControlledSmtpSend = <T>(
  send: () => Promise<T>,
  label: string,
): Promise<{ result: T; attempts: number }> => {
  const execute = async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const waitMs = nextAllowedAt - Date.now();
      if (waitMs > 0) await sleep(waitMs);

      try {
        const result = await send();
        nextAllowedAt = Date.now() + INTERVAL_MS;
        return { result, attempts: attempt };
      } catch (error) {
        nextAllowedAt = Date.now() + INTERVAL_MS;
        const retryable = isRetryableConnectionError(error);
        const detail =
          error instanceof Error ? error.message : "erro desconhecido";

        if (!retryable || attempt === MAX_ATTEMPTS) {
          throw new SmtpSendError(
            `${label}: falha após ${attempt} tentativa(s): ${detail}`,
            attempt,
            retryable,
          );
        }

        console.warn(
          `[SMTP] ${label}: conexão recusada/indisponível; tentativa ${attempt}/${MAX_ATTEMPTS}.`,
        );
      }
    }

    throw new SmtpSendError(
      `${label}: limite de tentativas atingido.`,
      MAX_ATTEMPTS,
      true,
    );
  };

  const job = pending.then(execute, execute);
  pending = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
};
