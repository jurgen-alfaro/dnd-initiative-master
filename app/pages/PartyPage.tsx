"use client";

import InitiativeList from "@/app/components/InitiativeList";
import { TurnControls } from "@/app/components/TurnControls";
import type { Combatant } from "@/app/lib/types";
import { useRouter } from "next/navigation";
import { usePartyPolling } from "@/app/lib/hooks/usePartyPolling";
import { useMemo, useEffect, useState } from "react";
import { useRecentParty } from "@/app/lib/hooks/useRecentParty";
import { readDmToken } from "@/app/lib/dm-token";
import { isPartyDm } from "@/app/server/actions";
import PartyInfoCard from "../components/PartyInfoCard";
import { useBackNavigationGuard } from "@/app/lib/hooks/useBackNavigationGuard";
import BackNavigationDialog from "@/app/components/BackNavigationDialog";
import DeleteCombatantDialog from "@/app/components/DeleteCombatantDialog";
import PartyActionsMenu from "@/app/components/PartyActionsMenu";

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
  // DM status comes from the token stored in localStorage, verified against the
  // party's real token on the server. It is never derived from the URL, so
  // tampering with query params (e.g. `?dm=true`) cannot grant DM access.
  const [isDm, setIsDm] = useState(false);
  const [dmToken, setDmToken] = useState<string | null>(null);
  const router = useRouter();

  // Read the token from localStorage and validate it after mount. Doing this on
  // mount (rather than during render) keeps it hydration-safe and, crucially,
  // works on client-side navigation (create, select or switch party) where
  // there is no full page reload — so the DM UI appears as soon as the session
  // opens. isPartyDm returns false for an empty/invalid token, covering the
  // "not a DM" case. setState runs only in the async callback.
  useEffect(() => {
    let cancelled = false;
    const token = readDmToken(party.code);
    isPartyDm(party.code, token ?? "").then((ok) => {
      if (cancelled) return;
      setIsDm(ok);
      setDmToken(ok ? token : null);
    });
    return () => {
      cancelled = true;
    };
  }, [party.code]);

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
      <PartyActionsMenu
        partyCode={party.code}
        combatants={liveCombatants}
        onAddBuff={optimisticAddBuff}
        isPending={false}
        isDm={isDm}
        dmToken={dmToken}
        onReturnToMain={() => setShowConfirmation(true)}
      />

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
