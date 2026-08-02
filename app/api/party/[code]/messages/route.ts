import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getThreadMessages,
  getThreadsForDm,
  getUnreadCount,
  messageRetentionCutoff,
  resolveMessageAccess,
} from "@/app/server/messages";

interface Params {
  params: Promise<{ code: string }>;
}

const QuerySchema = z.object({
  combatantId: z.coerce.number().int().positive().optional(),
});

/**
 * Reads the caller's private messages.
 *
 * Both credentials travel in headers rather than the query string so they stay
 * out of URLs, logs and caches — the same reasoning as the party sync endpoint.
 * A caller with no credentials gets a 200 with `role: "unclaimed"`, not a 401:
 * a player who has not picked a character yet is in a perfectly valid state,
 * and a 401 would just fill the console on every background poll.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { code } = await params;

  const query = QuerySchema.safeParse({
    combatantId: req.nextUrl.searchParams.get("combatantId") ?? undefined,
  });

  if (!query.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const access = await resolveMessageAccess(
    code,
    req.headers.get("x-dm-token"),
    req.headers.get("x-device-id"),
  );

  if (access.role === "not-found") {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  const retentionCutoff = messageRetentionCutoff().toISOString();
  const noStore = { headers: { "Cache-Control": "no-store" } };

  if (access.role === "unclaimed") {
    return NextResponse.json({ role: "unclaimed", retentionCutoff }, noStore);
  }

  // A player never names the thread it wants: the claim decides it. The id in
  // the query is only accepted as a filter that has to match.
  if (access.role === "player") {
    if (
      query.data.combatantId !== undefined &&
      query.data.combatantId !== access.combatantId
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const [messages, unreadCount] = await Promise.all([
      getThreadMessages(access.partyId, access.combatantId),
      getUnreadCount(access.partyId, access.combatantId, "player"),
    ]);

    return NextResponse.json(
      {
        role: "player",
        retentionCutoff,
        combatantId: access.combatantId,
        combatantName: access.combatantName,
        messages,
        unreadCount,
      },
      noStore,
    );
  }

  if (query.data.combatantId === undefined) {
    const inbox = await getThreadsForDm(access.partyId);
    return NextResponse.json({ role: "dm", retentionCutoff, ...inbox }, noStore);
  }

  const { threads } = await getThreadsForDm(access.partyId);
  const thread = threads.find((t) => t.combatantId === query.data.combatantId);

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const messages = await getThreadMessages(
    access.partyId,
    query.data.combatantId,
  );

  return NextResponse.json(
    {
      role: "dm",
      retentionCutoff,
      combatantId: thread.combatantId,
      combatantName: thread.combatantName,
      messages,
      unreadCount: thread.unreadCount,
    },
    noStore,
  );
}
