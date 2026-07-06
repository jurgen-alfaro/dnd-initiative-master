"use client";

import InitiativeList from "@/app/components/InitiativeList";
import { TurnControls } from "@/app/components/TurnControls";
import type { Combatant } from "@/app/lib/types";
import { useRouter } from "next/navigation";
import { usePartyPolling } from "@/app/lib/hooks/usePartyPolling";
import { useMemo, useEffect, useState } from "react";
import { useRecentParty } from "@/app/lib/hooks/useRecentParty";
import { useDmToken } from "@/app/lib/hooks/useDmToken";
import PartyInfoCard from "../components/PartyInfoCard";
import { useBackNavigationGuard } from "@/app/lib/hooks/useBackNavigationGuard";
import BackNavigationDialog from "@/app/components/BackNavigationDialog";
import DeleteCombatantDialog from "@/app/components/DeleteCombatantDialog";
import AddActionsMenu from "@/app/components/AddActionsMenu";

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
  // DM status comes solely from the token stored in localStorage at party
  // creation. It is never derived from the URL, so tampering with query params
  // (e.g. `?dm=true`) cannot grant DM access. The server also validates the
  // token for any note operation.
  const dmToken = useDmToken(party.code);
  const isDm = dmToken !== null;
  const router = useRouter();

  // Poll the API every 3 seconds so all connected sessions stay in sync
  const {
    combatants: liveCombatants,
    currentTurnIndex,
    currentRound,
    partyName,
    optimisticAdvanceTurn,
    optimisticPreviousTurn,
    optimisticNextRound,
    optimisticSetRound,
    optimisticUpdatePartyName,
    optimisticApplyDamageHeal,
    optimisticUpdateAC,
    optimisticUpdateTmpHP,
    optimisticUpdateInitiative,
    optimisticUpdateNameType,
    optimisticDeleteCombatant,
    optimisticUpdateConditions,
    optimisticAddBuff,
    optimisticRemoveBuff,
  } = usePartyPolling(
    party.code,
    party.combatants,
    party.currentTurnIndex,
    party.currentRound,
    party.name,
    3000,
  );

  // Create updated party object with optimistic name
  const displayParty = {
    ...party,
    name: partyName,
    currentTurnIndex,
    currentRound,
  };

  // Guard against accidental back navigation
  const {
    showConfirmation,
    setShowConfirmation,
    handleConfirmNavigation,
    handleCancelNavigation,
  } = useBackNavigationGuard({
    enabled: true,
    onNavigateAway: () => {
      router.push("/");
    },
  });

  // Save party to localStorage for quick resume
  const { saveRecentParty } = useRecentParty();

  // Delete combatant confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [combatantToDelete, setCombatantToDelete] = useState<Combatant | null>(
    null,
  );

  const handleDeleteRequest = (combatantId: number) => {
    const combatant = liveCombatants.find((c) => c.id === combatantId);
    if (combatant) {
      setCombatantToDelete(combatant);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (combatantToDelete) {
      await optimisticDeleteCombatant(combatantToDelete.id);
      setDeleteDialogOpen(false);
      setCombatantToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setCombatantToDelete(null);
  };

  useEffect(() => {
    if (party?.code && partyName) {
      saveRecentParty(party.code, partyName);
    }
  }, [party.code, party.name, saveRecentParty]);

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
        party={displayParty}
        playerCount={playerCount}
        enemyCount={enemyCount}
        onRoundEdit={optimisticSetRound}
        onPartyNameEdit={optimisticUpdatePartyName}
        isDm={isDm}
        dmToken={dmToken}
      />

      <InitiativeList
        data={sortedCombatants}
        partyCode={party.code}
        isDm={isDm}
        currentTurnIndex={currentTurnIndex}
        onDamageHeal={optimisticApplyDamageHeal}
        onUpdateAC={optimisticUpdateAC}
        onUpdateTmpHP={optimisticUpdateTmpHP}
        onUpdateInitiative={optimisticUpdateInitiative}
        onUpdateNameType={optimisticUpdateNameType}
        onDelete={handleDeleteRequest}
        onUpdateConditions={optimisticUpdateConditions}
        onRemoveBuff={optimisticRemoveBuff}
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
      {isDm && (
        <AddActionsMenu
          combatants={liveCombatants}
          onAddBuff={optimisticAddBuff}
          isPending={false}
        />
      )}

      <BackNavigationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
      />

      {combatantToDelete && (
        <DeleteCombatantDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          combatant={combatantToDelete}
        />
      )}
    </main>
  );
}
