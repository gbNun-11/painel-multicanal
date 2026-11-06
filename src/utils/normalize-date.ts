export type DateInput = string | Date | null | undefined;

export interface NormalizeDateOptions {
  ambiguousOrder?: "DMY" | "MDY";

  nullDates?: readonly string[];
}

const ISO_PATTERN = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})(.*)$/;

const LOCAL_PATTERN = /^(\d{1,2})([-/.])(\d{1,2})\2(\d{4})(.*)$/;

const TIME_SUFFIX =
  /^(?:[Tt ]\d{1,2}:\d{2}(?::\d{2}(?:[.,]\d{1,9})?)?(?:\s?(?:Z|[+-]\d{2}:?\d{2}))?)?$/;

const isValidDate = (year: number, month: number, day: number): boolean => {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12
  ) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
};

export const normalizeDate = (
  value: DateInput,
  options: NormalizeDateOptions = {},
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  let year: number;
  let month: number;
  let day: number;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Data inválida: objeto Date inválido.");
    }

    year = value.getUTCFullYear();
    month = value.getUTCMonth() + 1;
    day = value.getUTCDate();
  } else {
    const raw = value.trim();

    if (!raw || raw === "-") {
      return null;
    }

    const iso = ISO_PATTERN.exec(raw);
    const local = LOCAL_PATTERN.exec(raw);

    if (iso && TIME_SUFFIX.test(iso[5])) {
      year = Number(iso[1]);
      month = Number(iso[3]);
      day = Number(iso[4]);
    } else if (local && TIME_SUFFIX.test(local[5])) {
      year = Number(local[4]);

      const first = Number(local[1]);
      const second = Number(local[3]);

      // Reconhece MM/DD/YYYY quando DD/MM/YYYY
      // seria impossível, por exemplo 01/22/1978.
      // Em datas ambíguas usa DD/MM/YYYY por padrão.
      const monthFirst =
        second > 12 ||
        (first <= 12 && second <= 12 && options.ambiguousOrder === "MDY");

      day = monthFirst ? second : first;
      month = monthFirst ? first : second;
    } else if (/^\d{8}$/.test(raw)) {
      if (/^(?:19|20)\d{6}$/.test(raw)) {
        year = Number(raw.slice(0, 4));
        month = Number(raw.slice(4, 6));
        day = Number(raw.slice(6, 8));
      } else {
        day = Number(raw.slice(0, 2));
        month = Number(raw.slice(2, 4));
        year = Number(raw.slice(4, 8));
      }
    } else {
      throw new Error(`Formato de data não reconhecido: "${raw}".`);
    }
  }

  if (!isValidDate(year, month, day)) {
    throw new Error(
      `Data inválida: ${String(year).padStart(4, "0")}-` +
        `${String(month).padStart(2, "0")}-` +
        `${String(day).padStart(2, "0")}.`,
    );
  }

  const normalized =
    `${String(year).padStart(4, "0")}-` +
    `${String(month).padStart(2, "0")}-` +
    `${String(day).padStart(2, "0")}`;

  if (options.nullDates?.includes(normalized)) {
    return null;
  }

  return normalized;
};
