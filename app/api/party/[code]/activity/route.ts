import { NextRequest, NextResponse } from "next/server";
import { resolveMessageAccess } from "@/app/server/messages";
import { fetchActivityUnread } from "@/app/server/inventory";

type Params = {
  params: Promise<{ code: string }>;
};

/**
 * The DM's unread avisos per PJ, for the backpack badges. DM only, by the
 * `x-dm-token` header: players never see the actividad nor its counters.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { code } = await params;

  const access = await resolveMessageAccess(
    code,
    req.headers.get("x-dm-token"),
    null,
  );

  if (access.role === "not-found") {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }
  if (access.role !== "dm") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json(
    { unread: await fetchActivityUnread(access.partyId) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
