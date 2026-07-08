"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  PlusIcon,
  UserPlus,
  Sparkles,
  ArrowLeftRight,
  HeartHandshake,
  NotebookText,
  Languages,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import AddCombatantToPartyDialog from "@/app/components/ui/AddCombatantToPartyDialog";
import AddBuffDialog from "@/app/components/AddBuffDialog";
import CreatePartyDialog from "@/app/components/CreatePartyDialog";
import SelectPartyDialog from "@/app/components/SelectPartyDialog";
import SessionNotesDrawer from "@/app/components/SessionNotesDrawer";
import { getPartiesForDevice } from "@/app/server/actions";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import type { BuffKind, Combatant, DmParty } from "@/app/lib/types";

interface PartyActionsMenuProps {
  partyCode: string;
  combatants: Combatant[];
  onAddBuff: (
    combatantIds: number[],
    name: string,
    kind: BuffKind,
    rounds: number,
  ) => Promise<void>;
  isPending: boolean;
  isDm: boolean;
  dmToken: string | null;
  onReturnToMain: () => void;
}

/**
 * Floating action button that opens a central modal of party actions. The DM
 * gets the full set (add combatant/buff, switch/create party, notes); a player
 * gets only the shared actions (party notes + return to main page). Each action
 * closes the menu and drives an existing dialog in controlled mode, so only one
 * overlay is ever visible. The modal closes via the X button, the backdrop, or
 * Escape.
 */
export default function PartyActionsMenu({
  partyCode,
  combatants,
  onAddBuff,
  isPending,
  isDm,
  dmToken,
  onReturnToMain,
}: PartyActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [combatantOpen, setCombatantOpen] = useState(false);
  const [buffOpen, setBuffOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [parties, setParties] = useState<DmParty[]>([]);

  // DM-only: load this device's parties to power the "Switch party" action.
  useEffect(() => {
    if (!isDm) return;
    let cancelled = false;
    getPartiesForDevice(getOrCreateDeviceId())
      .then((all) => {
        if (!cancelled) setParties(all);
      })
      .catch(() => {
        if (!cancelled) setParties([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isDm]);

  // Close the menu on Escape and lock body scroll while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const otherParties = isDm
    ? parties.filter((p) => p.code !== partyCode)
    : [];
  const canSwitchParty = otherParties.length > 0;

  // Close the menu first, then open the chosen sub-dialog, so the two overlays
  // never stack on top of each other.
  const openAction = (open: (value: boolean) => void) => {
    setMenuOpen(false);
    open(true);
  };

  return (
    <>
      <Button
        size="icon"
        onClick={() => setMenuOpen(true)}
        className="fixed bottom-20 right-6 rounded-full w-14 h-14 shadow-lg cursor-pointer z-50"
      >
        <PlusIcon className="w-7 h-7" />
      </Button>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMenuOpen(false);
            }}
          >
            <div className="dnd-card-ornate dnd-parchment-texture w-full max-w-md overflow-hidden rounded-xl bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-dnd-gold/20 px-5 py-4">
                <h2 className="font-heading text-lg font-bold tracking-wide text-dnd-gold">
                  Menu
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen(false)}
                  className="cursor-pointer text-muted-foreground hover:text-dnd-parchment"
                >
                  <X size={20} />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              {/* Actions */}
              <div className="px-5 py-5">
                <div className="grid grid-cols-2 gap-3">
                  {isDm && (
                    <>
                      <ActionButton
                        icon={
                          <UserPlus className="size-6 text-dnd-hero-blue" />
                        }
                        label="Add combatant"
                        onClick={() => openAction(setCombatantOpen)}
                      />
                      <ActionButton
                        icon={<Sparkles className="size-6 text-indigo-400" />}
                        label="Add buff/debuff"
                        onClick={() => openAction(setBuffOpen)}
                      />
                      {canSwitchParty && (
                        <ActionButton
                          icon={
                            <ArrowLeftRight className="size-6 text-dnd-gold" />
                          }
                          label="Switch party"
                          onClick={() => openAction(setSwitchOpen)}
                        />
                      )}
                      <ActionButton
                        icon={
                          <HeartHandshake className="size-6 text-emerald-400" />
                        }
                        label="Create party"
                        onClick={() => openAction(setCreateOpen)}
                      />
                    </>
                  )}
                  <ActionButton
                    icon={<NotebookText className="size-6 text-dnd-gold" />}
                    label="Party notes"
                    onClick={() => openAction(setNotesOpen)}
                  />
                  {/* Placeholder — language switching is not wired up yet */}
                  <ActionButton
                    icon={<Languages className="size-6 text-sky-400" />}
                    label="Change language"
                  />
                </div>

                {/* Subtle navigation back to the home screen */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMenuOpen(false);
                    onReturnToMain();
                  }}
                  className="mt-4 w-full cursor-pointer gap-2 text-muted-foreground hover:text-dnd-parchment"
                >
                  <LogOut size={16} />
                  Return to main page
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Sub-dialogs are siblings of the menu, opened via controlled state */}
      <AddCombatantToPartyDialog
        open={combatantOpen}
        onOpenChange={setCombatantOpen}
      />
      <AddBuffDialog
        combatants={combatants}
        onAddBuff={onAddBuff}
        isPending={isPending}
        open={buffOpen}
        onOpenChange={setBuffOpen}
      />
      <SelectPartyDialog
        parties={otherParties}
        open={switchOpen}
        onOpenChange={setSwitchOpen}
      />
      <CreatePartyDialog open={createOpen} onOpenChange={setCreateOpen} />
      <SessionNotesDrawer
        partyCode={partyCode}
        isDm={isDm}
        dmToken={dmToken}
        open={notesOpen}
        onOpenChange={setNotesOpen}
      />
    </>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="flex h-auto cursor-pointer flex-col gap-2 border-dnd-gold/20 py-4 hover:border-dnd-gold/40 hover:bg-dnd-gold/10"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
