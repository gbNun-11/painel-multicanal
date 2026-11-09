import { defineRelations } from "drizzle-orm";

import {
  account,
  assetBikesTable,
  assetEquipmentTable,
  assetPetsTable,
  assetPropertiesTable,
  assetVehiclesTable,
  clientAssetsTable,
  clientRelatedPeopleTable,
  clientsTable,
  commissionAdjustmentsTable,
  commissionInstallmentEventsTable,
  commissionInstallmentsTable,
  commissionReceiptAllocationsTable,
  commissionReceiptsTable,
  commissionRulesTable,
  commissionRuleVersionsTable,
  commissionSchedulesTable,
  documentFilesTable,
  documentLinksTable,
  enterpriseInsurersTable,
  enterprisesTable,
  insuranceQuotesTable,
  insurersTable,
  integrationEventsTable,
  leaseContractsTable,
  leaseParticipantsTable,
  multichannelAssignmentsTable,
  operationHistoryTable,
  opportunitiesTable,
  policiesTable,
  policyCoveragesTable,
  policyEndorsementItemsTable,
  policyEndorsementsTable,
  productCodesTable,
  productsTable,
  proposalAssetsTable,
  proposalCoveragesTable,
  proposalParticipantsTable,
  proposalProductDetailsTable,
  proposalsTable,
  proposalStatusHistoryTable,
  quoteMembersTable,
  quotePlansTable,
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
  clientAssetsTable,
  assetVehiclesTable,
  assetBikesTable,
  assetEquipmentTable,
  assetPropertiesTable,
  assetPetsTable,
  clientRelatedPeopleTable,
  insuranceQuotesTable,
  quotePlansTable,
  quoteMembersTable,
  proposalsTable,
  proposalStatusHistoryTable,
  proposalAssetsTable,
  proposalParticipantsTable,
  proposalCoveragesTable,
  proposalProductDetailsTable,
  leaseContractsTable,
  leaseParticipantsTable,
  policiesTable,
  policyCoveragesTable,
  policyEndorsementsTable,
  policyEndorsementItemsTable,
  commissionRulesTable,
  commissionRuleVersionsTable,
  commissionSchedulesTable,
  commissionInstallmentsTable,
  commissionInstallmentEventsTable,
  commissionAdjustmentsTable,
  commissionReceiptsTable,
  commissionReceiptAllocationsTable,
  documentFilesTable,
  documentLinksTable,
  operationHistoryTable,
  integrationEventsTable,
};

