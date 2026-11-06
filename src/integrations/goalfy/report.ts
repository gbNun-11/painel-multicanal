import "server-only";

import ExcelJS from "exceljs";

const INRI_ENTERPRISE_ID = "2bf1065a-36fd-49a1-9ac6-c68c40c6d22d";

const ICX_ENTERPRISE_ID = "edb3add7-39a0-4389-a298-ceb2febb0404";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GoalfyReportCard {
  opportunityId: string;
  externalId: string;
  cardId: string;
  createdAt: string;
  salespersonName: string;
}

export type GoalfyReportMatch =
  | { status: "absent" }
  | { status: "unique"; card: GoalfyReportCard }
  | { status: "duplicate"; cards: GoalfyReportCard[] }
  | { status: "inconsistent"; details: string };

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const reportUrlForEnterprise = (enterpriseId: string) => {
  let raw: string | undefined;

  if (enterpriseId === INRI_ENTERPRISE_ID) {
    raw = process.env.GOALFY_INRI_REPORT_URL;
  } else if (enterpriseId === ICX_ENTERPRISE_ID) {
    raw = process.env.GOALFY_ICX_REPORT_URL;
  } else {
    throw new Error("Empresa sem relatório Goalfy configurado.");
  }

  if (!raw?.trim()) {
    throw new Error("Relatório Goalfy não configurado para esta empresa.");
  }

  const parsed = new URL(raw);

  if (parsed.protocol !== "https:" || parsed.hostname !== "api.goalfy.com.br") {
    throw new Error("Endereço de relatório Goalfy inválido.");
  }

  return parsed.toString();
};

export const getGoalfyReportCards = async (enterpriseId: string) => {
  const url = reportUrlForEnterprise(enterpriseId);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!response.ok) {
    throw new Error(`Relatório Goalfy indisponível (HTTP ${response.status}).`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > 15_000_000) {
    throw new Error("Relatório Goalfy excede o tamanho máximo permitido.");
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > 15_000_000) {
    throw new Error("Relatório Goalfy excede o tamanho máximo permitido.");
  }

  const workbook = new ExcelJS.Workbook();

  const xlsxBuffer = Buffer.from(arrayBuffer) as unknown as Parameters<
    typeof workbook.xlsx.load
  >[0];

  await workbook.xlsx.load(xlsxBuffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Relatório Goalfy sem planilha.");
  }

  const headers = new Map<string, number>();

  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headers.set(normalizeHeader(cell.text), columnNumber);
  });

  const opportunityColumn = headers.get("identificador oportunidade");

  const externalColumn = headers.get("identificador externo");

  const cardColumn = headers.get("identificador");

  const createdColumn = headers.get("criado em");

  const sellerColumn = headers.get("vendedor responsavel");

  if (
    !opportunityColumn ||
    !externalColumn ||
    !cardColumn ||
    !createdColumn ||
    !sellerColumn
  ) {
    throw new Error("Relatório Goalfy sem as cinco colunas de reconciliação.");
  }

  const cards: GoalfyReportCard[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const opportunityId = row
      .getCell(opportunityColumn)
      .text.trim()
      .toLowerCase();

    if (!UUID_PATTERN.test(opportunityId)) {
      return;
    }

    cards.push({
      opportunityId,

      externalId: row.getCell(externalColumn).text.trim(),

      cardId: row.getCell(cardColumn).text.trim(),

      createdAt: row.getCell(createdColumn).text.trim(),

      salespersonName: row.getCell(sellerColumn).text.trim(),
    });
  });

  return cards;
};

export const matchGoalfyReportCard = (
  cards: GoalfyReportCard[],
  opportunityId: string,
  externalId: string,
): GoalfyReportMatch => {
  const matches = cards.filter(
    (card) => card.opportunityId === opportunityId.toLowerCase(),
  );

  if (matches.length === 0) {
    return { status: "absent" };
  }

  if (matches.length > 1) {
    return {
      status: "duplicate",
      cards: matches,
    };
  }

  const card = matches[0];

  if (!card || !UUID_PATTERN.test(card.cardId)) {
    return {
      status: "inconsistent",
      details: "ID do card Goalfy inválido.",
    };
  }

  if (!card.externalId || card.externalId !== externalId) {
    return {
      status: "inconsistent",
      details: "ID externo do relatório diverge da oportunidade no V2.",
    };
  }

  return {
    status: "unique",
    card,
  };
};

export const matchesReportSalesperson = (
  reportName: string,
  userName: string,
) => {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .toUpperCase()
      .trim();

  return (
    Boolean(reportName && userName) &&
    normalize(reportName) === normalize(userName)
  );
};
