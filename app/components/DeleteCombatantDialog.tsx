"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import type { Combatant } from "@/app/lib/types";
import { Backpack, Skull } from "lucide-react";
import { useCharacterInventory } from "@/app/lib/hooks/useCharacterInventory";
import { isInventoryEmpty } from "@/app/lib/inventory/inventory";

interface DeleteCombatantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  combatant: Combatant;
  partyCode: string;
  dmToken: string | null;
}

export default function DeleteCombatantDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  combatant,
  partyCode,
  dmToken,
}: DeleteCombatantDialogProps) {
  // The backpack goes with the PJ. The inventario never travels in the party
  // payload, so the DM reads it through the same private channel as the
  // backpack drawer, only while this dialog is open.
  const hasBackpack = combatant.type === "player" && dmToken !== null;
  const { character, error } = useCharacterInventory(
    partyCode,
    open && hasBackpack,
    dmToken,
    combatant.id,
  );
  const isBackpackRead = character?.combatantId === combatant.id;
  // Removing can't wait for nothing: until the backpack is read (or failed to
  // be), the DM can't confirm without knowing what is lost.
  const isReadingBackpack = hasBackpack && !isBackpackRead && error === null;
  const isLosingBackpack =
    isBackpackRead && !isInventoryEmpty(character.inventory);
  const isBackpackUnknown = hasBackpack && !isBackpackRead && error !== null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-dnd-blood-bright" />
            Remove Combatant?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-heading font-bold text-dnd-gold">
              {combatant.name}
            </span>{" "}
            from the initiative tracker? This action cannot be undone.
          </AlertDialogDescription>
          {isLosingBackpack && (
            <p className="flex items-start gap-2 rounded-md border border-dnd-blood/40 bg-dnd-blood/10 p-2 text-sm text-dnd-blood-bright">
              <Backpack className="mt-0.5 size-4 shrink-0" />
              Their backpack isn&apos;t empty. Its coins and items will be
              deleted with them.
            </p>
          )}
          {isBackpackUnknown && (
            <p className="flex items-start gap-2 rounded-md border border-dnd-blood/40 bg-dnd-blood/10 p-2 text-sm text-dnd-blood-bright">
              <Backpack className="mt-0.5 size-4 shrink-0" />
              Couldn&apos;t check their backpack. Any coins and items in it
              will be deleted with them.
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            variant="destructive"
            disabled={isReadingBackpack}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
