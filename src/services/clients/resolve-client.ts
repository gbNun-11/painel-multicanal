import { and, eq, isNull, or, type SQL,sql } from "drizzle-orm";

import { db } from "@/src/db";
import { clientsTable } from "@/src/db/schema";
import { resolveDocument } from "@/src/utils/documents";
import { normalizeDate } from "@/src/utils/normalize-date";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ResolveClientInput {
  name: string;
  document: string;

  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;

  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface ResolveClientResult {
  client: typeof clientsTable.$inferSelect;
  created: boolean;
}

const normalizeRequiredText = (value: string, fieldName: string) => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} não informado.`);
  }

  return normalized;
};

const normalizeOptionalText = (value: string | null | undefined) => {
  const normalized = value?.trim();

  return normalized || null;
};

const normalizePhone = (value: string | null | undefined) => {
  const normalized = value?.replace(/\D/g, "");

  return normalized || null;
};

const normalizeEmail = (value: string | null | undefined) => {
  const normalized = value?.trim().toLowerCase();

  return normalized || null;
};

const normalizeZipCode = (value: string | null | undefined) => {
  const normalized = value?.replace(/\D/g, "");

  return normalized || null;
};

const normalizeState = (value: string | null | undefined) => {
  const normalized = value?.trim().toUpperCase();

  return normalized || null;
};

export const resolveClient = async (
  input: ResolveClientInput,
  transaction?: DbTransaction,
): Promise<ResolveClientResult> => {
  const resolvedDocument = resolveDocument(input.document);

  if (!resolvedDocument) {
    throw new Error("CPF ou CNPJ inválido.");
  }

  const name = normalizeRequiredText(input.name, "Nome do cliente");

  const clientData = {
    phone: normalizePhone(input.phone),
    email: normalizeEmail(input.email),
    birthDate: normalizeDate(input.birthDate, {
      nullDates: ["1900-01-01"],
    }),
    address: normalizeOptionalText(input.address),
    addressNumber: normalizeOptionalText(input.addressNumber),
    addressComplement: normalizeOptionalText(input.addressComplement),
    neighborhood: normalizeOptionalText(input.neighborhood),
    city: normalizeOptionalText(input.city),
    state: normalizeState(input.state),
    zipCode: normalizeZipCode(input.zipCode),
  };

  const resolveInTransaction = async (
    tx: DbTransaction,
  ): Promise<ResolveClientResult> => {
    const [createdClient] = await tx
      .insert(clientsTable)
      .values({
        name,
        document: resolvedDocument.document,
        personType: resolvedDocument.personType,
        ...clientData,
      })
      .onConflictDoNothing({
        target: clientsTable.document,
      })
      .returning();

    if (createdClient) {
      return {
        client: createdClient,
        created: true,
      };
    }

    const fillableConditions: SQL[] = [];

    if (clientData.phone !== null) {
      fillableConditions.push(isNull(clientsTable.phone));
    }

    if (clientData.email !== null) {
      fillableConditions.push(isNull(clientsTable.email));
    }

    if (clientData.birthDate !== null) {
      fillableConditions.push(isNull(clientsTable.birthDate));
    }

    if (clientData.address !== null) {
      fillableConditions.push(isNull(clientsTable.address));
    }

    if (clientData.addressNumber !== null) {
      fillableConditions.push(isNull(clientsTable.addressNumber));
    }

    if (clientData.addressComplement !== null) {
      fillableConditions.push(isNull(clientsTable.addressComplement));
    }

    if (clientData.neighborhood !== null) {
      fillableConditions.push(isNull(clientsTable.neighborhood));
    }

    if (clientData.city !== null) {
      fillableConditions.push(isNull(clientsTable.city));
    }

    if (clientData.state !== null) {
      fillableConditions.push(isNull(clientsTable.state));
    }

    if (clientData.zipCode !== null) {
      fillableConditions.push(isNull(clientsTable.zipCode));
    }

    if (fillableConditions.length > 0) {
      const [updatedClient] = await tx
        .update(clientsTable)
        .set({
          phone: sql`COALESCE(${clientsTable.phone}, ${clientData.phone})`,
          email: sql`COALESCE(${clientsTable.email}, ${clientData.email})`,
          birthDate: sql`COALESCE(${clientsTable.birthDate}, ${clientData.birthDate})`,
          address: sql`COALESCE(${clientsTable.address}, ${clientData.address})`,
          addressNumber: sql`COALESCE(${clientsTable.addressNumber}, ${clientData.addressNumber})`,
          addressComplement: sql`COALESCE(${clientsTable.addressComplement}, ${clientData.addressComplement})`,
          neighborhood: sql`COALESCE(${clientsTable.neighborhood}, ${clientData.neighborhood})`,
          city: sql`COALESCE(${clientsTable.city}, ${clientData.city})`,
          state: sql`COALESCE(${clientsTable.state}, ${clientData.state})`,
          zipCode: sql`COALESCE(${clientsTable.zipCode}, ${clientData.zipCode})`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(clientsTable.document, resolvedDocument.document),
            or(...fillableConditions),
          ),
        )
        .returning();

      if (updatedClient) {
        return {
          client: updatedClient,
          created: false,
        };
      }
    }

    const [existingClient] = await tx
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.document, resolvedDocument.document))
      .limit(1);

    if (!existingClient) {
      throw new Error(
        `Não foi possível localizar o cliente após o conflito do documento ${resolvedDocument.document}.`,
      );
    }

    return {
      client: existingClient,
      created: false,
    };
  };

  // A ingestão Porto utiliza a transação externa, garantindo atomicidade entre
  // criação/complementação do cliente e inserção da oportunidade.
  if (transaction) return resolveInTransaction(transaction);
  return db.transaction(resolveInTransaction);
};
