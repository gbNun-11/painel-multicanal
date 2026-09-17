import "server-only";

import ExcelJS from "exceljs";

import { formatPhone } from "@/src/utils/formatters";

import type {
  ImportErrorReportFailure,
  SendImportErrorReportInput,
} from "./import-error-report-types";

const stageLabels = {
  goalfy: "Goalfy",
  database: "Banco de dados",
  whatsapp: "WhatsApp",
  email: "E-mail",
} as const;

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",

    timeStyle: "medium",

    timeZone: "America/Sao_Paulo",
  }).format(value);
};

const formatClients = (failure: ImportErrorReportFailure) => {
  if (failure.clients.length === 0) {
    return "Não identificado";
  }

  return failure.clients
    .map((client) => {
      const phone = client.phone ? formatPhone(client.phone) : "Sem telefone";

      return `${client.name} - ${phone}`;
    })
    .join("\n");
};

const formatClientIds = (failure: ImportErrorReportFailure) => {
  if (failure.clients.length === 0) {
    return "";
  }

  return failure.clients.map((client) => client.id).join("\n");
};

export const createImportErrorExcelReport = async (
  input: SendImportErrorReportInput,
) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Painel Multicanal";

  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Erros", {
    views: [
      {
        state: "frozen",
        ySplit: 7,
      },
    ],
  });

  worksheet.mergeCells("A1:L1");

  const titleCell = worksheet.getCell("A1");

  titleCell.value = "RELATÓRIO DE ERROS DA IMPORTAÇÃO";

  titleCell.font = {
    bold: true,
    size: 18,

    color: {
      argb: "FFFFFFFF",
    },
  };

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",

    fgColor: {
      argb: "FF991B1B",
    },
  };

  titleCell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.getRow(1).height = 32;

  worksheet.getCell("A3").value = "Empresa";

  worksheet.getCell("B3").value = input.enterpriseName;

  worksheet.getCell("D3").value = "Executado por";

  worksheet.getCell("E3").value = input.sender.name;

  worksheet.getCell("A4").value = "Total de falhas";

  worksheet.getCell("B4").value = input.failures.length;

  worksheet.getCell("D4").value = "Gerado em";

  worksheet.getCell("E4").value = formatDate(new Date());

  const labels = ["A3", "D3", "A4", "D4"];

  for (const reference of labels) {
    worksheet.getCell(reference).font = {
      bold: true,

      color: {
        argb: "FF374151",
      },
    };
  }

  const headerRow = worksheet.getRow(7);

  headerRow.values = [
    "#",
    "Etapa",
    "Produto",
    "Vendedor",
    "Clientes afetados",
    "IDs dos clientes",
    "Tentativas",
    "HTTP",
    "Erro",
    "Detalhes",
    "Data / Hora",
    "Empresa",
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
      argb: "FF7F1D1D",
    },
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  headerRow.height = 24;

  input.failures.forEach((failure, index) => {
    const row = worksheet.addRow([
      index + 1,

      stageLabels[failure.stage],

      failure.product,

      failure.salespersonName,

      formatClients(failure),

      formatClientIds(failure),

      failure.attempts ?? "",

      failure.statusCode ?? "",

      failure.message,

      failure.details ?? "",

      formatDate(failure.occurredAt),

      input.enterpriseName,
    ]);

    row.alignment = {
      vertical: "top",

      wrapText: true,
    };

    if (index % 2 !== 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",

        fgColor: {
          argb: "FFFEF2F2",
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

  worksheet.getColumn(2).width = 20;

  worksheet.getColumn(3).width = 30;

  worksheet.getColumn(4).width = 28;

  worksheet.getColumn(5).width = 42;

  worksheet.getColumn(6).width = 40;

  worksheet.getColumn(7).width = 12;

  worksheet.getColumn(8).width = 10;

  worksheet.getColumn(9).width = 48;

  worksheet.getColumn(10).width = 60;

  worksheet.getColumn(11).width = 22;

  worksheet.getColumn(12).width = 32;

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

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
};
