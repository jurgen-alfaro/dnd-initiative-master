import { z } from "zod";
import type { ChatMessage } from "@/app/lib/types";

/**
 * Opt-in local copy of a private thread.
 *
 * The server drops messages after 30 days. Tables that want their history to
 * outlive that keep a copy in this browser instead — which also means the text
 * sits in clear in localStorage, so the feature is off until the user turns it
 * on and can be wiped from the drawer at any time.
 *
 * One key per thread rather than one per party: a DM with six characters would
 * otherwise rewrite six histories on every single message.
 */

const ENABLED_PREFIX = "dnd-msg-archive-enabled-";
const ARCHIVE_PREFIX = "dnd-msg-archive-";

/** Newest messages kept per thread. Older ones are dropped first when trimming. */
const MAX_ARCHIVED_MESSAGES = 500;

/** Byte ceiling per thread, ~5% of the usual 5 MB localStorage budget. */
const MAX_ARCHIVE_BYTES = 256 * 1024;

const ArchivedMessageSchema = z.object({
  id: z.number(),
  combatantId: z.number(),
  sender: z.enum(["dm", "player"]),
  body: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

// Parsing with Zod is what makes the untyped result of JSON.parse safe to use
// without asserting a shape onto it. The version field lets a future format
// change discard old archives instead of misreading them.
const MessageArchiveSchema = z.object({
  version: z.literal(1),
  partyCode: z.string(),
  combatantId: z.number(),
  combatantName: z.string(),
  updatedAt: z.string(),
  messages: z.array(ArchivedMessageSchema),
});

export type MessageArchive = z.infer<typeof MessageArchiveSchema>;

export type ArchivedChatMessage = ChatMessage & {
  // True when the message no longer exists on the server (it fell past the
  // retention window) and survives only in this device's archive.
  isLocalOnly: boolean;
};

const enabledKey = (partyCode: string) =>
  `${ENABLED_PREFIX}${partyCode.toUpperCase()}`;

const archiveKey = (partyCode: string, combatantId: number) =>
  `${ARCHIVE_PREFIX}${partyCode.toUpperCase()}-${combatantId}`;

export function isArchiveEnabled(partyCode: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(enabledKey(partyCode)) === "1";
  } catch (error) {
    console.warn("Cannot read the message archive setting:", error);
    return false;
  }
}

export function setArchiveEnabled(partyCode: string, enabled: boolean): void {
  if (typeof window === "undefined") return;

  try {
    if (enabled) {
      localStorage.setItem(enabledKey(partyCode), "1");
    } else {
      localStorage.removeItem(enabledKey(partyCode));
    }
  } catch (error) {
    console.warn("Cannot save the message archive setting:", error);
  }
}

/** Reads one thread's archive, discarding it if it no longer parses. */
export function readArchive(
  partyCode: string,
  combatantId: number,
): MessageArchive | null {
  if (typeof window === "undefined") return null;

  const key = archiveKey(partyCode, combatantId);

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = MessageArchiveSchema.safeParse(JSON.parse(stored));

    if (!parsed.success) {
      console.warn("Discarding a corrupted message archive:", key);
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn("Cannot read the message archive:", error);
    return null;
  }
}

function trimToBudget(messages: ChatMessage[]): ChatMessage[] {
  // Oldest first out: the tail of a conversation is what people come back for.
  let kept = messages.slice(-MAX_ARCHIVED_MESSAGES);

  while (kept.length > 0 && JSON.stringify(kept).length > MAX_ARCHIVE_BYTES) {
    kept = kept.slice(Math.ceil(kept.length / 4));
  }

  return kept;
}

/**
 * Merges the freshly seen messages into the stored archive and writes it back.
 * Returns an error string when the write could not happen, so the caller can
 * tell the user instead of leaving them with a silently broken archive.
 */
export function saveArchive(
  partyCode: string,
  combatantId: number,
  combatantName: string,
  messages: ChatMessage[],
): { error?: string } {
  if (typeof window === "undefined") return {};

  const key = archiveKey(partyCode, combatantId);

  const write = (toStore: ChatMessage[]) => {
    const archive: MessageArchive = {
      version: 1,
      partyCode: partyCode.toUpperCase(),
      combatantId,
      combatantName,
      updatedAt: new Date().toISOString(),
      messages: toStore,
    };
    localStorage.setItem(key, JSON.stringify(archive));
  };

  const merged = trimToBudget(messages);

  try {
    write(merged);
    return {};
  } catch (error) {
    const isQuota =
      error instanceof DOMException && error.name === "QuotaExceededError";

    if (!isQuota) {
      console.error("Error saving the message archive:", error);
      return { error: "Could not save the local copy" };
    }

    // One retry at half the size before giving up, so a nearly-full storage
    // doesn't cost the user their whole archive.
    try {
      write(merged.slice(Math.ceil(merged.length / 2)));
      return {};
    } catch (retryError) {
      console.error("Message archive still over quota:", retryError);
      deleteArchive(partyCode, combatantId);
      setArchiveEnabled(partyCode, false);
      return { error: "Local storage is full — archiving paused" };
    }
  }
}

export function deleteArchive(partyCode: string, combatantId: number): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(archiveKey(partyCode, combatantId));
  } catch (error) {
    console.warn("Cannot delete the message archive:", error);
  }
}

/** Wipes every archived thread of a party, plus the opt-in flag. */
export function deletePartyArchives(partyCode: string): void {
  if (typeof window === "undefined") return;

  const prefix = `${ARCHIVE_PREFIX}${partyCode.toUpperCase()}-`;

  try {
    // Scanning by prefix rather than keeping a side index, which could drift
    // out of sync with what is actually stored.
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    keys.forEach((k) => localStorage.removeItem(k));
    setArchiveEnabled(partyCode, false);
  } catch (error) {
    console.warn("Cannot delete the party archives:", error);
  }
}

/**
 * Combines the archive with what the server just returned.
 *
 * The server always wins on conflicts — it carries the up-to-date read
 * receipts. A message is flagged local-only when the server did not return it
 * *and* it predates the retention cutoff: without that second half, a thread
 * truncated by the server's page limit would wrongly look expired.
 */
export function mergeMessages(
  archived: ChatMessage[],
  fromServer: ChatMessage[],
  retentionCutoff: string,
): ArchivedChatMessage[] {
  const serverIds = new Set(fromServer.map((m) => m.id));
  const byId = new Map<number, ChatMessage>();

  archived.forEach((m) => byId.set(m.id, m));
  fromServer.forEach((m) => byId.set(m.id, m));

  return Array.from(byId.values())
    .sort((a, b) =>
      a.createdAt === b.createdAt
        ? a.id - b.id
        : a.createdAt.localeCompare(b.createdAt),
    )
    .map((m) => ({
      ...m,
      isLocalOnly: !serverIds.has(m.id) && m.createdAt < retentionCutoff,
    }));
}
