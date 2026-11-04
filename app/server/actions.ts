"use server";

import { db } from "@/app/db/";
import {
  parties,
  combatants,
  notes,
  dungeonMasters,
  dmDevices,
  messages,
  activityNotices,
} from "@/app/db/schema";
import { generatePartyCode, generateRecoveryCode } from "@/app/lib/code-gen";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  Ammo,
  Buff,
  ChatMessage,
  Condition,
  DmParty,
  Note,
  NoteVisibility,
} from "@/app/lib/types";
import { MAX_MESSAGE_LENGTH, MAX_NOTE_LENGTH } from "@/app/lib/types";
import {
  calculateDamageResult,
  calculateHealingResult,
} from "@/app/lib/combat/damageCalculator";
import {
  recalculateTurnIndexAfterDeletion,
  recalculateTurnIndexAfterVisibilityChange,
  visibleInInitiativeOrder,
} from "@/app/lib/combat/turnCalculator";
import {
  notifyPartyChanged,
  notifyPartyInventory,
  notifyPartyMessage,
} from "@/app/lib/pusher-server";
import { toSafeCombatant } from "@/app/server/combatant-view";
import { formatPartyAnnouncement } from "@/app/lib/treasure/party";
import {
  CoinsSchema,
  formatIndividualAnnouncement,
  TreasureSchema,
  type Coins,
  type Treasure,
  type TreasureItem,
} from "@/app/lib/treasure/treasure";
import {
  applyInventoryAction,
  BackpackActionSchema,
  type BackpackAction,
  type Inventory,
} from "@/app/lib/inventory/inventory";
import {
  sweepExpiredMessages,
  resolveMessageAccess,
} from "@/app/server/messages";
import { sweepExpiredActivity } from "@/app/server/inventory";

// Zod validation schemas
const CreatePartySchema = z.object({
  partyName: z.string().min(3, "Name must be at least 3 characters"),
});

const AddCombatantToPartySchema = z.object({
  combatantName: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["player", "enemy"]),
  initiative: z.coerce.number().min(0).max(999).default(0).optional(),
  maxHp: z.coerce.number().min(0).max(9999).default(0).optional(),
  ac: z.coerce.number().min(0).max(999).default(0).optional(),
  quantity: z.coerce.number().int().min(1).max(5).catch(1),
  // Comes from a radio group, so it arrives as a string in the FormData.
  isHidden: z
    .enum(["true", "false"])
    .catch("false")
    .transform((v) => v === "true"),
  partyCode: z.string(),
});

