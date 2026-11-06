import { defineRelations } from "drizzle-orm";

import {
  account,
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  multichannelAssignmentsTable,
  opportunitiesTable,
  productCodesTable,
  productsTable,
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

  productsTable,

  productCodesTable,

  multichannelAssignmentsTable,
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

    multichannelAssignments: r.many.multichannelAssignmentsTable({
      from: r.users.id,
      to: r.multichannelAssignmentsTable.userId,
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

    products: r.many.productsTable({
      from: r.insurersTable.id,
      to: r.productsTable.insurerId,
    }),

    productCodes: r.many.productCodesTable({
      from: r.insurersTable.id,
      to: r.productCodesTable.insurerId,
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

    master: r.one.susepsTable({
      from: r.susepsTable.masterSusepId,
      to: r.susepsTable.id,
      alias: "susep_master",
    }),

    children: r.many.susepsTable({
      from: r.susepsTable.id,
      to: r.susepsTable.masterSusepId,
      alias: "susep_master",
    }),

    multichannelAssignments: r.many.multichannelAssignmentsTable({
      from: r.susepsTable.id,
      to: r.multichannelAssignmentsTable.susepId,
    }),

    opportunities: r.many.opportunitiesTable({
      from: r.susepsTable.id,
      to: r.opportunitiesTable.susepId,
    }),
  },

  productsTable: {
    insurer: r.one.insurersTable({
      from: r.productsTable.insurerId,
      to: r.insurersTable.id,
    }),

    codes: r.many.productCodesTable({
      from: r.productsTable.id,
      to: r.productCodesTable.productId,
    }),

    multichannelAssignments: r.many.multichannelAssignmentsTable({
      from: r.productsTable.id,
      to: r.multichannelAssignmentsTable.productId,
    }),
  },

  productCodesTable: {
    insurer: r.one.insurersTable({
      from: r.productCodesTable.insurerId,
      to: r.insurersTable.id,
    }),

    product: r.one.productsTable({
      from: [r.productCodesTable.productId, r.productCodesTable.insurerId],
      to: [r.productsTable.id, r.productsTable.insurerId],
    }),
  },

  multichannelAssignmentsTable: {
    susep: r.one.susepsTable({
      from: r.multichannelAssignmentsTable.susepId,
      to: r.susepsTable.id,
    }),

    product: r.one.productsTable({
      from: r.multichannelAssignmentsTable.productId,
      to: r.productsTable.id,
    }),

    user: r.one.users({
      from: r.multichannelAssignmentsTable.userId,
      to: r.users.id,
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
