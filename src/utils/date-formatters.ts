const TIME_ZONE = "America/Sao_Paulo";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

export const formatDate = (date: Date | null): string =>
  date ? dateFormatter.format(new Date(date)) : "-";

export const formatDateTime = (date: Date | null): string =>
  date ? dateTimeFormatter.format(date) : "Não informado";
