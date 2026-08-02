import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db/";
import { parties } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { toSafeCombatant } from "@/app/server/combatant-view";

interface Params {
  params: Promise<{ code: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { code } = await params;

  const party = await db.query.parties.findFirst({
    where: eq(parties.code, code.toUpperCase()),
    with: { combatants: true },
  });

  if (!party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  // Combatants held in reserve are a secret from the players: only a session
  // that proves it is the DM (by sending the party's token) receives them. The
  // token travels in a header rather than the query string so it stays out of
  // URLs, logs and caches.
  const isDm = req.headers.get("x-dm-token") === party.dmToken;
  const visibleCombatants = isDm
    ? party.combatants
    : party.combatants.filter((c) => !c.isHidden);

  // The device id is sent so each caller learns which character is *theirs*.
  // toSafeCombatant strips the stored claim before anything is serialized.
  const requesterDeviceId = req.headers.get("x-device-id");

  return NextResponse.json(
    {
      combatants: visibleCombatants.map((c) =>
        toSafeCombatant(c, requesterDeviceId),
      ),
      currentTurnIndex: party.currentTurnIndex,
      currentRound: party.currentRound,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
