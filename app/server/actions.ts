"use server";

import { db } from "@/app/db/";
import {
  parties,
  combatants,
  notes,
  dungeonMasters,
  dmDevices,
} from "@/app/db/schema";
import { generatePartyCode, generateRecoveryCode } from "@/app/lib/code-gen";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  Buff,
  Condition,
  DmParty,
  Note,
  NoteVisibility,
} from "@/app/lib/types";
import {
  calculateDamageResult,
  calculateHealingResult,
} from "@/app/lib/combat/damageCalculator";
import { recalculateTurnIndexAfterDeletion } from "@/app/lib/combat/turnCalculator";

// Zod validation schemas
const CreatePartySchema = z.object({
  partyName: z.string().min(3, "Name must be at least 3 characters"),
});

const AddCombatantToPartySchema = z.object({
  combatantName: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["player", "enemy"]),
  initiative: z.coerce.number().min(0).max(999).default(0).optional(),
  maxHp: z.coerce.number().min(0).max(999).default(0).optional(),
  ac: z.coerce.number().min(0).max(999).default(0).optional(),
  quantity: z.coerce.number().int().min(1).max(5).catch(1),
  partyCode: z.string(),
});

const UpdateInitiativeSchema = z.object({
  combatantId: z.number(),
  newInitiative: z.number(),
  partyCode: z.string(),
});

const UpdateCombatantInfoSchema = z.object({
  combatantId: z.number(),
  name: z.string().min(3).max(30).optional(),
  type: z.enum(["player", "enemy"]).optional(),
  partyCode: z.string(),
});

const DeleteCombatantSchema = z.object({
  combatantId: z.number(),
  partyCode: z.string(),
});

const ApplyDamageOrHealingSchema = z.object({
  combatantId: z.number(),
  amount: z.number().min(0).max(999),
  type: z.enum(["damage", "healing"]),
  partyCode: z.string(),
});

const JoinPartySchema = z.object({
  code: z.string().length(6, "Code must be 6 characters"),
});

const TurnActionSchema = z.object({
  partyCode: z.string().length(6),
});

const UpdateConditionsSchema = z.object({
  combatantId: z.number(),
  conditions: z.array(
    z.enum([
      "Blinded",
      "Charmed",
      "Deafened",
      "Frightened",
      "Grappled",
      "Incapacitated",
      "Invisible",
      "Paralyzed",
      "Petrified",
      "Poisoned",
      "Prone",
      "Restrained",
      "Stunned",
      "Unconscious",
    ]),
  ),
  partyCode: z.string(),
});

const AddBuffSchema = z.object({
  partyCode: z.string(),
  combatantIds: z.array(z.number()).min(1, "Select at least one combatant"),
  name: z.string().min(1).max(30),
  kind: z.enum(["buff", "debuff"]),
  rounds: z.number().int().min(1).max(999),
});

const RemoveBuffSchema = z.object({
  partyCode: z.string(),
  combatantId: z.number(),
  buffId: z.string(),
});

const SetRoundSchema = z.object({
  partyCode: z.string().length(6),
  newRound: z.number().min(1).max(999),
});

const UpdatePartyNameSchema = z.object({
  partyCode: z.string().length(6),
  newName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
});

const AddNoteSchema = z.object({
  partyCode: z.string().length(6),
  dmToken: z.string().min(1),
  content: z
    .string()
    .min(1, "Note cannot be empty")
    .max(5000, "Note is too long"),
  visibility: z.enum(["public", "private"]),
  sessionDate: z.coerce.date(),
});

// Recovery phrase chosen by the DM. It is normalized (trim + collapse
// whitespace + lowercase) before validating, so uniqueness and lookup are
// insensitive to casing and extra spaces.
const RECOVERY_WORD_RE = /^[\p{L}\p{N} -]+$/u; // letters (with accents), digits, space, hyphen

const RecoveryWordSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s+/g, " ").toLowerCase())
  .pipe(
    z
      .string()
      .min(4, "Phrase must be at least 4 characters")
      .max(40, "Phrase is too long")
      .regex(RECOVERY_WORD_RE, "Use only letters, numbers, spaces, or hyphens"),
  );