const SetCombatantsHiddenSchema = z.object({
  combatantIds: z.array(z.number()).min(1, "Select at least one combatant"),
  isHidden: z.boolean(),
  partyCode: z.string().length(6),
  dmToken: z.string().min(1),
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

const AmmoFieldsSchema = z.object({
  name: z.string().min(1).max(30),
  count: z.number().int().min(0).max(9999),
  max: z.number().int().min(1).max(9999).nullable(),
});

const AddAmmoSchema = AmmoFieldsSchema.extend({
  partyCode: z.string(),
  combatantId: z.number(),
  // Minted by the caller so the optimistic entry and the stored one share an
  // id, and an edit right after creating still targets the right entry.
  ammoId: z.string().min(1),
});

const UpdateAmmoSchema = AmmoFieldsSchema.extend({
  partyCode: z.string(),
  combatantId: z.number(),
  ammoId: z.string(),
});

const RemoveAmmoSchema = z.object({
  partyCode: z.string(),
  combatantId: z.number(),
  ammoId: z.string(),
});

const SetRoundSchema = z.object({
  partyCode: z.string().length(6),
  newRound: z.number().min(1).max(999),
  dmToken: z.string().min(1),
});

const UpdatePartyNameSchema = z.object({
  partyCode: z.string().length(6),
  newName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  dmToken: z.string().min(1),
});

const AddNoteSchema = z.object({
  partyCode: z.string().length(6),
  dmToken: z.string().min(1),
  content: z
    .string()
    .min(1, "Note cannot be empty")
    .max(MAX_NOTE_LENGTH, "Note is too long"),
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

// Party codes are stored uppercase; normalize so a lowercased code from a
// pasted link still resolves.
const PartyCodeSchema = z
  .string()
  .length(6)
  .transform((c) => c.toUpperCase());

// Device ids are crypto.randomUUID() values kept in localStorage.
const DeviceIdSchema = z.string().min(16).max(64);

const ClaimCombatantSchema = z.object({
  combatantId: z.number().int().positive(),
  partyCode: PartyCodeSchema,
  deviceId: DeviceIdSchema,
});

const ReleaseClaimByDmSchema = z.object({
  combatantId: z.number().int().positive(),
  partyCode: PartyCodeSchema,
  dmToken: z.string().min(1),
});

const ReleaseOwnClaimSchema = z.object({
  combatantId: z.number().int().positive(),
  partyCode: PartyCodeSchema,
  deviceId: DeviceIdSchema,
});

const SendMessageSchema = z.object({
  partyCode: PartyCodeSchema,
  combatantId: z.number().int().positive(),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(MAX_MESSAGE_LENGTH, "Message is too long"),
  dmToken: z.string().min(1).nullable(),
  deviceId: DeviceIdSchema.nullable(),
});

const DeliverIndividualTreasureSchema = z.object({
  partyCode: PartyCodeSchema,
  dmToken: z.string().min(1),
  combatantId: z.number().int().positive(),
  treasure: TreasureSchema,
});

const DeliverPartyTreasureSchema = z.object({
  partyCode: PartyCodeSchema,
  dmToken: z.string().min(1),
  treasure: TreasureSchema,
  shares: z
    .array(
      z.object({
        combatantId: z.number().int().positive(),
        coins: CoinsSchema,
        itemIndexes: z.array(z.number().int().min(0)).max(200),
      }),
    )
    .min(1)
    .max(100),
  sessionDate: z.coerce.date(),
});

const MarkThreadReadSchema = z.object({
  partyCode: PartyCodeSchema,
  combatantId: z.number().int().positive(),
  dmToken: z.string().min(1).nullable(),
  deviceId: DeviceIdSchema.nullable(),
});

const RunBackpackActionSchema = z.object({
  partyCode: PartyCodeSchema,
  dmToken: z.string().min(1).nullable(),
  deviceId: DeviceIdSchema.nullable(),
  action: BackpackActionSchema,
});

const MarkActivityReadSchema = z.object({
  partyCode: PartyCodeSchema,
  dmToken: z.string().min(1),
  combatantId: z.number().int().positive(),
});

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
    await notifyPartyChanged(partyCode);
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
    await notifyPartyChanged(partyCode);
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
    await notifyPartyChanged(partyCode);
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
    await notifyPartyChanged(partyCode);
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
    await notifyPartyChanged(partyCode);
    return { success: true };
  } catch (error) {
    return { error: "Error removing buff" };
  }
}

export async function addAmmoToCombatant(
  partyCode: string,
  combatantId: number,
  ammoId: string,
  name: string,
  count: number,
  max: number | null,
) {
  const validated = AddAmmoSchema.safeParse({
    partyCode,
    combatantId,
    ammoId,
    name,
    count,
    max,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  const newAmmo: Ammo = {
    id: validated.data.ammoId,
    name: validated.data.name,
    count: validated.data.count,
    max: validated.data.max,
  };

  try {
    const combatant = await db.query.combatants.findFirst({
      where: eq(combatants.id, validated.data.combatantId),
    });

    if (!combatant) {
      return { error: "Combatant not found" };
    }

    await db
      .update(combatants)
      .set({ ammo: [...((combatant.ammo as Ammo[]) ?? []), newAmmo] })
      .where(eq(combatants.id, validated.data.combatantId));

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
    return { success: true };
  } catch (error) {
    return { error: "Error adding ammo" };
  }
}

export async function updateCombatantAmmo(
  partyCode: string,
  combatantId: number,
  ammoId: string,
  name: string,
  count: number,
  max: number | null,
) {
  const validated = UpdateAmmoSchema.safeParse({
    partyCode,
    combatantId,
    ammoId,
    name,
    count,
    max,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const combatant = await db.query.combatants.findFirst({
      where: eq(combatants.id, validated.data.combatantId),
    });

    if (!combatant) {
      return { error: "Combatant not found" };
    }

    const current = (combatant.ammo as Ammo[]) ?? [];

    if (!current.some((a) => a.id === validated.data.ammoId)) {
      return { error: "Ammo not found" };
    }

    const nextAmmo = current.map((a) =>
      a.id === validated.data.ammoId
        ? {
            ...a,
            name: validated.data.name,
            count: validated.data.count,
            max: validated.data.max,
          }
        : a,
    );

    await db
      .update(combatants)
      .set({ ammo: nextAmmo })
      .where(eq(combatants.id, validated.data.combatantId));

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
    return { success: true };
  } catch (error) {
    return { error: "Error updating ammo" };
  }
}

export async function removeAmmoFromCombatant(
  partyCode: string,
  combatantId: number,
  ammoId: string,
) {
  const validated = RemoveAmmoSchema.safeParse({
    partyCode,
    combatantId,
    ammoId,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const combatant = await db.query.combatants.findFirst({
      where: eq(combatants.id, validated.data.combatantId),
    });

    if (!combatant) {
      return { error: "Combatant not found" };
    }

    const nextAmmo = ((combatant.ammo as Ammo[]) ?? []).filter(
      (a) => a.id !== validated.data.ammoId,
    );

    await db
      .update(combatants)
      .set({ ammo: nextAmmo })
      .where(eq(combatants.id, validated.data.combatantId));

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
    return { success: true };
  } catch (error) {
    return { error: "Error removing ammo" };
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
      const result = calculateDamageResult(
        combatant.hp,
        combatant.tmpHp,
        amount,
      );
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
    await notifyPartyChanged(partyCode);
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
    await notifyPartyChanged(partyCode);
    return { success: true };
  } catch (error) {
    return { error: "Error updating combatant info" };
  }
}

export async function deleteCombatant(combatantId: number, partyCode: string) {
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

    // Turn order only covers visible combatants, so that's where the deleted
    // index has to be looked up
    const visible = visibleInInitiativeOrder(party.combatants);
    const deletedIndex = visible.findIndex((c) => c.id === combatantId);

    // Delete the combatant from database
    await db.delete(combatants).where(eq(combatants.id, combatantId));

    // A hidden combatant holds no slot in the turn order — nothing to shift
    const newTurnIndex =
      deletedIndex === -1
        ? party.currentTurnIndex
        : recalculateTurnIndexAfterDeletion(
            party.currentTurnIndex,
            deletedIndex,
            visible.length - 1,
          );

    // Update party turn index if it changed
    if (newTurnIndex !== party.currentTurnIndex) {
      await db
        .update(parties)
        .set({ currentTurnIndex: newTurnIndex })
        .where(eq(parties.id, party.id));
    }

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
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

  // This runs on the server render, which cannot yet tell a DM from a player
  // (the DM token lives in localStorage), so hidden combatants are stripped for
  // everyone. The DM gets them back from /api/party/[code] once its session has
  // proven ownership with the token. For the same reason no device id is known
  // here, so toSafeCombatant reports `claimedByMe: false` for every character
  // until the first authenticated fetch corrects it.
  return {
    ...safeParty,
    combatants: party.combatants
      .filter((c) => !c.isHidden)
      .map((c) => toSafeCombatant(c, null)),
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
  await notifyPartyChanged(party.code);
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
    .orderBy(desc(notes.sessionDate), desc(notes.createdAt), desc(notes.id));

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
    isHidden: formData.get("isHidden"),
    partyCode: formData.get("partyCode"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const party = await getPartyByCode(validatedFields.data.partyCode);
  if (!party) {
    return { error: "Party not found" };
  }

  const { combatantName, type, initiative, maxHp, ac, quantity, isHidden } =
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
    isHidden,
    partyId: party.id,
  }));

  try {
    await db.insert(combatants).values(rows);
  } catch {
    return { error: "Error at adding combatant to party" };
  }

  revalidatePath(`/party/${party.code}`);
  await notifyPartyChanged(party.code);
  return { success: true };
}

/**
 * Hides combatants (sends them to the reserve) or brings them into the fight.
 * DM-only: hidden combatants are a secret from the players, so the caller must
 * prove ownership with the party's dmToken.
 *
 * The turn index points into the visible list, so it is recalculated around the
 * change to keep the same combatant active whenever possible.
 */
export async function setCombatantsHidden(
  combatantIds: number[],
  isHidden: boolean,
  partyCode: string,
  dmToken: string,
) {
  const validated = SetCombatantsHiddenSchema.safeParse({
    combatantIds,
    isHidden,
    partyCode,
    dmToken,
  });

  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, partyCode),
      with: { combatants: true },
    });

    if (!party) {
      return { error: "Party not found" };
    }

    if (party.dmToken !== dmToken) {
      return { error: "Only the DM can change combatant visibility" };
    }

    // Ignore ids from another party so a stale client can't touch them.
    const targetIds = party.combatants
      .filter((c) => combatantIds.includes(c.id) && c.isHidden !== isHidden)
      .map((c) => c.id);

    if (targetIds.length === 0) {
      return { success: true, newTurnIndex: party.currentTurnIndex };
    }

    const previousVisibleIds = visibleInInitiativeOrder(party.combatants).map(
      (c) => c.id,
    );

    await db
      .update(combatants)
      .set({ isHidden })
      .where(
        and(
          eq(combatants.partyId, party.id),
          inArray(combatants.id, targetIds),
        ),
      );

    const nextVisibleIds = visibleInInitiativeOrder(
      party.combatants.map((c) =>
        targetIds.includes(c.id) ? { ...c, isHidden } : c,
      ),
    ).map((c) => c.id);

    const newTurnIndex = recalculateTurnIndexAfterVisibilityChange(
      previousVisibleIds,
      nextVisibleIds,
      party.currentTurnIndex,
    );

    if (newTurnIndex !== party.currentTurnIndex) {
      await db
        .update(parties)
        .set({ currentTurnIndex: newTurnIndex })
        .where(eq(parties.id, party.id));
    }

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
    return { success: true, newTurnIndex };
  } catch (error) {
    console.error("Error updating combatant visibility:", error);
    return { error: "Error updating combatant visibility" };
  }
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

    // Only visible combatants take turns, in display order (initiative desc)
    const visible = visibleInInitiativeOrder(party.combatants);
    const maxIndex = Math.max(0, visible.length - 1);

    // Increment turn index, clamped to max
    const nextIndex = Math.min(party.currentTurnIndex + 1, maxIndex);

    // Update turn index in database
    await db
      .update(parties)
      .set({ currentTurnIndex: nextIndex })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
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
    await notifyPartyChanged(partyCode);
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

    // Decrement buff durations and drop expired ones for each combatant that
    // is actually in the fight — combatants held in reserve don't burn rounds.
    await Promise.all(
      party.combatants
        .filter((c) => !c.isHidden)
        .map((c) => {
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
    await notifyPartyChanged(partyCode);
    return { success: true, newRound: party.currentRound + 1 };
  } catch (error) {
    return { error: "Error advancing round" };
  }
}

export async function setRound(
  partyCode: string,
  newRound: number,
  dmToken: string,
) {
  const validated = SetRoundSchema.safeParse({ partyCode, newRound, dmToken });
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

    if (party.dmToken !== dmToken) {
      return { error: "Only the DM can change the round" };
    }

    // Update ONLY the round, keep turnIndex unchanged
    await db
      .update(parties)
      .set({
        currentRound: newRound,
      })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
    return { success: true, newRound };
  } catch (error) {
    return { error: "Error setting round" };
  }
}

export async function updatePartyName(
  partyCode: string,
  newName: string,
  dmToken: string,
) {
  const validated = UpdatePartyNameSchema.safeParse({
    partyCode,
    newName,
    dmToken,
  });
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

    if (party.dmToken !== dmToken) {
      return { error: "Only the DM can change the party name" };
    }

    // Update only the name
    await db
      .update(parties)
      .set({
        name: newName,
      })
      .where(eq(parties.id, party.id));

    revalidatePath(`/party/${partyCode}`);
    await notifyPartyChanged(partyCode);
    return { success: true, newName };
  } catch (error) {
    return { error: "Error updating party name" };
  }
}

// --- Character Claim Actions ---

// Spelled out rather than inferred: without an explicit union TypeScript widens
// these returns into a single shape where `error` is optional everywhere, and
// callers lose the ability to narrow with `"error" in result`.
type ClaimResult =
  | { success: true; combatantId: number; name: string }
  | { error: string };

type ActionResult = { success: true } | { error: string };

/**
 * Binds a player character to the calling device, which opens its private
 * thread with the DM. The claim is the player's only credential, so it is
 * granted with a single conditional UPDATE: whichever statement lands first
 * wins and the loser gets zero rows back. No transaction is used — the
 * neon-http driver has no interactive transactions, and the unique index is the
 * real backstop if two devices race.
 */
export async function claimCombatant(
  combatantId: number,
  partyCode: string,
  deviceId: string,
): Promise<ClaimResult> {
  const validated = ClaimCombatantSchema.safeParse({
    combatantId,
    partyCode,
    deviceId,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, validated.data.partyCode),
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Turn the most likely mistake into a readable message instead of letting
    // the unique index answer with a raw constraint error.
    const existingClaim = await db.query.combatants.findFirst({
      where: and(
        eq(combatants.partyId, party.id),
        eq(combatants.claimedByDeviceId, validated.data.deviceId),
      ),
    });

    if (existingClaim && existingClaim.id !== validated.data.combatantId) {
      return { error: `This device already plays ${existingClaim.name}` };
    }

    const [claimed] = await db
      .update(combatants)
      .set({
        claimedByDeviceId: validated.data.deviceId,
        claimedAt: new Date(),
      })
      .where(
        and(
          eq(combatants.id, validated.data.combatantId),
          eq(combatants.partyId, party.id),
          eq(combatants.type, "player"),
          eq(combatants.isHidden, false),
          isNull(combatants.claimedByDeviceId),
        ),
      )
      .returning({ id: combatants.id, name: combatants.name });

    if (!claimed) {
      return { error: "That character is already taken or cannot be claimed" };
    }

    revalidatePath(`/party/${party.code}`);
    await notifyPartyChanged(party.code);
    return { success: true, combatantId: claimed.id, name: claimed.name };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "This device already plays another character here" };
    }
    console.error("Error claiming combatant:", error);
    return { error: "Error claiming character" };
  }
}

