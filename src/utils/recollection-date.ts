const SAO_PAULO_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const BUSINESS_DAYS_TO_ADD = 3;
const COLLECTION_TIME = "14:00:00";

export const calculateRecollectionDate = (baseDate: Date): string => {
  if (!(baseDate instanceof Date) || Number.isNaN(baseDate.getTime())) {
    throw new Error("Data-base do recolhimento inválida.");
  }

  const dateParts = SAO_PAULO_DATE_FORMATTER.formatToParts(baseDate);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => {
    const value = dateParts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Componente ${type} da data-base ausente.`);
    return Number(value);
  };

  const cursor = new Date(
    Date.UTC(getPart("year"), getPart("month") - 1, getPart("day")),
  );

  let businessDaysAdded = 0;
  while (businessDaysAdded < BUSINESS_DAYS_TO_ADD) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }

  return `${cursor.toISOString().slice(0, 10)}T${COLLECTION_TIME}`;
};
