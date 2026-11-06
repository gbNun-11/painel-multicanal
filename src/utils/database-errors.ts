export const getDatabaseErrorCode = (error: unknown) => {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const databaseError = error as {
    code?: unknown;

    cause?: unknown;
  };

  if (typeof databaseError.code === "string") {
    return databaseError.code;
  }

  if (typeof databaseError.cause === "object" && databaseError.cause !== null) {
    const cause = databaseError.cause as {
      code?: unknown;
    };

    if (typeof cause.code === "string") {
      return cause.code;
    }
  }

  return null;
};

export const isDatabaseErrorCode = (error: unknown, code: string) => {
  return getDatabaseErrorCode(error) === code;
};
