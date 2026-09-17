"use server";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  usersTable,
} from "@/src/db/schema";
import { getSmtpAccountByEnterpriseId } from "@/src/integrations/email/config";
import type { ImportErrorReportFailure } from "@/src/integrations/email/import-error-report-types";
import { sendImportErrorReport } from "@/src/integrations/email/send-import-error-report";
import { protectedActionClient } from "@/src/lib/safe-action";
import sendGoalfyImportErrorReportSchema from "@/src/schemas/client/sendGoalfyImportErrorReportSchema";

export const sendGoalfyImportErrorReportAction = protectedActionClient
  .inputSchema(sendGoalfyImportErrorReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { failures } = parsedInput;

    const [sender] = await db
      .select({
        id: usersTable.id,

        name: usersTable.name,

        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, ctx.user.id))
      .limit(1);

    if (!sender) {
      throw new Error("Usuário responsável pela importação não encontrado.");
    }

    const enterpriseInsurerIds = Array.from(
      new Set(failures.map((failure) => failure.enterpriseInsurerId)),
    );

    const salespersonIds = Array.from(
      new Set(failures.map((failure) => failure.salespersonId)),
    );

    const clientIds = Array.from(
      new Set(failures.flatMap((failure) => failure.clientIds)),
    );

    const [enterprises, salespersons, clients] = await Promise.all([
      db
        .select({
          enterpriseInsurerId: enterpriseInsurersTable.id,

          enterpriseId: enterprisesTable.id,

          enterpriseName: enterprisesTable.name,
        })
        .from(enterpriseInsurersTable)
        .innerJoin(
          enterprisesTable,
          eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id),
        )
        .where(inArray(enterpriseInsurersTable.id, enterpriseInsurerIds)),

      db
        .select({
          id: usersTable.id,

          name: usersTable.name,
        })
        .from(usersTable)
        .where(inArray(usersTable.id, salespersonIds)),

      clientIds.length > 0
        ? db
            .select({
              id: clientsTable.id,

              name: clientsTable.name,

              phone: clientsTable.phone,
            })
            .from(clientsTable)
            .where(inArray(clientsTable.id, clientIds))
        : Promise.resolve([]),
    ]);

    const enterpriseMap = new Map(
      enterprises.map((enterprise) => [
        enterprise.enterpriseInsurerId,
        enterprise,
      ]),
    );

    const salespersonMap = new Map(
      salespersons.map((salesperson) => [salesperson.id, salesperson.name]),
    );

    const clientMap = new Map(clients.map((client) => [client.id, client]));

    const grouped = new Map<string, typeof failures>();

    for (const failure of failures) {
      const current = grouped.get(failure.enterpriseInsurerId) ?? [];

      current.push(failure);

      grouped.set(failure.enterpriseInsurerId, current);
    }

    const reports = [];

    for (const [enterpriseInsurerId, enterpriseFailures] of grouped) {
      const enterprise = enterpriseMap.get(enterpriseInsurerId);

      if (!enterprise) {
        throw new Error(
          `Empresa da distribuição ${enterpriseInsurerId} não encontrada.`,
        );
      }

      const resolvedFailures: ImportErrorReportFailure[] =
        enterpriseFailures.map((failure) => ({
          stage: failure.stage,

          product: failure.product,

          salespersonName:
            salespersonMap.get(failure.salespersonId) ?? failure.salespersonId,

          clients: failure.clientIds
            .map((clientId) => clientMap.get(clientId))
            .filter((client): client is NonNullable<typeof client> =>
              Boolean(client),
            ),

          message: failure.message,

          details: failure.details,

          attempts: failure.attempts,

          statusCode: failure.statusCode,

          occurredAt: new Date(failure.occurredAt),
        }));

      const smtpAccount = getSmtpAccountByEnterpriseId(enterprise.enterpriseId);

      const result = await sendImportErrorReport({
        smtpAccount,

        enterpriseName: enterprise.enterpriseName,

        sender: {
          name: sender.name,

          email: sender.email,
        },

        failures: resolvedFailures,
      });

      reports.push({
        enterpriseInsurerId,

        enterpriseName: enterprise.enterpriseName,

        failures: resolvedFailures.length,

        filename: result.filename,

        recipients: result.recipients,
      });
    }

    return {
      success: true,

      reports,
    };
  });
