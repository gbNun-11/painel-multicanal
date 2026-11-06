export type DocumentPersonType = "PF" | "PJ";

export interface ResolvedDocument {
  document: string;
  personType: DocumentPersonType;
}

const removeDocumentFormatting = (value: string) => {
  return value
    .trim()
    .toUpperCase()
    .replace(/[.\-\/\s]/g, "");
};

const calculateCpfDigit = (digits: number[], factor: number) => {
  let total = 0;

  for (const digit of digits) {
    total += digit * factor;
    factor -= 1;
  }

  const remainder = (total * 10) % 11;

  return remainder === 10 ? 0 : remainder;
};

const getCnpjCharacterValue = (character: string) => {
  return character.charCodeAt(0) - 48;
};

const calculateCnpjDigit = (characters: string[], weights: number[]) => {
  const total = characters.reduce((sum, character, index) => {
    return sum + getCnpjCharacterValue(character) * weights[index];
  }, 0);

  const remainder = total % 11;

  return remainder < 2 ? 0 : 11 - remainder;
};

export const normalizeCpf = (value: string) => {
  return value.replace(/\D/g, "");
};

export const normalizeCnpj = (value: string) => {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
};

export const isValidCpf = (value: string) => {
  const document = removeDocumentFormatting(value);

  if (!/^\d{11}$/.test(document)) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(document)) {
    return false;
  }

  const digits = document.slice(0, 9).split("").map(Number);

  const firstDigit = calculateCpfDigit(digits, 10);

  const secondDigit = calculateCpfDigit([...digits, firstDigit], 11);

  return document === `${digits.join("")}${firstDigit}${secondDigit}`;
};

export const isValidCnpj = (value: string) => {
  const document = removeDocumentFormatting(value);

  if (!/^[A-Z0-9]{12}\d{2}$/.test(document)) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(document)) {
    return false;
  }

  const base = document.slice(0, 12);

  const firstDigit = calculateCnpjDigit(
    base.split(""),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  const secondDigit = calculateCnpjDigit(
    `${base}${firstDigit}`.split(""),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return document === `${base}${firstDigit}${secondDigit}`;
};

export const resolveDocument = (value: string): ResolvedDocument | null => {
  const document = removeDocumentFormatting(value);

  if (/^\d{11}$/.test(document)) {
    if (!isValidCpf(document)) {
      return null;
    }

    return {
      document,
      personType: "PF",
    };
  }

  if (/^[A-Z0-9]{12}\d{2}$/.test(document)) {
    if (!isValidCnpj(document)) {
      return null;
    }

    return {
      document,
      personType: "PJ",
    };
  }

  return null;
};
