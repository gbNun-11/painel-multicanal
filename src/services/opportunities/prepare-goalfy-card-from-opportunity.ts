import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import {
  clientsTable, enterpriseInsurersTable, enterprisesTable, insurersTable,
  opportunitiesTable, productCodesTable, usersTable,
} from "@/src/db/schema";
import type { GoalfyCreateCardData } from "@/src/integrations/goalfy/create-card";

// Única origem do payload tanto no primeiro envio como no reenvio manual.
export const prepareGoalfyCardForOpportunity = async (input: {
  opportunityId: string;
  salespersonId: string;
  distributionAt: Date;
}): Promise<GoalfyCreateCardData> => {
  const [card] = await db
    .select({
      id: opportunitiesTable.id,
      externalId: opportunitiesTable.externalId,
      opportunityNumber: opportunitiesTable.opportunityNumber,
      name: clientsTable.name,
      document: clientsTable.document,
      email: clientsTable.email,
      phone: clientsTable.phone,
      birthDate: clientsTable.birthDate,
      product: opportunitiesTable.product,
      productCodeId: opportunitiesTable.productCodeId,
      productSubcategory: productCodesTable.name,
      salesModel: opportunitiesTable.salesModel,
      sourceCreatedAt: opportunitiesTable.sourceCreatedAt,
      propensity: opportunitiesTable.propensity,
      model: opportunitiesTable.model,
      modelYear: opportunitiesTable.modelYear,
      licensePlate: opportunitiesTable.licensePlate,
      assetValue: opportunitiesTable.assetValue,
      zipCode: clientsTable.zipCode,
      address: clientsTable.address,
      addressNumber: clientsTable.addressNumber,
      addressComplement: clientsTable.addressComplement,
      state: clientsTable.state,
      city: clientsTable.city,
      neighborhood: clientsTable.neighborhood,
      observation: opportunitiesTable.observation,
      externalStatusReason: opportunitiesTable.externalStatusReason,
      insurerName: insurersTable.name,
      enterpriseName: enterprisesTable.name,
      goalfyResponsibleValue: usersTable.goalfyUserId,
    })
    .from(opportunitiesTable)
    .innerJoin(clientsTable, eq(opportunitiesTable.clientId, clientsTable.id))
    .innerJoin(enterpriseInsurersTable, eq(opportunitiesTable.enterpriseInsurerId, enterpriseInsurersTable.id))
    .innerJoin(insurersTable, eq(enterpriseInsurersTable.insurerId, insurersTable.id))
    .innerJoin(enterprisesTable, eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id))
    .innerJoin(usersTable, eq(opportunitiesTable.salespersonId, usersTable.id))
    .leftJoin(productCodesTable, eq(opportunitiesTable.productCodeId, productCodesTable.id))
    .where(and(
      eq(opportunitiesTable.id, input.opportunityId),
      eq(opportunitiesTable.salespersonId, input.salespersonId),
      eq(opportunitiesTable.distributionStatus, "distribuindo"),
    ))
    .limit(1);

  if (!card) throw new Error("Oportunidade não está reservada ao vendedor esperado.");
  if (!card.productCodeId || !card.productSubcategory?.trim()) {
    throw new Error("Variação de produto não encontrada.");
  }
  if (!card.goalfyResponsibleValue?.trim()) {
    throw new Error("Vendedor sem responsável Goalfy configurado.");
  }

  return {
    ...card,
    salesModel: card.salesModel ?? "LEAD",
    productSubcategory: card.productSubcategory,
    goalfyResponsibleValue: card.goalfyResponsibleValue.trim(),
    distributionAt: input.distributionAt,
  };
};
