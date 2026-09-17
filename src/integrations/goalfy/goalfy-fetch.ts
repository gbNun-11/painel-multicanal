import "server-only";

import {
  GOALFY_MAX_ATTEMPTS,
  GOALFY_REQUEST_TIMEOUT_MS,
  GOALFY_RETRY_DELAY_MS,
} from "./config";

interface GoalfyFetchParams {
  url: string;
  init: RequestInit;
  operation: string;
}

export class GoalfyHttpError extends Error {
  status: number;
  responseBody: unknown;
  attempt: number;

  constructor(
    message: string,
    status: number,
    responseBody: unknown,
    attempt: number,
  ) {
    super(message);

    this.name = "GoalfyHttpError";

    this.status = status;

    this.responseBody = responseBody;

    this.attempt = attempt;
  }
}

export class GoalfyRequestError extends Error {
  attempts: number;
  status: number | null;
  responseBody: unknown;

  constructor(
    message: string,
    attempts: number,
    status: number | null,
    responseBody: unknown,
  ) {
    super(message);

    this.name = "GoalfyRequestError";

    this.attempts = attempts;

    this.status = status;

    this.responseBody = responseBody;
  }
}

export interface GoalfyErrorDetails {
  message: string;
  attempts: number | null;
  status: number | null;
  details: string | null;
}

const sleep = async (milliseconds: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

const isRetryableStatus = (status: number) => {
  return status === 408 || status === 429 || status >= 500;
};

const parseResponseBody = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const stringifyDetails = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const getGoalfyErrorDetails = (error: unknown): GoalfyErrorDetails => {
  if (error instanceof GoalfyRequestError) {
    return {
      message: error.message,

      attempts: error.attempts,

      status: error.status,

      details: stringifyDetails(error.responseBody),
    };
  }

  if (error instanceof GoalfyHttpError) {
    return {
      message: error.message,

      attempts: error.attempt,

      status: error.status,

      details: stringifyDetails(error.responseBody),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,

      attempts: null,

      status: null,

      details: null,
    };
  }

  return {
    message: "Erro desconhecido.",

    attempts: null,

    status: null,

    details: null,
  };
};

export const goalfyFetch = async ({
  url,
  init,
  operation,
}: GoalfyFetchParams) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= GOALFY_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,

        cache: "no-store",

        signal: AbortSignal.timeout(GOALFY_REQUEST_TIMEOUT_MS),
      });

      const responseBody = await parseResponseBody(response);

      if (response.ok) {
        return {
          status: response.status,

          body: responseBody,

          attempt,
        };
      }

      const error = new GoalfyHttpError(
        `${operation} falhou com HTTP ${response.status}.`,
        response.status,
        responseBody,
        attempt,
      );

      if (!isRetryableStatus(response.status)) {
        throw new GoalfyRequestError(
          error.message,
          attempt,
          response.status,
          responseBody,
        );
      }

      lastError = error;
    } catch (error) {
      if (error instanceof GoalfyRequestError) {
        throw error;
      }

      lastError = error;
    }

    if (attempt < GOALFY_MAX_ATTEMPTS) {
      await sleep(GOALFY_RETRY_DELAY_MS);
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Erro desconhecido.";

  const status = lastError instanceof GoalfyHttpError ? lastError.status : null;

  const responseBody =
    lastError instanceof GoalfyHttpError ? lastError.responseBody : null;

  throw new GoalfyRequestError(
    `${operation} falhou após ${GOALFY_MAX_ATTEMPTS} tentativas. Último erro: ${message}`,
    GOALFY_MAX_ATTEMPTS,
    status,
    responseBody,
  );
};
