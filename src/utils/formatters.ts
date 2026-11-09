import { normalizeCnpj, normalizeCpf } from "@/src/utils/documents";

export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

export const formatCpf = (value: string) => {
  const digits = normalizeCpf(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

export const formatCnpj = (value: string) => {
  const normalized = normalizeCnpj(value).slice(0, 14);

  const base = normalized.slice(0, 12);

  const checkDigits = normalized.slice(12).replace(/\D/g, "").slice(0, 2);

  const document = `${base}${checkDigits}`;

  return document
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, ".$1/$2")
    .replace(/([A-Z0-9]{4})(\d)/, "$1-$2");
};

export const formatDocument = (value: string) => {
  const normalized = normalizeCnpj(value);

  const isCnpj = normalized.length > 11 || /[A-Z]/.test(normalized);

  if (isCnpj) {
    return formatCnpj(normalized);
  }

  return formatCpf(normalized);
};

export const formatPersonName = (name?: string | null): string => {
  if (!name?.trim()) {
    return "";
  }

  const lowercaseWords = new Set(["da", "de", "di", "do", "das", "dos", "e"]);

  return name
    .trim()
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && lowercaseWords.has(word)) {
        return word;
      }

      return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1);
    })
    .join(" ");
};
