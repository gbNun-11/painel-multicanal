import { defineRelations } from "drizzle-orm";

import {
  account,
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  session,
  susepsTable,
  usersTable,
  verification,
} from "./schema";

const relationalSchema = {
  users: usersTable,

  session,
  account,
  verification,

  clientsTable,
  enterprisesTable,
  insurersTable,
  enterpriseInsurersTable,
  susepsTable,
};

export const relations = defineRelations(relationalSchema, (r) => ({
  users: {
    sessions: r.many.session({
      from: r.users.id,
      to: r.session.userId,
    }),

    accounts: r.many.account({
      from: r.users.id,
      to: r.account.userId,
    }),

    clients: r.many.clientsTable({
      from: r.users.id,
      to: r.clientsTable.salespersonId,
    }),
  },

  session: {
    users: r.one.users({
      from: r.session.userId,
      to: r.users.id,
    }),
  },

  account: {
    users: r.one.users({
      from: r.account.userId,
      to: r.users.id,
    }),
  },

  enterprisesTable: {
    insurers: r.many.enterpriseInsurersTable({
      from: r.enterprisesTable.id,
      to: r.enterpriseInsurersTable.enterpriseId,
    }),
  },

  insurersTable: {
    enterprises: r.many.enterpriseInsurersTable({
      from: r.insurersTable.id,
      to: r.enterpriseInsurersTable.insurerId,
    }),
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

    suseps: r.many.susepsTable({
      from: r.enterpriseInsurersTable.id,
      to: r.susepsTable.enterpriseInsurerId,
    }),

    clients: r.many.clientsTable({
      from: r.enterpriseInsurersTable.id,
      to: r.clientsTable.enterpriseInsurerId,
    }),
  },

  susepsTable: {
    enterpriseInsurer: r.one.enterpriseInsurersTable({
      from: r.susepsTable.enterpriseInsurerId,
      to: r.enterpriseInsurersTable.id,
    }),

    clients: r.many.clientsTable({
      from: r.susepsTable.id,
      to: r.clientsTable.susepId,
    }),
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

    salesperson: r.one.users({
      from: r.clientsTable.salespersonId,
      to: r.users.id,
    }),
  },
}));
