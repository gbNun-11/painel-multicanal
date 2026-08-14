import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  enterprisesTable: {
    insurers: r.many.enterpriseInsurersTable(),
  },

  insurersTable: {
    enterprises: r.many.enterpriseInsurersTable(),
  },

  enterpriseInsurersTable: {
    enterprise: r.one.enterprisesTable({
      from: r.enterpriseInsurersTable.enterpriseId,
      to: r.enterprisesTable.id,
    }),

    insurer: r.one.insurersTable({
      from: r.enterpriseInsurersTable.insurerId,
      to: r.insurersTable.id,
    }),

    suseps: r.many.susepsTable(),

    clients: r.many.clientsTable(),
  },

  susepsTable: {
    enterpriseInsurer: r.one.enterpriseInsurersTable({
      from: r.susepsTable.enterpriseInsurerId,
      to: r.enterpriseInsurersTable.id,
    }),

    clients: r.many.clientsTable(),
  },

  usersTable: {
    clients: r.many.clientsTable(),
  },

  clientsTable: {
    enterpriseInsurer: r.one.enterpriseInsurersTable({
      from: r.clientsTable.enterpriseInsurerId,
      to: r.enterpriseInsurersTable.id,
    }),

    susep: r.one.susepsTable({
      from: r.clientsTable.susepId,
      to: r.susepsTable.id,
    }),

    salesperson: r.one.usersTable({
      from: r.clientsTable.salespersonId,
      to: r.usersTable.id,
    }),
  },
}));
