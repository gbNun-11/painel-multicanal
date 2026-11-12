import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const getSecret = () => {
  const secret =
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Configure BETTER_AUTH_SECRET ou AUTH_SECRET " +
        "com pelo menos 32 caracteres para proteger a " +
        "conclusão dos lotes Goalfy.",
    );
  }

  return secret;
};

export const assertGoalfyBatchCompletionSecret = () => {
  void getSecret();
};

export const createGoalfyBatchCompletionToken = (
  batchId: string,
  userId: string,
) =>
  createHmac("sha256", getSecret())
    .update(`goalfy-batch-completion:v1:${batchId}:${userId}`)
    .digest("hex");

export const verifyGoalfyBatchCompletionToken = (
  batchId: string,
  userId: string,
  token: string,
) => {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return false;
  }

  const expected = Buffer.from(
    createGoalfyBatchCompletionToken(batchId, userId),
    "hex",
  );
  const received = Buffer.from(token, "hex");

  return timingSafeEqual(expected, received);
};
