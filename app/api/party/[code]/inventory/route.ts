import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveMessageAccess } from "@/app/server/messages";
import { getCharacterInventory } from "@/app/server/inventory";

interface Params {
  params: Promise<{ code: string }>;
}

const QuerySchema = z.object({
  combatantId: z.coerce.number().int().positive().optional(),
});

/**
 * Reads the inventario of one PJ. Same identity as the private messages, in
 * the same headers: a player reads only the PJ they claimed (the claim picks
 * it, the query can only match it), the DM reads any PJ of the party by id.
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

  const noStore = { headers: { "Cache-Control": "no-store" } };

  if (access.role === "unclaimed") {
    return NextResponse.json({ role: "unclaimed" }, noStore);
  }

  const requested = query.data.combatantId;
  if (access.role === "player" && requested !== undefined && requested !== access.combatantId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const combatantId = access.role === "player" ? access.combatantId : requested;
  if (combatantId === undefined) {
    return NextResponse.json({ error: "Missing combatantId" }, { status: 400 });
  }

  const found = await getCharacterInventory(access.partyId, combatantId);
  if (!found) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json(
    { role: access.role, combatantId, ...found },
    noStore,
  );
}
