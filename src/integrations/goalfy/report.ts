import "server-only";

import ExcelJS from "exceljs";

const INRI_ENTERPRISE_ID = "2bf1065a-36fd-49a1-9ac6-c68c40c6d22d";

const ICX_ENTERPRISE_ID = "edb3add7-39a0-4389-a298-ceb2febb0404";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REPORT_TIMEOUT_MS = 30_000;

const MAX_REPORT_SIZE = 15_000_000;

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

const safeErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Erro desconhecido.";

  return message
    .replace(/([?&]apiKey=)[^&\s"'`]+/gi, "$1[REDACTED]")
    .replace(/(Bearer\s+|Token\s+)[a-zA-Z0-9._-]+/gi, "$1[REDACTED]")
    .slice(0, 1_000);
};

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

  let parsed: URL;

  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error("URL do relatório Goalfy inválida.");
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "api.goalfy.com.br") {
    throw new Error("Endereço de relatório Goalfy inválido.");
  }

  return parsed.toString();
};

export const getGoalfyReportCards = async (
  enterpriseId: string,
): Promise<GoalfyReportCard[]> => {
  const url = reportUrlForEnterprise(enterpriseId);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",

      // Permite redirecionamentos HTTPS legítimos
      // utilizados na entrega do relatório.
      redirect: "follow",

      signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),

      // Sem Accept restritivo.
      // O Goalfy pode entregar o Excel com diferentes
      // Content-Types. Validamos o arquivo recebido abaixo.
    });
  } catch (error) {
    throw new Error(
      `Falha de rede ao baixar relatório Goalfy: ${safeErrorMessage(error)}`,
    );
  }

  // Não aceitar um destino final HTTP após redirecionamento.
  if (new URL(response.url).protocol !== "https:") {
    throw new Error(
      "O download do relatório Goalfy terminou em uma conexão não segura.",
    );
  }

  if (!response.ok) {
    throw new Error(`Relatório Goalfy indisponível (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "não informado";

  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > MAX_REPORT_SIZE) {
    throw new Error("Relatório Goalfy excede o tamanho máximo permitido.");
  }

  let arrayBuffer: ArrayBuffer;

  try {
    arrayBuffer = await response.arrayBuffer();
  } catch (error) {
    throw new Error(
      `Falha ao receber o arquivo XLSX do Goalfy: ${safeErrorMessage(error)}`,
    );
  }

  if (arrayBuffer.byteLength > MAX_REPORT_SIZE) {
    throw new Error("Relatório Goalfy excede o tamanho máximo permitido.");
  }

  if (arrayBuffer.byteLength === 0) {
    throw new Error("O Goalfy retornou um arquivo de relatório vazio.");
  }

  const buffer = Buffer.from(arrayBuffer);

  // Arquivos XLSX utilizam o formato ZIP.
  // Esta verificação identifica respostas HTML ou JSON
  // recebidas no lugar do arquivo Excel.
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error(
      `O Goalfy não retornou um XLSX válido. Content-Type: ${contentType}.`,
    );
  }

  const workbook = new ExcelJS.Workbook();

  const xlsxBuffer = buffer as unknown as Parameters<
    typeof workbook.xlsx.load
  >[0];

  try {
    await workbook.xlsx.load(xlsxBuffer);
  } catch (error) {
    throw new Error(
      `Falha ao interpretar o XLSX do Goalfy: ${safeErrorMessage(error)}`,
    );
  }

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

  const missingColumns: string[] = [];

  if (!opportunityColumn) {
    missingColumns.push("Identificador Oportunidade");
  }

  if (!externalColumn) {
    missingColumns.push("Identificador Externo");
  }

  if (!cardColumn) {
    missingColumns.push("Identificador");
  }

  if (!createdColumn) {
    missingColumns.push("Criado Em");
  }

  if (!sellerColumn) {
    missingColumns.push("Vendedor Responsável");
  }

  if (missingColumns.length > 0) {
    const availableHeaders = [...headers.keys()]
      .filter(Boolean)
      .slice(0, 30)
      .join(", ");

    throw new Error(
      `Relatório Goalfy sem colunas obrigatórias: ${missingColumns.join(", ")}. ` +
        `Colunas encontradas: ${availableHeaders || "nenhuma"}.`,
    );
  }

  const cards: GoalfyReportCard[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const opportunityId = row
      .getCell(opportunityColumn!)
      .text.trim()
      .toLowerCase();

    if (!UUID_PATTERN.test(opportunityId)) {
      return;
    }

    cards.push({
      opportunityId,

      externalId: row.getCell(externalColumn!).text.trim(),

      cardId: row.getCell(cardColumn!).text.trim(),

      createdAt: row.getCell(createdColumn!).text.trim(),

      salespersonName: row.getCell(sellerColumn!).text.trim(),
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
