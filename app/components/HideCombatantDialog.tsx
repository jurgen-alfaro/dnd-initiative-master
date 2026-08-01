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
import { EyeOff } from "lucide-react";

interface HideCombatantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  combatant: Combatant;
}

/**
 * Confirmation before sending a combatant to the reserve. Hiding is reversible
 * (the DM brings it back from the reserve drawer), but it disappears from every
 * player's screen and gives up its slot in the turn order, so it is worth a
 * deliberate tap.
 */
export default function HideCombatantDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  combatant,
}: HideCombatantDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-dnd-gold" />
            Hide Combatant?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-heading font-bold text-dnd-gold">
              {combatant.name}
            </span>{" "}
            will move to the reserve: hidden from the players and skipped in the
            turn order. You can bring it back into the fight at any time from
            the reserve.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Hide</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
