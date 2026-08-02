"use client";

import { UserCheck, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Combatant } from "@/app/lib/types";

interface ClaimCharacterPanelProps {
  combatants: Combatant[];
  onClaim: (combatantId: number) => Promise<void>;
  error: string | null;
}

/**
 * Asks a player which character they are, which is what opens their private
 * thread with the DM. It lives inside the drawer rather than in a dialog of its
 * own: stacking a second overlay on top of the drawer is exactly what the party
 * menu already goes out of its way to avoid.
 */
export default function ClaimCharacterPanel({
  combatants,
  onClaim,
  error,
}: ClaimCharacterPanelProps) {
  const characters = combatants.filter((c) => c.type === "player");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-heading text-base font-semibold text-dnd-gold">
          Which character are you?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick yours to start a private conversation with the DM. Only the two
          of you can read it.
        </p>
      </div>

      {characters.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          There are no player characters in this party yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {characters.map((character) => (
            <li key={character.id}>
              <Button
                type="button"
                variant="outline"
                disabled={character.isClaimed}
                onClick={() => void onClaim(character.id)}
                className="flex h-auto w-full cursor-pointer items-center justify-between gap-3 border-dnd-gold/20 px-4 py-3 hover:border-dnd-gold/40 hover:bg-dnd-gold/10 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <UserRound className="size-4 text-dnd-hero-blue" />
                  <span className="font-medium">{character.name}</span>
                </span>
                {character.isClaimed ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-dnd-gold/30 text-muted-foreground"
                  >
                    <UserCheck size={11} /> Taken
                  </Badge>
                ) : null}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-dnd-blood-bright">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Picked the wrong one? Ask your DM to release it for you.
      </p>
    </div>
  );
}