/** True if the error is a Postgres unique violation (code 23505). */
function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}

// --- Actions ---

export async function createParty(prevState: any, formData: FormData) {
  const validatedFields = CreatePartySchema.safeParse({
    partyName: formData.get("partyName"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const code = generatePartyCode();
  const deviceIdRaw = formData.get("deviceId");
  const deviceLabelRaw = formData.get("deviceLabel");
  const deviceId = typeof deviceIdRaw === "string" ? deviceIdRaw : "";
  const deviceLabel =
    typeof deviceLabelRaw === "string" ? deviceLabelRaw : null;

  try {
    // Link the party to the DM identity of the creating device (creating both
    // the DM and the device row on first use). Falls back to no owner if the
    // client didn't provide a device id.
    let dmId: number | null = null;
    let recoveryCode: string | null = null;
    if (deviceId) {
      const resolved = await resolveDmForDevice(deviceId, deviceLabel);
      dmId = resolved.dmId;
      recoveryCode = resolved.recoveryCode;
    }

    const [newParty] = await db
      .insert(parties)
      .values({
        name: validatedFields.data.partyName,
        code: code,
        dmId,
      })
      .returning({ code: parties.code, dmToken: parties.dmToken });

    // The creator is the DM. We return the token (it never travels in the URL)
    // and, on the first creation from a new device, the recovery phrase, so the
    // client can store them and then navigate to the party.
    return {
      success: true as const,
      code: newParty.code,
      dmToken: newParty.dmToken,
      recoveryCode,
    };
  } catch (error) {
    return { error: "Error creating party" };
  }
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
  // Quick validation
  const validated = UpdateInitiativeSchema.safeParse({
    combatantId,
    newInitiative,
    partyCode,
  });
  if (!validated.success) return { error: "Invalid data" };

  try {
    await db
      .update(combatants)
      .set({ initiative: newInitiative })
      .where(eq(combatants.id, combatantId));

    // THIS IS KEY: it tells Next.js to purge that route's cache
    // and reload the fresh data on every connected client.
    revalidatePath(`/party/${partyCode}`);
    return { success: true };
  } catch (error) {
    return { error: "Error updating initiative" };
  }
}

export async function updateCombatantStat(
  combatantId: number,
  field: "hp" | "ac" | "tmpHp" | "maxHp" | "initiative",
  value: number,
  partyCode: string,
) {
  const numVal = typeof value === "number" ? value : Number(value);
  if (isNaN(numVal)) return { error: "Invalid value" };

  try {
    await db
      .update(combatants)
      .set({ [field]: numVal })
      .where(eq(combatants.id, combatantId));

    revalidatePath(`/party/${partyCode}`);
    return { success: true };
  } catch (error) {
    return { error: "Error updating combatant" };
  }
}

export async function updateCombatantConditions(
  combatantId: number,
  conditions: Condition[],
  partyCode: string,
) {
  const validated = UpdateConditionsSchema.safeParse({
    combatantId,
    conditions,
    partyCode,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    await db
      .update(combatants)
      .set({ conditions })
      .where(eq(combatants.id, combatantId));

    revalidatePath(`/party/${partyCode}`);
    return { success: true };
  } catch (error) {
    return { error: "Error updating conditions" };
  }
}

export async function addBuffToCombatants(
  partyCode: string,
  combatantIds: number[],
  name: string,
  kind: Buff["kind"],
  rounds: number,
) {
  const validated = AddBuffSchema.safeParse({
    partyCode,
    combatantIds,
    name,
    kind,
    rounds,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  const newBuff: Buff = {
    id: crypto.randomUUID(),
    name: validated.data.name,
    kind: validated.data.kind,
    remainingRounds: validated.data.rounds,
  };

  try {
    const affected = await db.query.combatants.findMany({
      where: inArray(combatants.id, validated.data.combatantIds),
    });

    await Promise.all(
      affected.map((c) =>
        db
          .update(combatants)
          .set({ buffs: [...((c.buffs as Buff[]) ?? []), newBuff] })
          .where(eq(combatants.id, c.id)),
      ),
    );

    revalidatePath(`/party/${partyCode}`);
    return { success: true };
  } catch (error) {
    return { error: "Error adding buff" };
  }
}

export async function removeBuffFromCombatant(
  partyCode: string,
  combatantId: number,
  buffId: string,
) {
  const validated = RemoveBuffSchema.safeParse({
    partyCode,
    combatantId,
    buffId,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const combatant = await db.query.combatants.findFirst({
      where: eq(combatants.id, combatantId),
    });

    if (!combatant) {
      return { error: "Combatant not found" };
    }

    const nextBuffs = ((combatant.buffs as Buff[]) ?? []).filter(
      (b) => b.id !== buffId,
    );

    await db
      .update(combatants)
      .set({ buffs: nextBuffs })
      .where(eq(combatants.id, combatantId));

    revalidatePath(`/party/${partyCode}`);
    return { success: true };
  } catch (error) {
    return { error: "Error removing buff" };
  }
}

export async function applyDamageOrHealing(
  combatantId: number,
  amount: number,
  type: "damage" | "healing",
  partyCode: string,
) {
  // Validate input
  const validated = ApplyDamageOrHealingSchema.safeParse({
    combatantId,
    amount,
    type,
    partyCode,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    // Get the combatant's current state
    const combatant = await db.query.combatants.findFirst({
      where: eq(combatants.id, combatantId),
    });

    if (!combatant) {
      return { error: "Combatant not found" };
    }

    let newHp = combatant.hp;
    let newTmpHp = combatant.tmpHp;

    if (type === "damage") {
      // Use pure function for damage calculation
      const result = calculateDamageResult(combatant.hp, combatant.tmpHp, amount);
      newHp = result.hp;
      newTmpHp = result.tmpHp;
    } else if (type === "healing") {
      // Use pure function for healing calculation
      newHp = calculateHealingResult(combatant.hp, combatant.maxHp, amount);
    }

    // Update the database
    await db
      .update(combatants)
      .set({
        hp: newHp,
        tmpHp: newTmpHp,
      })
      .where(eq(combatants.id, combatantId));

    revalidatePath(`/party/${partyCode}`);
    return {
      success: true,
      newHp,
      newTmpHp,
    };
  } catch (error) {
    return { error: "Error applying damage/healing" };
  }
}

export async function updateCombatantInfo(
  combatantId: number,
  updates: { name?: string; type?: "player" | "enemy" },
  partyCode: string,
) {
  const validated = UpdateCombatantInfoSchema.safeParse({
    combatantId,
    name: updates.name,
    type: updates.type,
    partyCode,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    // Build update object with only provided fields
    const updateData: { name?: string; type?: "player" | "enemy" } = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;

    await db
      .update(combatants)
      .set(updateData)
      .where(eq(combatants.id, combatantId));

    revalidatePath(`/party/${partyCode}`);
    return { success: true };
  } catch (error) {
    return { error: "Error updating combatant info" };
  }
}

export async function deleteCombatant(
  combatantId: number,
  partyCode: string,
) {
  const validated = DeleteCombatantSchema.safeParse({
    combatantId,
    partyCode,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    // Get party with combatants to calculate new turnIndex
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, partyCode),
      with: { combatants: true },
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Verify combatant exists
    const combatantExists = party.combatants.find((c) => c.id === combatantId);
    if (!combatantExists) {
      return { error: "Combatant not found" };
    }

    // Sort combatants by initiative (descending) to match frontend display
    const sorted = [...party.combatants].sort(
      (a, b) => b.initiative - a.initiative,
    );

    // Find index of combatant to delete
    const deletedIndex = sorted.findIndex((c) => c.id === combatantId);

    // Delete the combatant from database
    await db.delete(combatants).where(eq(combatants.id, combatantId));

    // Use pure function to recalculate turn index
    const remainingCombatantsCount = sorted.length - 1;
    const newTurnIndex = recalculateTurnIndexAfterDeletion(
      party.currentTurnIndex,
      deletedIndex,
      remainingCombatantsCount,
    );

    // Update party turn index if it changed
    if (newTurnIndex !== party.currentTurnIndex) {
      await db
        .update(parties)
        .set({ currentTurnIndex: newTurnIndex })
        .where(eq(parties.id, party.id));
    }

    revalidatePath(`/party/${partyCode}`);
    return { success: true, newTurnIndex };
  } catch (error) {
    console.error("Error deleting combatant:", error);
    return { error: "Error deleting combatant" };
  }
}

export async function getPartyByCode(code: string) {
  return await db.query.parties.findFirst({
    where: eq(parties.code, code),
  });
}

// --- DM Identity Actions ---

/**
 * Returns the DM id for a device, creating the DM identity and the device row
 * on first use. Not a server action (internal helper).
 */
async function resolveDmForDevice(
  deviceId: string,
  label: string | null,
): Promise<{ dmId: number; recoveryCode: string }> {
  const existingDevice = await db.query.dmDevices.findFirst({
    where: eq(dmDevices.deviceId, deviceId),
    with: { dm: true },
  });

  if (existingDevice) {
    return {
      dmId: existingDevice.dmId,
      recoveryCode: existingDevice.dm.recoveryCode,
    };
  }

  const [dm] = await db
    .insert(dungeonMasters)
    .values({ recoveryCode: generateRecoveryCode() })
    .returning({
      id: dungeonMasters.id,
      recoveryCode: dungeonMasters.recoveryCode,
    });

  await db.insert(dmDevices).values({ deviceId, dmId: dm.id, label });

  return { dmId: dm.id, recoveryCode: dm.recoveryCode };
}

/** Lists a DM's parties (internal helper). */
async function listPartiesForDm(dmId: number): Promise<DmParty[]> {
  const rows = await db
    .select({
      code: parties.code,
      name: parties.name,
      dmToken: parties.dmToken,
      createdAt: parties.createdAt,
    })
    .from(parties)
    .where(eq(parties.dmId, dmId))
    .orderBy(desc(parties.createdAt));

  return rows.map((p) => ({
    code: p.code,
    name: p.name,
    dmToken: p.dmToken,
    createdAt: p.createdAt.toISOString(),
  }));
}

/**
 * Returns the parties owned by the DM associated with this device. The dmToken
 * is included because possession of the (secret) device id proves ownership.
 */
export async function getPartiesForDevice(
  deviceId: string,
): Promise<DmParty[]> {
  if (!deviceId) return [];

  const device = await db.query.dmDevices.findFirst({
    where: eq(dmDevices.deviceId, deviceId),
  });
  if (!device) return [];

  return listPartiesForDm(device.dmId);
}

/**
 * Re-adopts a DM identity on a new device using the recovery code. Links the
 * device to the DM and returns its parties.
 */
export async function recoverDm(
  recoveryCode: string,
  deviceId: string,
  deviceLabel: string,
): Promise<{ parties: DmParty[] } | { error: string }> {
  const code = recoveryCode.trim();
  if (!code) return { error: "Enter your recovery phrase" };

  const dm = await db.query.dungeonMasters.findFirst({
    where: sql`lower(${dungeonMasters.recoveryCode}) = lower(${code})`,
  });
  if (!dm) return { error: "Invalid recovery phrase" };

  if (deviceId) {
    const existing = await db.query.dmDevices.findFirst({
      where: eq(dmDevices.deviceId, deviceId),
    });
    if (!existing) {
      await db
        .insert(dmDevices)
        .values({ deviceId, dmId: dm.id, label: deviceLabel || null });
    } else if (existing.dmId !== dm.id) {
      await db
        .update(dmDevices)
        .set({ dmId: dm.id, label: deviceLabel || null })
        .where(eq(dmDevices.deviceId, deviceId));
    }
  }

  return { parties: await listPartiesForDm(dm.id) };
}

/**
 * Sets (or changes) the memorable recovery word for the DM that owns this
 * device. The word is normalized and must be unique; a collision returns a
 * typed error so the DM can pick another.
 */
export async function setRecoveryWord(
  deviceId: string,
  word: unknown,
): Promise<{ recoveryCode: string } | { error: string }> {
  const device = await db.query.dmDevices.findFirst({
    where: eq(dmDevices.deviceId, deviceId),
  });
  if (!device) return { error: "You are not a DM on this device." };

  const parsed = RecoveryWordSchema.safeParse(word);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid phrase" };
  }

  try {
    await db
      .update(dungeonMasters)
      .set({ recoveryCode: parsed.data })
      .where(eq(dungeonMasters.id, device.dmId));
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { error: "That word is already taken, choose another." };
    }
    throw e;
  }

  return { recoveryCode: parsed.data };
}

/**
 * Server-side check that a token matches a party's DM token, without ever
 * exposing the real token to the client. Used to gate the DM UI.
 */
export async function isPartyDm(code: string, token: string): Promise<boolean> {
  if (!token) return false;
  const party = await getPartyByCode(code);
  return !!party && party.dmToken === token;
}

export async function getPartyWithCombatants(code: string) {
  const party = await db.query.parties.findFirst({
    where: eq(parties.code, code),
    with: { combatants: true },
  });

  if (!party) return null;

  // Never expose the DM secret to the client that renders the party view.
  const { dmToken: _dmToken, ...safeParty } = party;

  // Cast conditions from string[] to Condition[] and buffs from jsonb to Buff[]
  return {
    ...safeParty,
    combatants: party.combatants.map((c) => ({
      ...c,
      conditions: c.conditions as Condition[],
      buffs: (c.buffs as Buff[]) ?? [],
    })),
  };
}

// --- Session Notes Actions ---

/**
 * Creates a session note. Only the DM (holder of a valid dmToken) may add
 * notes; visibility controls whether players can later read them.
 */
export async function addNote(
  partyCode: string,
  dmToken: string,
  content: string,
  visibility: NoteVisibility,
  sessionDate: string,
): Promise<{ success: true } | { error: string }> {
  const validated = AddNoteSchema.safeParse({
    partyCode,
    dmToken,
    content,
    visibility,
    sessionDate,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  const party = await getPartyByCode(validated.data.partyCode);
  if (!party) {
    return { error: "Party not found" };
  }

  if (validated.data.dmToken !== party.dmToken) {
    return { error: "Not authorized" };
  }

  try {
    await db.insert(notes).values({
      partyId: party.id,
      content: validated.data.content,
      visibility: validated.data.visibility,
      sessionDate: validated.data.sessionDate,
    });
  } catch (error) {
    return { error: "Error saving note" };
  }

  revalidatePath(`/party/${party.code}`);
  return { success: true };
}

/**
 * Returns the party's session notes. Public notes are visible to everyone;
 * private notes are only returned when a valid DM token is supplied. The
 * comparison happens server-side so private notes never reach players.
 */
export async function getNotes(
  partyCode: string,
  dmToken?: string,
): Promise<Note[]> {
  const party = await getPartyByCode(partyCode);
  if (!party) return [];

  const isDm = !!dmToken && dmToken === party.dmToken;

  const rows = await db
    .select({
      id: notes.id,
      content: notes.content,
      visibility: notes.visibility,
      sessionDate: notes.sessionDate,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(
      isDm
        ? eq(notes.partyId, party.id)
        : and(eq(notes.partyId, party.id), eq(notes.visibility, "public")),
    )
    .orderBy(desc(notes.sessionDate), desc(notes.createdAt));

  return rows.map((n) => ({
    id: n.id,
    content: n.content,
    visibility: n.visibility,
    sessionDate: n.sessionDate.toISOString(),
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function addCombatantToParty(prevState: any, formData: FormData) {
  const validatedFields = AddCombatantToPartySchema.safeParse({
    combatantName: formData.get("combatantName"),
    type: formData.get("type"),
    initiative: formData.get("initiative"),
    maxHp: formData.get("hp"),
    ac: formData.get("ac"),
    quantity: formData.get("quantity"),
    partyCode: formData.get("partyCode"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const party = await getPartyByCode(validatedFields.data.partyCode);
  if (!party) {
    return { error: "Party not found" };
  }

  const { combatantName, type, initiative, maxHp, ac, quantity } =
    validatedFields.data;

  // When adding several at once, suffix each name with its index so the
  // combatants stay distinguishable (e.g. "Goblin 1", "Goblin 2").
  const rows = Array.from({ length: quantity }, (_, i) => ({
    name: quantity > 1 ? `${combatantName} ${i + 1}` : combatantName,
    type,
    initiative,
    hp: maxHp,
    maxHp,
    ac,
    partyId: party.id,
  }));

  try {
    await db.insert(combatants).values(rows);
  } catch {
    return { error: "Error at adding combatant to party" };
  }

  revalidatePath(`/party/${party.code}`);
  return { success: true };
}

// --- Turn Management Actions ---

export async function advanceTurn(partyCode: string) {
  const validated = TurnActionSchema.safeParse({ partyCode });
  if (!validated.success) {
    return { error: "Invalid party code" };
  }

  try {
    // Get party with combatants to determine max index
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, partyCode),
      with: { combatants: true },
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Sort combatants by initiative (descending) to match display order
    const sorted = [...party.combatants].sort(
      (a, b) => b.initiative - a.initiative,
    );
    const maxIndex = Math.max(0, sorted.length - 1);

    // Increment turn index, clamped to max
    const nextIndex = Math.min(party.currentTurnIndex + 1, maxIndex);

    // Update turn index in database
    await db
      .update(parties)
      .set({ currentTurnIndex: nextIndex })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    return { success: true, newIndex: nextIndex };
  } catch (error) {
    return { error: "Error advancing turn" };
  }
}

export async function previousTurn(partyCode: string) {
  const validated = TurnActionSchema.safeParse({ partyCode });
  if (!validated.success) {
    return { error: "Invalid party code" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, partyCode),
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Decrement turn index, clamped to 0
    const prevIndex = Math.max(0, party.currentTurnIndex - 1);

    await db
      .update(parties)
      .set({ currentTurnIndex: prevIndex })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    return { success: true, newIndex: prevIndex };
  } catch (error) {
    return { error: "Error going to previous turn" };
  }
}

export async function nextRound(partyCode: string) {
  const validated = TurnActionSchema.safeParse({ partyCode });
  if (!validated.success) {
    return { error: "Invalid party code" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, partyCode),
      with: { combatants: true },
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Decrement buff durations and drop expired ones for each combatant
    await Promise.all(
      party.combatants.map((c) => {
        const current = (c.buffs as Buff[]) ?? [];
        if (current.length === 0) return null;

        const nextBuffs = current
          .map((b) => ({ ...b, remainingRounds: b.remainingRounds - 1 }))
          .filter((b) => b.remainingRounds > 0);

        return db
          .update(combatants)
          .set({ buffs: nextBuffs })
          .where(eq(combatants.id, c.id));
      }),
    );

    // Increment round and reset turn to first combatant
    await db
      .update(parties)
      .set({
        currentRound: party.currentRound + 1,
        currentTurnIndex: 0,
      })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    return { success: true, newRound: party.currentRound + 1 };
  } catch (error) {
    return { error: "Error advancing round" };
  }
}

export async function setRound(partyCode: string, newRound: number) {
  const validated = SetRoundSchema.safeParse({ partyCode, newRound });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, partyCode),
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Update ONLY the round, keep turnIndex unchanged
    await db
      .update(parties)
      .set({
        currentRound: newRound,
      })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    return { success: true, newRound };
  } catch (error) {
    return { error: "Error setting round" };
  }
}

export async function updatePartyName(partyCode: string, newName: string) {
  const validated = UpdatePartyNameSchema.safeParse({ partyCode, newName });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, partyCode),
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Update only the name
    await db
      .update(parties)
      .set({
        name: newName,
      })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    return { success: true, newName };
  } catch (error) {
    return { error: "Error updating party name" };
  }
}
