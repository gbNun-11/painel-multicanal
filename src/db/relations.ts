import { defineRelations } from "drizzle-orm";

import {
  account,
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  opportunitiesTable,
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

  opportunitiesTable,

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

    opportunities: r.many.opportunitiesTable({
      from: r.users.id,
      to: r.opportunitiesTable.salespersonId,
    }),

    suseps: r.many.susepsTable({
      from: r.users.id,
      to: r.susepsTable.brokerUserId,
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

    opportunities: r.many.opportunitiesTable({
      from: r.enterpriseInsurersTable.id,
      to: r.opportunitiesTable.enterpriseInsurerId,
    }),
  },

  susepsTable: {
    enterpriseInsurer: r.one.enterpriseInsurersTable({
      from: r.susepsTable.enterpriseInsurerId,
      to: r.enterpriseInsurersTable.id,
    }),

    brokerUser: r.one.users({
      from: r.susepsTable.brokerUserId,
      to: r.users.id,
    }),

    opportunities: r.many.opportunitiesTable({
      from: r.susepsTable.id,
      to: r.opportunitiesTable.susepId,
    }),
  },

  clientsTable: {
    opportunities: r.many.opportunitiesTable({
      from: r.clientsTable.id,
      to: r.opportunitiesTable.clientId,
    }),
  },

  opportunitiesTable: {
    client: r.one.clientsTable({
      from: r.opportunitiesTable.clientId,
      to: r.clientsTable.id,
    }),

    enterpriseInsurer: r.one.enterpriseInsurersTable({
      from: r.opportunitiesTable.enterpriseInsurerId,
      to: r.enterpriseInsurersTable.id,
    }),

    susep: r.one.susepsTable({
      from: r.opportunitiesTable.susepId,
      to: r.susepsTable.id,
    }),

    salesperson: r.one.users({
      from: r.opportunitiesTable.salespersonId,
      to: r.users.id,
    }),
  },
}));
