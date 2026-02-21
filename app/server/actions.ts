"use server";

import { db } from "@/app/db/";
import { parties, combatants } from "@/app/db/schema";
import { generatePartyCode } from "@/app/lib/code-gen";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Esquemas de validación Zod
const CreatePartySchema = z.object({
  partyName: z.string().min(3, "Name must be at least 3 characters"),
});

const AddCombatantToPartySchema = z.object({
  combatantName: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["player", "enemy"]),
  initiative: z.coerce.number().min(0).max(100).default(0).optional(),
  partyCode: z.string(),
});

const UpdateInitiativeSchema = z.object({
  combatantId: z.number(),
  newInitiative: z.number(),
  partyCode: z.string(),
});

const JoinPartySchema = z.object({
  code: z.string().length(6, "Code must be 6 characters"),
});

// --- Actions ---

export async function createParty(prevState: any, formData: FormData) {
  const validatedFields = CreatePartySchema.safeParse({
    partyName: formData.get("partyName"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const code = generatePartyCode();

  try {
    const newParty = await db
      .insert(parties)
      .values({
        name: validatedFields.data.partyName,
        code: code,
      })
      .returning({ code: parties.code });

    // Redirigimos a la vista de la party creada
    // Nota: En una app real, aquí setearías una cookie de sesión para identificar al DM
  } catch (error) {
    return { error: "Error al crear la base de datos" };
  }

  redirect(`/party/${code}`);
}

export async function joinParty(prevState: any, formData: FormData) {
  const code = formData.get("code")?.toString().toUpperCase();

  const validated = JoinPartySchema.safeParse({ code });

  if (!validated.success) {
    return { error: "Invalid code" };
  }

  const party = await db.query.parties.findFirst({
    where: eq(parties.code, validated.data.code),
  });

  if (!party) {
    return { error: "Party not found" };
  }

  redirect(`/party/${party.code}`);
}

export async function updateInitiative(
  combatantId: number,
  newInitiative: number,
  partyCode: string,
) {
  // Validación rápida
  const validated = UpdateInitiativeSchema.safeParse({
    combatantId,
    newInitiative,
    partyCode,
  });
  if (!validated.success) return { error: "Datos inválidos" };

  try {
    await db
      .update(combatants)
      .set({ initiative: newInitiative })
      .where(eq(combatants.id, combatantId));

    // ESTO ES CLAVE: Le dice a Next.js que purgue la caché de esa ruta
    // y recargue los nuevos datos en todos los clientes conectados.
    revalidatePath(`/party/${partyCode}`);
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar iniciativa" };
  }
}

export async function getPartyByCode(code: string) {
  return await db.query.parties.findFirst({
    where: eq(parties.code, code),
  });
}

export async function getPartyWithCombatants(code: string) {
  return await db.query.parties.findFirst({
    where: eq(parties.code, code),
    with: { combatants: true },
  });
}

export async function addCombatantToParty(prevState: any, formData: FormData) {
  const validatedFields = AddCombatantToPartySchema.safeParse({
    combatantName: formData.get("combatantName"),
    type: formData.get("type"),
    initiative: formData.get("initiative"),
    partyCode: formData.get("partyCode"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const party = await getPartyByCode(validatedFields.data.partyCode);
  if (!party) {
    return { error: "Party not found" };
  }

  const partyId = party.id;

  try {
    const newCombatant = await db
      .insert(combatants)
      .values({
        name: validatedFields.data.combatantName,
        type: validatedFields.data.type,
        initiative: validatedFields.data.initiative,
        partyId: partyId,
      })
      .returning({
        name: combatants.name,
        type: combatants.type,
        initiative: combatants.initiative,
      });
  } catch (error) {
    console.log(error);
    return { error: "Error at adding combatant to party" };
  }

  revalidatePath(`/party/${party.code}`);
  return { success: true };
}
