import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  fetchBackpack,
  type BackpackReadErrorCode,
} from "@/app/server/inventory";

type Params = {
  params: Promise<{ code: string }>;
};

const QuerySchema = z.object({
  combatantId: z.coerce.number().int().positive().optional(),
});

const ERROR_STATUS: Record<BackpackReadErrorCode, number> = {
  PARTY_NOT_FOUND: 404,
  FORBIDDEN: 403,
  MISSING_COMBATANT: 400,
  CHARACTER_NOT_FOUND: 404,
};

/**
 * Reads the inventario of one PJ, with the private messages' identity in the
 * same headers (`x-dm-token`, `x-device-id`); see `fetchBackpack`.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { code } = await params;

  const query = QuerySchema.safeParse({
    combatantId: req.nextUrl.searchParams.get("combatantId") ?? undefined,
  });
  if (!query.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const backpack = await fetchBackpack(
    code,
    req.headers.get("x-dm-token"),
    req.headers.get("x-device-id"),
    query.data.combatantId,
  );
  if ("error" in backpack) {
    return NextResponse.json(
      { error: backpack.error.message },
      { status: ERROR_STATUS[backpack.error.code] },
    );
  }

  return NextResponse.json(backpack, {
    headers: { "Cache-Control": "no-store" },
  });
}
