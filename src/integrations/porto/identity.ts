const normalizeExternalId = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
};

export const getPortoOpportunityExternalId = (value: unknown) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const opportunity = value as {
    idOportunidadeSql?: unknown;

    idOportunidadeDynamics?: unknown;
  };

  return (
    normalizeExternalId(opportunity.idOportunidadeSql) ??
    normalizeExternalId(opportunity.idOportunidadeDynamics)
  );
};
