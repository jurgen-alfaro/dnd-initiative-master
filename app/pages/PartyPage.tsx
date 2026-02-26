"use client";

import InitiativeList from "@/app/components/initiative-list";
import { TurnControls } from "@/app/components/turn-controls";
import type { Combatant } from "@/app/lib/types";
import { useSearchParams } from "next/navigation";
import { usePartyPolling } from "@/app/lib/hooks/usePartyPolling";
import { useMemo } from "react";
import PartyInfoCard from "../components/PartyInfoCard";
import AddCombatantDialog from "../components/ui/AddCombatantToPartyDialog";
import AddCombatantToPartyDialog from "../components/ui/AddCombatantToPartyDialog";

type Party = {
  id: number;
  name: string;
  code: string;
  isActive: boolean | null;
  createdAt: Date;
  currentTurnIndex: number;
  currentRound: number;
  combatants: (Combatant & { partyId: number; createdAt: Date })[];
};

interface PartyPageProps {
  party: Party;
}

export default function PartyPage({ party }: PartyPageProps) {
  const searchParams = useSearchParams();
  const isDm = searchParams.get("dm") === "true";

  // Poll the API every 3 seconds so all connected sessions stay in sync
  const {
    combatants: liveCombatants,
    currentTurnIndex,
    currentRound,
    optimisticAdvanceTurn,
    optimisticPreviousTurn,
    optimisticNextRound,
    optimisticApplyDamageHeal,
  } = usePartyPolling(
    party.code,
    party.combatants,
    party.currentTurnIndex,
    party.currentRound,
    3000,
  );

  const playerCount = useMemo(
    () => liveCombatants.filter((c) => c.type === "player").length,
    [liveCombatants],
  );
  const enemyCount = useMemo(
    () => liveCombatants.filter((c) => c.type === "enemy").length,
    [liveCombatants],
  );

  const sortedCombatants = useMemo(
    () => [...liveCombatants].sort((a, b) => b.initiative - a.initiative),
    [liveCombatants],
  );

  return (
    <main className="min-h-screen py-10 px-4 pb-24 dnd-page-bg">
      <PartyInfoCard
        party={party}
        playerCount={playerCount}
        enemyCount={enemyCount}
      />

      <InitiativeList
        data={sortedCombatants}
        partyCode={party.code}
        isDm={isDm}
        currentTurnIndex={currentTurnIndex}
        onDamageHeal={optimisticApplyDamageHeal}
      />

      <TurnControls
        partyCode={party.code}
        currentTurnIndex={currentTurnIndex}
        currentRound={currentRound}
        totalCombatants={sortedCombatants.length}
        isDm={isDm}
        onAdvanceTurn={optimisticAdvanceTurn}
        onPreviousTurn={optimisticPreviousTurn}
        onNextRound={optimisticNextRound}
      />
      {isDm && <AddCombatantToPartyDialog floating />}
    </main>
  );
}
