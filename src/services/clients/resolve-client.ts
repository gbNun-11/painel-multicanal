import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { clientsTable } from "@/src/db/schema";
import { resolveDocument } from "@/src/utils/documents";

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
): Promise<ResolveClientResult> => {
  const resolvedDocument = resolveDocument(input.document);

  if (!resolvedDocument) {
    throw new Error("CPF ou CNPJ inválido.");
  }

  const name = normalizeRequiredText(input.name, "Nome do cliente");

  return db.transaction(async (tx) => {
    const [createdClient] = await tx
      .insert(clientsTable)
      .values({
        name,

        document: resolvedDocument.document,

        personType: resolvedDocument.personType,

        phone: normalizePhone(input.phone),

        email: normalizeEmail(input.email),

        birthDate: normalizeOptionalText(input.birthDate),

        address: normalizeOptionalText(input.address),

        addressNumber: normalizeOptionalText(input.addressNumber),

        addressComplement: normalizeOptionalText(input.addressComplement),

        neighborhood: normalizeOptionalText(input.neighborhood),

        city: normalizeOptionalText(input.city),

        state: normalizeState(input.state),

        zipCode: normalizeZipCode(input.zipCode),
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
  });
};