/**
 * Frees a character so another device can claim it — the way out when a player
 * switches phones or clears their browser storage. The thread stays attached to
 * the character, so whoever claims it next inherits the history; the UI warns
 * about that before calling this.
 */
export async function releaseCombatantClaim(
  combatantId: number,
  partyCode: string,
  dmToken: string,
): Promise<ActionResult> {
  const validated = ReleaseClaimByDmSchema.safeParse({
    combatantId,
    partyCode,
    dmToken,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, validated.data.partyCode),
    });

    if (!party) {
      return { error: "Party not found" };
    }

    if (party.dmToken !== validated.data.dmToken) {
      return { error: "Only the DM can release a character" };
    }

    await db
      .update(combatants)
      .set({ claimedByDeviceId: null, claimedAt: null })
      .where(
        and(
          eq(combatants.id, validated.data.combatantId),
          eq(combatants.partyId, party.id),
        ),
      );

    revalidatePath(`/party/${party.code}`);
    await notifyPartyChanged(party.code);
    return { success: true };
  } catch (error) {
    console.error("Error releasing claim:", error);
    return { error: "Error releasing character" };
  }
}

/** Lets a player hand back the character they claimed on this device. */
export async function releaseOwnClaim(
  combatantId: number,
  partyCode: string,
  deviceId: string,
): Promise<ActionResult> {
  const validated = ReleaseOwnClaimSchema.safeParse({
    combatantId,
    partyCode,
    deviceId,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const party = await db.query.parties.findFirst({
      where: eq(parties.code, validated.data.partyCode),
    });

    if (!party) {
      return { error: "Party not found" };
    }

    // Scoping the update by device id is the authorization: a device can only
    // ever release what it already owns.
    const [released] = await db
      .update(combatants)
      .set({ claimedByDeviceId: null, claimedAt: null })
      .where(
        and(
          eq(combatants.id, validated.data.combatantId),
          eq(combatants.partyId, party.id),
          eq(combatants.claimedByDeviceId, validated.data.deviceId),
        ),
      )
      .returning({ id: combatants.id });

    if (!released) {
      return { error: "Not authorized" };
    }

    revalidatePath(`/party/${party.code}`);
    await notifyPartyChanged(party.code);
    return { success: true };
  } catch (error) {
    console.error("Error releasing own claim:", error);
    return { error: "Error releasing character" };
  }
}

// --- Direct Message Actions ---

/**
 * Posts a message into a character's private thread.
 *
 * The sender side is decided from the caller's proven identity, never from the
 * payload, and a player may only ever write into the thread of the character it
 * claimed. The DM is blocked from writing to an unclaimed character: there is
 * nobody to receive it, and whoever claims that character later would read it.
 */
export async function sendPartyMessage(
  partyCode: string,
  combatantId: number,
  body: string,
  dmToken: string | null,
  deviceId: string | null,
): Promise<{ success: true; message: ChatMessage } | { error: string }> {
  const validated = SendMessageSchema.safeParse({
    partyCode,
    combatantId,
    body,
    dmToken,
    deviceId,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const access = await resolveMessageAccess(
      validated.data.partyCode,
      validated.data.dmToken,
      validated.data.deviceId,
    );

    if (access.role === "not-found") return { error: "Party not found" };
    if (access.role === "unclaimed") return { error: "Claim a character first" };

    if (
      access.role === "player" &&
      access.combatantId !== validated.data.combatantId
    ) {
      return { error: "Not authorized" };
    }

    if (access.role === "dm") {
      const target = await db.query.combatants.findFirst({
        where: and(
          eq(combatants.id, validated.data.combatantId),
          eq(combatants.partyId, access.partyId),
        ),
      });

      if (!target) return { error: "Character not found" };
      if (target.type !== "player" || target.claimedByDeviceId === null) {
        return { error: "That character hasn't been claimed yet" };
      }
    }

    const [created] = await db
      .insert(messages)
      .values({
        partyId: access.partyId,
        combatantId: validated.data.combatantId,
        sender: access.role === "dm" ? "dm" : "player",
        body: validated.data.body,
        senderDeviceId: validated.data.deviceId,
      })
      .returning();

    await sweepExpiredMessages(access.partyId);

    // No revalidatePath here: nothing in the server render depends on messages,
    // and no notifyPartyChanged either — that would make every browser in the
    // party re-fetch the whole combatant list over a private message.
    await notifyPartyMessage(access.partyCode);

    return {
      success: true,
      message: {
        id: created.id,
        combatantId: created.combatantId,
        sender: created.sender,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
        readAt: created.readAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return { error: "Error sending message" };
  }
}

/**
 * Marks everything the other side wrote in a thread as read.
 *
 * Callers must only invoke this when there is something unread: the
 * notification it emits lets the sender see the read receipt live, and firing
 * it unconditionally would bounce signals back and forth between both browsers.
 */
export async function markThreadRead(
  partyCode: string,
  combatantId: number,
  dmToken: string | null,
  deviceId: string | null,
): Promise<ActionResult> {
  const validated = MarkThreadReadSchema.safeParse({
    partyCode,
    combatantId,
    dmToken,
    deviceId,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const access = await resolveMessageAccess(
      validated.data.partyCode,
      validated.data.dmToken,
      validated.data.deviceId,
    );

    if (access.role === "not-found") return { error: "Party not found" };
    if (access.role === "unclaimed") return { error: "Not authorized" };

    if (
      access.role === "player" &&
      access.combatantId !== validated.data.combatantId
    ) {
      return { error: "Not authorized" };
    }

    const otherSide = access.role === "dm" ? "player" : "dm";

    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.partyId, access.partyId),
          eq(messages.combatantId, validated.data.combatantId),
          eq(messages.sender, otherSide),
          isNull(messages.readAt),
        ),
      );

    await notifyPartyMessage(access.partyCode);
    return { success: true };
  } catch (error) {
    console.error("Error marking thread as read:", error);
    return { error: "Error updating messages" };
  }
}

// --- Treasure Actions ---

/**
 * The party whose DM holds `dmToken`, or the error to hand back. Not exported:
 * in a "use server" file that would publish it as an action.
 */
async function findPartyForDm(
  partyCode: string,
  dmToken: string,
): Promise<{ party: typeof parties.$inferSelect } | { error: string }> {
  const party = await getPartyByCode(partyCode);
  if (!party) return { error: "Party not found" };
  if (party.dmToken !== dmToken) return { error: "Not authorized" };
  return { party };
}

/**
 * The inventario of `target` once an entrega puts `coins` and `items` in it.
 * Not exported, like `findPartyForDm`.
 */
function receiveDelivery(
  target: typeof combatants.$inferSelect,
  coins: Coins,
  items: TreasureItem[],
): Inventory | { error: string } {
  const change = applyInventoryAction(
    [{ id: target.id, name: target.name, inventory: target.inventory }],
    { role: "dm" },
    { type: "receive", combatantId: target.id, coins, items },
    () => crypto.randomUUID(),
  );
  if ("error" in change) return { error: change.error.message };
  return change.characters[0].inventory;
}

/**
 * Delivers a tesoro individual: puts it in the recipient's inventario and
 * announces it as one or more DM messages in their private thread. Only the DM may deliver, and only to a claimed
 * PJ of the party, so nobody but that player reads it. The DM is trusted, so
 * the treasure is not re-rolled or checked against the tables.
 */
export async function deliverIndividualTreasure(
  partyCode: string,
  dmToken: string,
  combatantId: number,
  treasure: Treasure,
): Promise<ActionResult> {
  const validated = DeliverIndividualTreasureSchema.safeParse({
    partyCode,
    dmToken,
    combatantId,
    treasure,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const found = await findPartyForDm(
      validated.data.partyCode,
      validated.data.dmToken,
    );
    if ("error" in found) return found;
    const { party } = found;

    const target = await db.query.combatants.findFirst({
      where: and(
        eq(combatants.id, validated.data.combatantId),
        eq(combatants.partyId, party.id),
      ),
    });

    if (!target) return { error: "Character not found" };
    if (target.type !== "player") {
      return { error: "Treasure can only go to a player character" };
    }
    if (target.claimedByDeviceId === null) {
      return { error: "That character hasn't been claimed yet" };
    }

    const parts = formatIndividualAnnouncement(
      validated.data.treasure,
      target.name,
    );

    const inventory = receiveDelivery(
      target,
      validated.data.treasure.coins,
      validated.data.treasure.items,
    );
    if ("error" in inventory) return inventory;

    // One batch, so the announcement and the inventario never disagree.
    await db.batch([
      db.insert(messages).values(
        parts.map((body) => ({
          partyId: party.id,
          combatantId: target.id,
          sender: "dm" as const,
          body,
        })),
      ),
      db
        .update(combatants)
        .set({ inventory })
        .where(eq(combatants.id, target.id)),
    ]);
    await sweepExpiredMessages(party.id);

    await notifyPartyMessage(party.code);
    await notifyPartyInventory(party.code);
    return { success: true };
  } catch (error) {
    console.error("Error delivering treasure:", error);
    return { error: "Error delivering treasure" };
  }
}

/**
 * Delivers a tesoro de party: puts each share in its PJ's inventario and
 * announces the whole reparto as a public session note dated today (several
 * numbered notes if it is too long). Only the DM may
 * deliver, and every recipient must be a PJ of the party. The DM is trusted,
 * so the treasure is not re-rolled, but each item must go to exactly one PJ.
 */
export async function deliverPartyTreasure(
  partyCode: string,
  dmToken: string,
  treasure: Treasure,
  shares: { combatantId: number; coins: Coins; itemIndexes: number[] }[],
  sessionDate: string,
): Promise<ActionResult> {
  const validated = DeliverPartyTreasureSchema.safeParse({
    partyCode,
    dmToken,
    treasure,
    shares,
    sessionDate,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  const data = validated.data;
  const ids = data.shares.map((s) => s.combatantId);
  const assigned = data.shares.flatMap((s) => s.itemIndexes).sort((a, b) => a - b);
  const isEveryItemAssignedOnce =
    assigned.length === data.treasure.items.length &&
    assigned.every((index, i) => index === i);
  if (new Set(ids).size !== ids.length || !isEveryItemAssignedOnce) {
    return { error: "Invalid data" };
  }

  try {
    const found = await findPartyForDm(data.partyCode, data.dmToken);
    if ("error" in found) return found;
    const { party } = found;

    const recipients = await db.query.combatants.findMany({
      where: and(
        eq(combatants.partyId, party.id),
        eq(combatants.type, "player"),
        inArray(combatants.id, ids),
      ),
    });
    if (recipients.length !== ids.length) {
      return { error: "Treasure can only go to player characters of the party" };
    }

    const recipientById = new Map(recipients.map((c) => [c.id, c]));
    const parts = formatPartyAnnouncement(
      data.treasure,
      data.shares.map((share) => ({
        // NOTE: every id was just matched against `recipients`, so the name exists.
        name: recipientById.get(share.combatantId)?.name ?? "",
        coins: share.coins,
        itemIndexes: share.itemIndexes,
      })),
    );

    const inventoryUpdates = [];
    for (const share of data.shares) {
      const recipient = recipientById.get(share.combatantId);
      if (!recipient) return { error: "Invalid data" };
      const inventory = receiveDelivery(
        recipient,
        share.coins,
        share.itemIndexes.map((index) => data.treasure.items[index]),
      );
      if ("error" in inventory) return inventory;
      inventoryUpdates.push(
        db
          .update(combatants)
          .set({ inventory })
          .where(eq(combatants.id, recipient.id)),
      );
    }

    // Notes are read newest first, ties broken by the highest id, so the
    // parts go in last to first: part 1 gets the highest id and reads first.
    // One batch, so the announcement and the inventarios never disagree.
    await db.batch([
      db.insert(notes).values(
        parts.toReversed().map((content) => ({
          partyId: party.id,
          content,
          visibility: "public" as const,
          sessionDate: data.sessionDate,
        })),
      ),
      ...inventoryUpdates,
    ]);

    revalidatePath(`/party/${party.code}`);
    await notifyPartyChanged(party.code);
    await notifyPartyInventory(party.code);
    return { success: true };
  } catch (error) {
    console.error("Error delivering party treasure:", error);
    return { error: "Error delivering treasure" };
  }
}

// --- Inventory Actions ---

/**
 * The one write path of the backpack. The caller proves who they are like in
 * the private messages (DM token, or the device that claimed a PJ); the pure
 * module decides the rest, including that a player only touches their own PJ.
 * Every changed inventario and every aviso land in one batch.
 */
export async function runBackpackAction(
  partyCode: string,
  dmToken: string | null,
  deviceId: string | null,
  action: BackpackAction,
): Promise<ActionResult> {
  const validated = RunBackpackActionSchema.safeParse({
    partyCode,
    dmToken,
    deviceId,
    action,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const access = await resolveMessageAccess(
      validated.data.partyCode,
      validated.data.dmToken,
      validated.data.deviceId,
    );
    if (access.role === "not-found") return { error: "Party not found" };
    if (access.role === "unclaimed") return { error: "Claim a character first" };

    // Every PJ the caller may see, so an action that involves a second PJ
    // (giving) needs nothing more here. Hidden PJs never reach a player.
    const rows = await db.query.combatants.findMany({
      columns: { id: true, name: true, inventory: true },
      where: and(
        eq(combatants.partyId, access.partyId),
        eq(combatants.type, "player"),
        access.role === "player"
          ? or(
              eq(combatants.isHidden, false),
              eq(combatants.id, access.combatantId),
            )
          : undefined,
      ),
    });

    const change = applyInventoryAction(
      rows,
      access.role === "dm"
        ? { role: "dm" }
        : { role: "player", combatantId: access.combatantId },
      validated.data.action,
      () => crypto.randomUUID(),
    );
    if ("error" in change) return { error: change.error.message };

    // `characters` keeps the order of `rows`, and an untouched inventario
    // keeps its identity, so only the changed ones are written.
    const writes = [
      ...change.characters
        .filter((c, i) => c.inventory !== rows[i].inventory)
        .map((c) =>
          db
            .update(combatants)
            .set({ inventory: c.inventory })
            .where(eq(combatants.id, c.id)),
        ),
      ...(change.notices.length > 0
        ? [
            db.insert(activityNotices).values(
              change.notices.map((notice) => ({
                partyId: access.partyId,
                combatantId: notice.combatantId,
                text: notice.text,
              })),
            ),
          ]
        : []),
    ];
    const [first, ...rest] = writes;
    if (!first) return { success: true };

    await db.batch([first, ...rest]);
    if (change.notices.length > 0) await sweepExpiredActivity(access.partyId);

    await notifyPartyInventory(access.partyCode);
    return { success: true };
  } catch (error) {
    console.error("Error updating inventory:", error);
    return { error: "Error updating the backpack" };
  }
}

/**
 * Marks the avisos of a PJ's actividad as read, when the DM opens it. Callers
 * only invoke it with something unread, since the signal it emits makes every
 * open backpack and badge re-fetch.
 */
export async function markActivityRead(
  partyCode: string,
  dmToken: string,
  combatantId: number,
): Promise<ActionResult> {
  const validated = MarkActivityReadSchema.safeParse({
    partyCode,
    dmToken,
    combatantId,
  });
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const found = await findPartyForDm(
      validated.data.partyCode,
      validated.data.dmToken,
    );
    if ("error" in found) return found;
    const { party } = found;

    await db
      .update(activityNotices)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(activityNotices.partyId, party.id),
          eq(activityNotices.combatantId, validated.data.combatantId),
          isNull(activityNotices.readAt),
        ),
      );

    await notifyPartyInventory(party.code);
    return { success: true };
  } catch (error) {
    console.error("Error marking activity as read:", error);
    return { error: "Error updating the activity" };
  }
}