export const relations = defineRelations(relationalSchema, (r) => ({
  users: {
    recordedProposals: r.many.proposalsTable({
      from: r.users.id,
      to: r.proposalsTable.recordedByUserId,
    }),
    uploadedFiles: r.many.documentFilesTable({
      from: r.users.id,
      to: r.documentFilesTable.uploadedByUserId,
    }),
    policyEndorsements: r.many.policyEndorsementsTable({
      from: r.users.id,
      to: r.policyEndorsementsTable.createdByUserId,
    }),
    commissionReceipts: r.many.commissionReceiptsTable({
      from: r.users.id,
      to: r.commissionReceiptsTable.recordedByUserId,
    }),
    operationHistory: r.many.operationHistoryTable({
      from: r.users.id,
      to: r.operationHistoryTable.actorUserId,
    }),
    proposalStatusChanges: r.many.proposalStatusHistoryTable({
      from: r.users.id,
      to: r.proposalStatusHistoryTable.changedByUserId,
    }),
    sessions: r.many.session({ from: r.users.id, to: r.session.userId }),
    accounts: r.many.account({ from: r.users.id, to: r.account.userId }),
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
    users: r.one.users({ from: r.session.userId, to: r.users.id }),
  },

  account: {
    users: r.one.users({ from: r.account.userId, to: r.users.id }),
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
    commissionRules: r.many.commissionRulesTable({
      from: r.enterpriseInsurersTable.id,
      to: r.commissionRulesTable.enterpriseInsurerId,
    }),
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
    commissionRules: r.many.commissionRulesTable({
      from: r.productsTable.id,
      to: r.commissionRulesTable.productId,
    }),
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
    assets: r.many.clientAssetsTable({
      from: r.clientsTable.id,
      to: r.clientAssetsTable.clientId,
    }),
    relatedPeople: r.many.clientRelatedPeopleTable({
      from: r.clientsTable.id,
      to: r.clientRelatedPeopleTable.clientId,
      alias: "client_related_owner",
    }),
    referencedByRelatedPeople: r.many.clientRelatedPeopleTable({
      from: r.clientsTable.id,
      to: r.clientRelatedPeopleTable.relatedClientId,
      alias: "client_related_reference",
    }),
    files: r.many.documentLinksTable({
      from: r.clientsTable.id,
      to: r.documentLinksTable.clientId,
    }),
    opportunities: r.many.opportunitiesTable({
      from: r.clientsTable.id,
      to: r.opportunitiesTable.clientId,
    }),
  },

  opportunitiesTable: {
    quotes: r.many.insuranceQuotesTable({
      from: r.opportunitiesTable.id,
      to: r.insuranceQuotesTable.opportunityId,
    }),
    proposals: r.many.proposalsTable({
      from: r.opportunitiesTable.id,
      to: r.proposalsTable.opportunityId,
    }),
    files: r.many.documentLinksTable({
      from: r.opportunitiesTable.id,
      to: r.documentLinksTable.opportunityId,
    }),
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

  clientAssetsTable: {
    client: r.one.clientsTable({
      from: r.clientAssetsTable.clientId,
      to: r.clientsTable.id,
    }),
    vehicles: r.one.assetVehiclesTable({
      from: r.clientAssetsTable.id,
      to: r.assetVehiclesTable.assetId,
    }),
    bikes: r.one.assetBikesTable({
      from: r.clientAssetsTable.id,
      to: r.assetBikesTable.assetId,
    }),
    equipment: r.one.assetEquipmentTable({
      from: r.clientAssetsTable.id,
      to: r.assetEquipmentTable.assetId,
    }),
    properties: r.one.assetPropertiesTable({
      from: r.clientAssetsTable.id,
      to: r.assetPropertiesTable.assetId,
    }),
    pets: r.one.assetPetsTable({
      from: r.clientAssetsTable.id,
      to: r.assetPetsTable.assetId,
    }),
    proposalAssets: r.many.proposalAssetsTable({
      from: r.clientAssetsTable.id,
      to: r.proposalAssetsTable.assetId,
    }),
    leaseContracts: r.many.leaseContractsTable({
      from: r.clientAssetsTable.id,
      to: r.leaseContractsTable.propertyAssetId,
    }),
  },

  assetVehiclesTable: {
    asset: r.one.clientAssetsTable({
      from: r.assetVehiclesTable.assetId,
      to: r.clientAssetsTable.id,
    }),
  },

  assetBikesTable: {
    asset: r.one.clientAssetsTable({
      from: r.assetBikesTable.assetId,
      to: r.clientAssetsTable.id,
    }),
  },

  assetEquipmentTable: {
    asset: r.one.clientAssetsTable({
      from: r.assetEquipmentTable.assetId,
      to: r.clientAssetsTable.id,
    }),
  },

  assetPropertiesTable: {
    asset: r.one.clientAssetsTable({
      from: r.assetPropertiesTable.assetId,
      to: r.clientAssetsTable.id,
    }),
  },

  assetPetsTable: {
    asset: r.one.clientAssetsTable({
      from: r.assetPetsTable.assetId,
      to: r.clientAssetsTable.id,
    }),
  },

  clientRelatedPeopleTable: {
    client: r.one.clientsTable({
      from: r.clientRelatedPeopleTable.clientId,
      to: r.clientsTable.id,
      alias: "client_related_owner",
    }),
    relatedClient: r.one.clientsTable({
      from: r.clientRelatedPeopleTable.relatedClientId,
      to: r.clientsTable.id,
      alias: "client_related_reference",
    }),
    proposals: r.many.proposalParticipantsTable({
      from: r.clientRelatedPeopleTable.id,
      to: r.proposalParticipantsTable.relatedPersonId,
    }),
  },

  insuranceQuotesTable: {
    opportunity: r.one.opportunitiesTable({
      from: r.insuranceQuotesTable.opportunityId,
      to: r.opportunitiesTable.id,
    }),
    plans: r.many.quotePlansTable({
      from: r.insuranceQuotesTable.id,
      to: r.quotePlansTable.quoteId,
    }),
    members: r.many.quoteMembersTable({
      from: r.insuranceQuotesTable.id,
      to: r.quoteMembersTable.quoteId,
    }),
    proposals: r.many.proposalsTable({
      from: r.insuranceQuotesTable.id,
      to: r.proposalsTable.quoteId,
    }),
    files: r.many.documentLinksTable({
      from: r.insuranceQuotesTable.id,
      to: r.documentLinksTable.quoteId,
    }),
  },

  quotePlansTable: {
    quote: r.one.insuranceQuotesTable({
      from: r.quotePlansTable.quoteId,
      to: r.insuranceQuotesTable.id,
    }),
    members: r.many.quoteMembersTable({
      from: [r.quotePlansTable.quoteId, r.quotePlansTable.id],
      to: [r.quoteMembersTable.quoteId, r.quoteMembersTable.quotePlanId],
    }),
  },

  quoteMembersTable: {
    quote: r.one.insuranceQuotesTable({
      from: r.quoteMembersTable.quoteId,
      to: r.insuranceQuotesTable.id,
    }),
    plan: r.one.quotePlansTable({
      from: [r.quoteMembersTable.quoteId, r.quoteMembersTable.quotePlanId],
      to: [r.quotePlansTable.quoteId, r.quotePlansTable.id],
    }),
  },

  proposalsTable: {
    recordedBy: r.one.users({
      from: r.proposalsTable.recordedByUserId,
      to: r.users.id,
    }),
    opportunity: r.one.opportunitiesTable({
      from: r.proposalsTable.opportunityId,
      to: r.opportunitiesTable.id,
    }),
    quote: r.one.insuranceQuotesTable({
      from: r.proposalsTable.quoteId,
      to: r.insuranceQuotesTable.id,
    }),
    statusHistory: r.many.proposalStatusHistoryTable({
      from: r.proposalsTable.id,
      to: r.proposalStatusHistoryTable.proposalId,
    }),
    assets: r.many.proposalAssetsTable({
      from: r.proposalsTable.id,
      to: r.proposalAssetsTable.proposalId,
    }),
    participants: r.many.proposalParticipantsTable({
      from: r.proposalsTable.id,
      to: r.proposalParticipantsTable.proposalId,
    }),
    coverages: r.many.proposalCoveragesTable({
      from: r.proposalsTable.id,
      to: r.proposalCoveragesTable.proposalId,
    }),
    details: r.one.proposalProductDetailsTable({
      from: r.proposalsTable.id,
      to: r.proposalProductDetailsTable.proposalId,
    }),
    lease: r.one.leaseContractsTable({
      from: r.proposalsTable.id,
      to: r.leaseContractsTable.proposalId,
    }),
    policy: r.one.policiesTable({
      from: r.proposalsTable.id,
      to: r.policiesTable.proposalId,
    }),
    files: r.many.documentLinksTable({
      from: r.proposalsTable.id,
      to: r.documentLinksTable.proposalId,
    }),
  },

  proposalStatusHistoryTable: {
    changedBy: r.one.users({
      from: r.proposalStatusHistoryTable.changedByUserId,
      to: r.users.id,
    }),
    proposal: r.one.proposalsTable({
      from: r.proposalStatusHistoryTable.proposalId,
      to: r.proposalsTable.id,
    }),
  },

  proposalAssetsTable: {
    proposal: r.one.proposalsTable({
      from: r.proposalAssetsTable.proposalId,
      to: r.proposalsTable.id,
    }),
    asset: r.one.clientAssetsTable({
      from: r.proposalAssetsTable.assetId,
      to: r.clientAssetsTable.id,
    }),
  },

  proposalParticipantsTable: {
    proposal: r.one.proposalsTable({
      from: r.proposalParticipantsTable.proposalId,
      to: r.proposalsTable.id,
    }),
    relatedPerson: r.one.clientRelatedPeopleTable({
      from: r.proposalParticipantsTable.relatedPersonId,
      to: r.clientRelatedPeopleTable.id,
    }),
  },

  proposalCoveragesTable: {
    proposal: r.one.proposalsTable({
      from: r.proposalCoveragesTable.proposalId,
      to: r.proposalsTable.id,
    }),
  },

  proposalProductDetailsTable: {
    proposal: r.one.proposalsTable({
      from: r.proposalProductDetailsTable.proposalId,
      to: r.proposalsTable.id,
    }),
  },

  leaseContractsTable: {
    proposal: r.one.proposalsTable({
      from: r.leaseContractsTable.proposalId,
      to: r.proposalsTable.id,
    }),
    participants: r.many.leaseParticipantsTable({
      from: r.leaseContractsTable.id,
      to: r.leaseParticipantsTable.leaseContractId,
    }),
    property: r.one.clientAssetsTable({
      from: r.leaseContractsTable.propertyAssetId,
      to: r.clientAssetsTable.id,
    }),
  },

  leaseParticipantsTable: {
    contract: r.one.leaseContractsTable({
      from: r.leaseParticipantsTable.leaseContractId,
      to: r.leaseContractsTable.id,
    }),
  },

  policiesTable: {
    proposal: r.one.proposalsTable({
      from: r.policiesTable.proposalId,
      to: r.proposalsTable.id,
    }),
    coverages: r.many.policyCoveragesTable({
      from: r.policiesTable.id,
      to: r.policyCoveragesTable.policyId,
    }),
    endorsements: r.many.policyEndorsementsTable({
      from: r.policiesTable.id,
      to: r.policyEndorsementsTable.policyId,
    }),
    schedules: r.many.commissionSchedulesTable({
      from: r.policiesTable.id,
      to: r.commissionSchedulesTable.policyId,
    }),
    adjustments: r.many.commissionAdjustmentsTable({
      from: r.policiesTable.id,
      to: r.commissionAdjustmentsTable.policyId,
    }),
    receipts: r.many.commissionReceiptsTable({
      from: r.policiesTable.id,
      to: r.commissionReceiptsTable.policyId,
    }),
    files: r.many.documentLinksTable({
      from: r.policiesTable.id,
      to: r.documentLinksTable.policyId,
    }),
  },

  policyCoveragesTable: {
    policy: r.one.policiesTable({
      from: r.policyCoveragesTable.policyId,
      to: r.policiesTable.id,
    }),
  },

  policyEndorsementsTable: {
    createdBy: r.one.users({
      from: r.policyEndorsementsTable.createdByUserId,
      to: r.users.id,
    }),
    policy: r.one.policiesTable({
      from: r.policyEndorsementsTable.policyId,
      to: r.policiesTable.id,
    }),
    items: r.many.policyEndorsementItemsTable({
      from: r.policyEndorsementsTable.id,
      to: r.policyEndorsementItemsTable.endorsementId,
    }),
    schedules: r.many.commissionSchedulesTable({
      from: [r.policyEndorsementsTable.policyId, r.policyEndorsementsTable.id],
      to: [
        r.commissionSchedulesTable.policyId,
        r.commissionSchedulesTable.endorsementId,
      ],
    }),
    adjustments: r.many.commissionAdjustmentsTable({
      from: [r.policyEndorsementsTable.policyId, r.policyEndorsementsTable.id],
      to: [
        r.commissionAdjustmentsTable.policyId,
        r.commissionAdjustmentsTable.endorsementId,
      ],
    }),
    files: r.many.documentLinksTable({
      from: r.policyEndorsementsTable.id,
      to: r.documentLinksTable.endorsementId,
    }),
  },

  policyEndorsementItemsTable: {
    endorsement: r.one.policyEndorsementsTable({
      from: r.policyEndorsementItemsTable.endorsementId,
      to: r.policyEndorsementsTable.id,
    }),
  },

  commissionRulesTable: {
    enterpriseInsurer: r.one.enterpriseInsurersTable({
      from: r.commissionRulesTable.enterpriseInsurerId,
      to: r.enterpriseInsurersTable.id,
    }),
    product: r.one.productsTable({
      from: r.commissionRulesTable.productId,
      to: r.productsTable.id,
    }),
    versions: r.many.commissionRuleVersionsTable({
      from: r.commissionRulesTable.id,
      to: r.commissionRuleVersionsTable.ruleId,
    }),
  },

  commissionRuleVersionsTable: {
    rule: r.one.commissionRulesTable({
      from: r.commissionRuleVersionsTable.ruleId,
      to: r.commissionRulesTable.id,
    }),
    schedules: r.many.commissionSchedulesTable({
      from: r.commissionRuleVersionsTable.id,
      to: r.commissionSchedulesTable.ruleVersionId,
    }),
  },

  commissionSchedulesTable: {
    policy: r.one.policiesTable({
      from: r.commissionSchedulesTable.policyId,
      to: r.policiesTable.id,
    }),
    endorsement: r.one.policyEndorsementsTable({
      from: [
        r.commissionSchedulesTable.policyId,
        r.commissionSchedulesTable.endorsementId,
      ],
      to: [r.policyEndorsementsTable.policyId, r.policyEndorsementsTable.id],
    }),
    ruleVersion: r.one.commissionRuleVersionsTable({
      from: r.commissionSchedulesTable.ruleVersionId,
      to: r.commissionRuleVersionsTable.id,
    }),
    installments: r.many.commissionInstallmentsTable({
      from: [
        r.commissionSchedulesTable.policyId,
        r.commissionSchedulesTable.id,
      ],
      to: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.scheduleId,
      ],
    }),
  },

  commissionInstallmentsTable: {
    schedule: r.one.commissionSchedulesTable({
      from: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.scheduleId,
      ],
      to: [r.commissionSchedulesTable.policyId, r.commissionSchedulesTable.id],
    }),
    events: r.many.commissionInstallmentEventsTable({
      from: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.id,
      ],
      to: [
        r.commissionInstallmentEventsTable.policyId,
        r.commissionInstallmentEventsTable.installmentId,
      ],
    }),
    allocations: r.many.commissionReceiptAllocationsTable({
      from: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.id,
      ],
      to: [
        r.commissionReceiptAllocationsTable.policyId,
        r.commissionReceiptAllocationsTable.installmentId,
      ],
    }),
    adjustments: r.many.commissionAdjustmentsTable({
      from: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.id,
      ],
      to: [
        r.commissionAdjustmentsTable.policyId,
        r.commissionAdjustmentsTable.installmentId,
      ],
    }),
  },

  commissionInstallmentEventsTable: {
    installment: r.one.commissionInstallmentsTable({
      from: [
        r.commissionInstallmentEventsTable.policyId,
        r.commissionInstallmentEventsTable.installmentId,
      ],
      to: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.id,
      ],
    }),
    endorsement: r.one.policyEndorsementsTable({
      from: [
        r.commissionInstallmentEventsTable.policyId,
        r.commissionInstallmentEventsTable.endorsementId,
      ],
      to: [r.policyEndorsementsTable.policyId, r.policyEndorsementsTable.id],
    }),
  },

  commissionAdjustmentsTable: {
    policy: r.one.policiesTable({
      from: r.commissionAdjustmentsTable.policyId,
      to: r.policiesTable.id,
    }),
    endorsement: r.one.policyEndorsementsTable({
      from: [
        r.commissionAdjustmentsTable.policyId,
        r.commissionAdjustmentsTable.endorsementId,
      ],
      to: [r.policyEndorsementsTable.policyId, r.policyEndorsementsTable.id],
    }),
    installment: r.one.commissionInstallmentsTable({
      from: [
        r.commissionAdjustmentsTable.policyId,
        r.commissionAdjustmentsTable.installmentId,
      ],
      to: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.id,
      ],
    }),
    allocations: r.many.commissionReceiptAllocationsTable({
      from: [
        r.commissionAdjustmentsTable.policyId,
        r.commissionAdjustmentsTable.id,
      ],
      to: [
        r.commissionReceiptAllocationsTable.policyId,
        r.commissionReceiptAllocationsTable.adjustmentId,
      ],
    }),
  },

  commissionReceiptsTable: {
    recordedBy: r.one.users({
      from: r.commissionReceiptsTable.recordedByUserId,
      to: r.users.id,
    }),
    policy: r.one.policiesTable({
      from: r.commissionReceiptsTable.policyId,
      to: r.policiesTable.id,
    }),
    allocations: r.many.commissionReceiptAllocationsTable({
      from: [r.commissionReceiptsTable.policyId, r.commissionReceiptsTable.id],
      to: [
        r.commissionReceiptAllocationsTable.policyId,
        r.commissionReceiptAllocationsTable.receiptId,
      ],
    }),
  },

  commissionReceiptAllocationsTable: {
    receipt: r.one.commissionReceiptsTable({
      from: [
        r.commissionReceiptAllocationsTable.policyId,
        r.commissionReceiptAllocationsTable.receiptId,
      ],
      to: [r.commissionReceiptsTable.policyId, r.commissionReceiptsTable.id],
    }),
    installment: r.one.commissionInstallmentsTable({
      from: [
        r.commissionReceiptAllocationsTable.policyId,
        r.commissionReceiptAllocationsTable.installmentId,
      ],
      to: [
        r.commissionInstallmentsTable.policyId,
        r.commissionInstallmentsTable.id,
      ],
    }),
    adjustment: r.one.commissionAdjustmentsTable({
      from: [
        r.commissionReceiptAllocationsTable.policyId,
        r.commissionReceiptAllocationsTable.adjustmentId,
      ],
      to: [
        r.commissionAdjustmentsTable.policyId,
        r.commissionAdjustmentsTable.id,
      ],
    }),
  },

  documentFilesTable: {
    uploadedBy: r.one.users({
      from: r.documentFilesTable.uploadedByUserId,
      to: r.users.id,
    }),
    links: r.many.documentLinksTable({
      from: r.documentFilesTable.id,
      to: r.documentLinksTable.fileId,
    }),
  },

  documentLinksTable: {
    file: r.one.documentFilesTable({
      from: r.documentLinksTable.fileId,
      to: r.documentFilesTable.id,
    }),
    client: r.one.clientsTable({
      from: r.documentLinksTable.clientId,
      to: r.clientsTable.id,
    }),
    opportunity: r.one.opportunitiesTable({
      from: r.documentLinksTable.opportunityId,
      to: r.opportunitiesTable.id,
    }),
    quote: r.one.insuranceQuotesTable({
      from: r.documentLinksTable.quoteId,
      to: r.insuranceQuotesTable.id,
    }),
    proposal: r.one.proposalsTable({
      from: r.documentLinksTable.proposalId,
      to: r.proposalsTable.id,
    }),
    policy: r.one.policiesTable({
      from: r.documentLinksTable.policyId,
      to: r.policiesTable.id,
    }),
    endorsement: r.one.policyEndorsementsTable({
      from: r.documentLinksTable.endorsementId,
      to: r.policyEndorsementsTable.id,
    }),
  },

  operationHistoryTable: {
    actor: r.one.users({
      from: r.operationHistoryTable.actorUserId,
      to: r.users.id,
    }),
  },

  integrationEventsTable: {},
}));
