"use client";

import InitiativeList from "@/app/components/InitiativeList";
import { TurnControls } from "@/app/components/TurnControls";
import type { Combatant } from "@/app/lib/types";
import { useRouter } from "next/navigation";
import { usePartySync } from "@/app/lib/hooks/usePartySync";
import { useMemo, useEffect, useState } from "react";
import { useRecentParty } from "@/app/lib/hooks/useRecentParty";
import { readDmToken } from "@/app/lib/dm-token";
import { usePartyMessages } from "@/app/lib/hooks/usePartyMessages";
import { isPartyDm } from "@/app/server/actions";
import PartyInfoCard from "../components/PartyInfoCard";
import { useBackNavigationGuard } from "@/app/lib/hooks/useBackNavigationGuard";
import BackNavigationDialog from "@/app/components/BackNavigationDialog";
import DeleteCombatantDialog from "@/app/components/DeleteCombatantDialog";
import HideCombatantDialog from "@/app/components/HideCombatantDialog";
import PartyActionsMenu from "@/app/components/PartyActionsMenu";
import { visibleInInitiativeOrder } from "@/app/lib/combat/turnCalculator";

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
  //
  // "unknown" is a real third state, not a stand-in for false: until the server
  // answers, a DM must not be treated as a player. That distinction is only
  // cosmetic for the combat UI, but the messaging drawer would otherwise greet
  // the DM with a character picker for half a second.
  const [dmStatus, setDmStatus] = useState<"unknown" | "dm" | "player">(
    "unknown",
  );
  const [dmToken, setDmToken] = useState<string | null>(null);
  const isDm = dmStatus === "dm";
  const isRoleResolved = dmStatus !== "unknown";
  const router = useRouter();

  // Read the token from localStorage and validate it after mount. Doing this on
  // mount (rather than during render) keeps it hydration-safe and, crucially,
  // works on client-side navigation (create, select or switch party) where
  // there is no full page reload — so the DM UI appears as soon as the session
  // opens. isPartyDm returns false for an empty/invalid token, covering the
  // "not a DM" case. setState runs only in the async callback.
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const token = readDmToken(party.code);

    // A transient failure here (a network blip to the database, say) must not
    // wedge the session forever: without a resolved role, isRoleResolved stays
    // false and the messaging drawer spins on its loading state for the rest
    // of the visit. Retry with a capped backoff instead of leaving dmStatus
    // stuck at "unknown".
    const attempt = (delayMs: number) => {
      isPartyDm(party.code, token ?? "")
        .then((ok) => {
          if (cancelled) return;
          setDmStatus(ok ? "dm" : "player");
          setDmToken(ok ? token : null);
        })
        .catch((error) => {
          if (cancelled) return;
          console.error("Error checking DM status, retrying:", error);
          retryTimer = setTimeout(
            () => attempt(Math.min(delayMs * 2, 10000)),
            delayMs,
          );
        });
    };

    attempt(1000);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [party.code]);

  // Realtime sync: the server pushes a signal on every change and this hook
  // re-fetches once, so all connected sessions stay in sync without polling.
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
    optimisticSetCombatantsHidden,
    optimisticUpdateConditions,
    optimisticAddBuff,
    optimisticRemoveBuff,
    optimisticAddAmmo,
    optimisticUpdateAmmo,
    optimisticRemoveAmmo,
  } = usePartySync(
    party.code,
    party.combatants,
    party.currentTurnIndex,
    party.currentRound,
    party.name,
    dmToken,
  );

  // Private DM ↔ player messaging. It holds off until the role is known so the
  // DM is never briefly mistaken for a player without a character.
  const messaging = usePartyMessages(party.code, isRoleResolved, dmToken);

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

  // Hide combatant confirmation dialog state
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [combatantToHide, setCombatantToHide] = useState<Combatant | null>(
    null,
  );

  const handleHideRequest = (combatantId: number) => {
    const combatant = liveCombatants.find((c) => c.id === combatantId);
    if (combatant) {
      setCombatantToHide(combatant);
      setHideDialogOpen(true);
    }
  };

  const handleConfirmHide = async () => {
    if (!combatantToHide) return;
    const id = combatantToHide.id;
    // Close first, clear last: the dialog keeps its subject mounted through the
    // close animation, and the card is gone from the list right away.
    setHideDialogOpen(false);
    await optimisticSetCombatantsHidden([id], true);
    setCombatantToHide(null);
  };

  const handleCancelHide = () => {
    setHideDialogOpen(false);
    setCombatantToHide(null);
  };

  const handleRevealCombatants = async (combatantIds: number[]) => {
    await optimisticSetCombatantsHidden(combatantIds, false);
  };

  useEffect(() => {
    if (party?.code && partyName) {
      saveRecentParty(party.code, partyName);
    }
  }, [party.code, party.name, saveRecentParty]);

  // Combatants held in reserve never reach a player's session, so this is only
  // ever non-empty for the DM.
  const hiddenCombatants = useMemo(
    () => liveCombatants.filter((c) => c.isHidden),
    [liveCombatants],
  );

  // Everything below counts the fight only — the reserve stays out of the
  // initiative order, the head counts and the buff targets.
  const sortedCombatants = useMemo(
    () => visibleInInitiativeOrder(liveCombatants),
    [liveCombatants],
  );

  const playerCount = useMemo(
    () => sortedCombatants.filter((c) => c.type === "player").length,
    [sortedCombatants],
  );
  const enemyCount = useMemo(
    () => sortedCombatants.filter((c) => c.type === "enemy").length,
    [sortedCombatants],
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
        onHide={handleHideRequest}
        onUpdateConditions={optimisticUpdateConditions}
        onRemoveBuff={optimisticRemoveBuff}
        onAddAmmo={optimisticAddAmmo}
        onUpdateAmmo={optimisticUpdateAmmo}
        onRemoveAmmo={optimisticRemoveAmmo}
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
        combatants={sortedCombatants}
        hiddenCombatants={hiddenCombatants}
        onAddBuff={optimisticAddBuff}
        onRevealCombatants={handleRevealCombatants}
        isPending={false}
        isDm={isDm}
        dmToken={dmToken}
        messaging={messaging}
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

      {combatantToHide && (
        <HideCombatantDialog
          open={hideDialogOpen}
          onOpenChange={setHideDialogOpen}
          onConfirm={handleConfirmHide}
          onCancel={handleCancelHide}
          combatant={combatantToHide}
        />
      )}
    </main>
  );
}
