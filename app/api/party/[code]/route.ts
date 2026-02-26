import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db/";
import { parties, combatants } from "@/app/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ code: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;

  const party = await db.query.parties.findFirst({
    where: eq(parties.code, code.toUpperCase()),
    with: { combatants: true },
  });

  if (!party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      combatants: party.combatants,
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
