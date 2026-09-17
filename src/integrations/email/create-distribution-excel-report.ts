import "server-only";

import ExcelJS from "exceljs";

import { formatPhone } from "@/src/utils/formatters";

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

  worksheet.mergeCells("A1:J1");

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
    "#",
    "Cliente",
    "Documento",
    "Telefone",
    "E-mail",
    "Produto",
    "Modelo de venda",
    "Propensão",
    "Entrada",
    "Distribuído em",
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
      index + 1,

      client.name,

      client.document ?? "",

      client.phone ? formatPhone(client.phone) : "",

      client.email ?? "",

      client.product ?? "",

      formatSalesModel(client.salesModel),

      client.propensity ?? "",

      formatDate(client.sourceCreatedAt),

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

  worksheet.getColumn(1).width = 6;

  worksheet.getColumn(2).width = 36;

  worksheet.getColumn(3).width = 20;

  worksheet.getColumn(4).width = 20;

  worksheet.getColumn(5).width = 34;

  worksheet.getColumn(6).width = 30;

  worksheet.getColumn(7).width = 20;

  worksheet.getColumn(8).width = 22;

  worksheet.getColumn(9).width = 20;

  worksheet.getColumn(10).width = 20;

  worksheet.getColumn(3).numFmt = "@";

  worksheet.getColumn(4).numFmt = "@";

  worksheet.autoFilter = {
    from: {
      row: 7,
      column: 1,
    },

    to: {
      row: 7,
      column: 10,
    },
  };

  const lastRow = worksheet.rowCount;

  for (let rowIndex = 7; rowIndex <= lastRow; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= 10; columnIndex += 1) {
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
          columnIndex === 10
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
