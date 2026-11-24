import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { INSURER_IDS } from "@/src/constants/insurers";
import { getAvailableClientsForExport } from "@/src/data/clients/get-clients";
import { createDistributionExcelReport } from "@/src/integrations/email/create-distribution-excel-report";
import { authorizePortoOperator } from "@/src/services/porto/authorize-porto-operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonError = (error: string, status: number) =>
  NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function GET(request: NextRequest) {
  const operator = await authorizePortoOperator(request);
  if (!operator.authorized) {
    return jsonError("Exportação reservada ao administrativo autenticado.", operator.status);
  }

  if (request.nextUrl.search.length > 8_192) {
    return jsonError("Há filtros demais na solicitação.", 400);
  }

  const query = request.nextUrl.searchParams;

  try {
    // Utiliza o MESMO WHERE da tabela de Clientes Porto; não recebe IDs
    // ou linhas informados pelo navegador e não depende da paginação.
    const rows = await getAvailableClientsForExport({
      insurerId: INSURER_IDS.PORTO,
      search: query.get("q") ?? undefined,
      arrivalDateFrom: query.get("from") ?? undefined,
      arrivalDateTo: query.get("to") ?? undefined,
      products: query.getAll("product"),
      salesModels: query.getAll("salesModel"),
      enterpriseIds: query.getAll("enterpriseId"),
    });

    if (rows.length === 0) {
      return jsonError("Não há oportunidades disponíveis para os filtros aplicados.", 404);
    }

    const companies = [...new Set(rows.map((row) => row.enterpriseName))];
    const enterpriseName = companies.length === 1
      ? companies[0]
      : "Ambas as empresas";

    const excel = await createDistributionExcelReport({
      mode: "available",
      enterpriseName,
      clients: rows.map((row) => ({
        ...row,
        // Em exportação pré-distribuição não existe vendedor nem entrega.
        assignedAt: null,
      })),
    });

    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()).replaceAll("/", "-");

    return new NextResponse(Uint8Array.from(excel), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="clientes-porto-filtrados-${date}.xlsx"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "too_many_export_rows") {
      return jsonError(
        "A seleção ultrapassa 10.000 oportunidades. Refine os filtros antes de exportar.",
        413,
      );
    }

    console.error("[CLIENTS EXPORT] Falha ao exportar oportunidades Porto:", error);
    return jsonError("Não foi possível gerar o Excel das oportunidades.", 500);
  }
}
