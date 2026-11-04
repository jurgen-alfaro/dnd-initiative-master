"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { EyeOff } from "lucide-react";
import type { Combatant } from "@/app/lib/types";

interface BackpackPickerDialogProps {
  /** The PJs whose backpack the DM can open. */
  characters: Combatant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (combatantId: number) => void;
}

/** DM-only: choose which PJ's backpack to open from the actions menu. */
export default function BackpackPickerDialog({
  characters,
  open,
  onOpenChange,
  onPick,
}: BackpackPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Backpacks</DialogTitle>
          <DialogDescription>Choose a character to open their backpack.</DialogDescription>
        </DialogHeader>

        {characters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There are no player characters in this party yet.
          </p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {characters.map((character) => (
              <li key={character.id}>
                <button
                  type="button"
                  onClick={() => onPick(character.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-dnd-gold/15 bg-dnd-parchment/5 p-3 text-left transition-colors hover:border-dnd-gold/40 hover:bg-dnd-gold/10"
                >
                  <span className="font-heading text-dnd-gold">
                    {character.name}
                  </span>
                  {character.isHidden && (
                    <EyeOff
                      size={14}
                      className="text-muted-foreground"
                      aria-label="In reserve"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
