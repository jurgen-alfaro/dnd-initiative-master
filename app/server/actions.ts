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
  partyName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
});

const UpdateInitiativeSchema = z.object({
  combatantId: z.number(),
  newInitiative: z.number(),
  partyCode: z.string(),
});

const JoinPartySchema = z.object({
  code: z.string().length(6, "El código debe ser de 6 caracteres"),
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
