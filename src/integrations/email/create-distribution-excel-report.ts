import "server-only";

import ExcelJS from "exceljs";

import { formatPhone } from "@/src/utils/formatters";
import { calculateRecollectionDate } from "@/src/utils/recollection-date";

import type { SendDistributionEmailInput } from "./types";

const formatDate = (value: Date | null) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",

    timeStyle: "short",

    timeZone: "America/Sao_Paulo",
  }).format(value);
};

// A mesma data de recolhimento enviada na criação do card Goalfy:
// três dias úteis após a entrega, às 14h no fuso de São Paulo.
const formatRecollectionDate = (assignedAt: Date | null) => {
  if (!assignedAt) return "";

  const date = calculateRecollectionDate(assignedAt);
  const [day, time] = date.split("T");
  const [year, month, dayOfMonth] = day.split("-");
  return `${dayOfMonth}/${month}/${year} ${time.slice(0, 5)}`;
};

const formatSalesModel = (
  value: "LEAD" | "VINCULO" | "CONTINGENCIA" | null,
) => {
  if (!value) {
    return "";
  }

  const labels = {
    LEAD: "Lead",
    VINCULO: "Vínculo",
    CONTINGENCIA: "Contingência",
  };

  return labels[value];
};

export const createDistributionExcelReport = async (
  input: SendDistributionEmailInput,
) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Painel Multicanal";

  workbook.created = new Date();

  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Clientes", {
    views: [
      {
        state: "frozen",
        ySplit: 7,
      },
    ],
  });

  worksheet.mergeCells("A1:L1");

  const titleCell = worksheet.getCell("A1");

  titleCell.value = "RELATÓRIO DE CLIENTES DISTRIBUÍDOS";

  titleCell.font = {
    bold: true,
    size: 18,
    color: {
      argb: "FFFFFFFF",
    },
  };

  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF111827",
    },
  };

  worksheet.getRow(1).height = 32;

  worksheet.getCell("A3").value = "Empresa";

  worksheet.getCell("B3").value = input.enterpriseName;

  worksheet.getCell("D3").value = "Usuário comercial";

  worksheet.getCell("E3").value = input.recipient.name;

  worksheet.getCell("A4").value = "Distribuído por";

  worksheet.getCell("B4").value = input.sender.name;

  worksheet.getCell("D4").value = "Total de clientes";

  worksheet.getCell("E4").value = input.clients.length;

  worksheet.getCell("A5").value = "Gerado em";

  worksheet.getCell("B5").value = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const labelCells = ["A3", "D3", "A4", "D4", "A5"];

  for (const reference of labelCells) {
    const cell = worksheet.getCell(reference);

    cell.font = {
      bold: true,
      color: {
        argb: "FF374151",
      },
    };
  }

  const headerRow = worksheet.getRow(7);

  headerRow.values = [
    "Nº de Lead",
    "NOME",
    "TELEFONE",
    "CPF OU CNPJ",
    "E-MAIL",
    "CHEGADA DO LEAD",
    "DATA RECOLHE",
    "RESPONSAVEL",
    "PRODUTO",
    "EMPRESA",
    "MODALIDADE",
    "DATA ENTREGA",
  ];

  headerRow.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
  };

  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF1F2937",
    },
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  headerRow.height = 24;

  input.clients.forEach((client, index) => {
    const row = worksheet.addRow([
      client.opportunityNumber ?? "",

      client.name,

      client.phone ? formatPhone(client.phone) : "",

      client.document ?? "",

      client.email ?? "",

      formatDate(client.sourceCreatedAt),

      formatRecollectionDate(client.assignedAt),

      input.recipient.name,

      client.product ?? "",

      input.enterpriseName,

      formatSalesModel(client.salesModel),

      formatDate(client.assignedAt),
    ]);

    row.alignment = {
      vertical: "middle",
    };

    row.height = 22;

    if (index % 2 !== 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FFF9FAFB",
        },
      };
    }

    row.eachCell((cell) => {
      cell.border = {
        bottom: {
          style: "hair",
          color: {
            argb: "FFE5E7EB",
          },
        },
      };
    });
  });

  const columnWidths = [16, 36, 20, 22, 34, 23, 22, 30, 30, 36, 18, 23];

  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  // Impede que Excel converta CPF/CNPJ e telefone em números
  // (inclusive perdendo zeros à esquerda).
  worksheet.getColumn(3).numFmt = "@";
  worksheet.getColumn(4).numFmt = "@";

  worksheet.autoFilter = {
    from: {
      row: 7,
      column: 1,
    },

    to: {
      row: 7,
      column: 12,
    },
  };

  const lastRow = worksheet.rowCount;

  for (let rowIndex = 7; rowIndex <= lastRow; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= 12; columnIndex += 1) {
      const cell = worksheet.getCell(rowIndex, columnIndex);

      cell.border = {
        ...cell.border,

        left:
          columnIndex === 1
            ? {
                style: "thin",
                color: {
                  argb: "FFD1D5DB",
                },
              }
            : cell.border?.left,

        right:
          columnIndex === 12
            ? {
                style: "thin",
                color: {
                  argb: "FFD1D5DB",
                },
              }
            : cell.border?.right,

        top:
          rowIndex === 7
            ? {
                style: "thin",
                color: {
                  argb: "FFD1D5DB",
                },
              }
            : cell.border?.top,

        bottom:
          rowIndex === lastRow
            ? {
                style: "thin",
                color: {
                  argb: "FFD1D5DB",
                },
              }
            : cell.border?.bottom,
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
};
