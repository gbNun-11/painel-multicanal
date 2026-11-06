import "server-only";

import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authorizePortoOperator } from "@/src/services/porto/authorize-porto-operator";
import { isAuthorizedPortoJsonPost } from "@/src/services/porto/check-porto-json-origin";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 250_000;
const MAX_ROWS = 500;

const statusSchema = z.enum([
  "IMPORTADO",
  "JÁ EXISTENTE",
  "IGNORADO",
  "CONFLITO",
  "INVÁLIDO",
  "ERRO",
  "NÃO IMPORTADO",
  "NÃO CONFIRMADO",
]);

const reportSchema = z
  .object({
    portoCpf: z.string().trim().min(1).max(20),
    portoSusepCode: z.string().trim().min(1).max(20),
    rows: z
      .array(
        z
          .object({
            name: z.string().max(300),
            document: z.string().max(60),
            status: statusSchema,
          })
          .strict(),
      )
      .min(1)
      .max(MAX_ROWS),
  })
  .strict();

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

// Nome/CPF vêm de uma API externa; neutralizar entradas de fórmula e controles.
const asSafeExcelText = (input: string) => {
  const value = input
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 280);
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
};

const statusBackground: Record<z.infer<typeof statusSchema>, string> = {
  IMPORTADO: "D7F5E3",
  "JÁ EXISTENTE": "E2E8F0",
  IGNORADO: "F1F5F9",
  CONFLITO: "FCE7BF",
  INVÁLIDO: "FCE7BF",
  ERRO: "FEE2E2",
  "NÃO IMPORTADO": "F1F5F9",
  "NÃO CONFIRMADO": "FEE2E2",
};

export async function POST(request: NextRequest) {
  if (!isAuthorizedPortoJsonPost(request)) {
    return json(
      { error: "Origem não autorizada ou Content-Type inválido." },
      403,
    );
  }

  const operator = await authorizePortoOperator(request);
  if (!operator.authorized) {
    return json(
      { error: "Relatório reservado ao administrativo autenticado." },
      operator.status,
    );
  }

  const advertisedLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(advertisedLength) && advertisedLength > MAX_BODY_BYTES) {
    return json({ error: "Relatório excede o limite permitido." }, 413);
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
      return json({ error: "Relatório excede o limite permitido." }, 413);
    }
    body = JSON.parse(text);
  } catch {
    return json({ error: "JSON do relatório inválido." }, 400);
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "Relatório inválido. Revise as linhas e os status." },
      422,
    );
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "INRI Painel Multicanal V2";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Porto - Importação", {
      views: [{ state: "frozen", ySplit: 1 }],
      properties: { tabColor: { argb: "FF087E6B" } },
    });

    sheet.columns = [
      { header: "NOME", key: "name", width: 42 },
      {
        header: "CPF / CNPJ",
        key: "document",
        width: 23,
        style: { numFmt: "@" },
      },
      { header: "STATUS", key: "status", width: 23 },
    ];

    const header = sheet.getRow(1);
    header.height = 26;
    header.font = {
      name: "Aptos",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    header.alignment = { vertical: "middle", horizontal: "left" };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF075D4A" },
    };
    header.eachCell((cell) => {
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF02B587" } },
      };
    });

    for (const [index, source] of parsed.data.rows.entries()) {
      const row = sheet.addRow({
        name: asSafeExcelText(source.name),
        document: asSafeExcelText(source.document),
        status: source.status,
      });
      row.height = 20;
      row.font = { name: "Aptos", size: 10, color: { argb: "FF20262F" } };
      row.alignment = { vertical: "middle" };
      row.getCell(2).numFmt = "@";
      row.getCell(3).font = { name: "Aptos", size: 10, bold: true };
      row.getCell(3).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${statusBackground[source.status]}` },
      };
      if (index % 2 === 1) {
        for (const cell of [row.getCell(1), row.getCell(2)]) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF6F9F8" },
          };
        }
      }
    }

    sheet.autoFilter = { from: "A1", to: `C${parsed.data.rows.length + 1}` };
    sheet.pageSetup = {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      orientation: "landscape",
    };

    const bytes = await workbook.xlsx.writeBuffer();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/T/, "_")
      .slice(0, 15);
    return json({
      filename: `INRI_Porto_DEV_Importacao_${timestamp}.xlsx`,
      base64: Buffer.from(bytes).toString("base64"),
      count: parsed.data.rows.length,
    });
  } catch (error) {
    console.error("[PORTO REPORT DEV] Falha na geração do Excel:", error);
    return json({ error: "Não foi possível gerar o Excel no V2 DEV." }, 500);
  }
}
