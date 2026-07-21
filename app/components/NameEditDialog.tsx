"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { Combatant } from "@/app/lib/types";

interface NameEditDialogProps {
  combatant: Combatant;
  onSave: (id: number, name: string, type: "player" | "enemy") => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

function NameEditForm({
  combatant,
  onSave,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  onSave: NameEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [localName, setLocalName] = useState(combatant.name);

  const handleSave = async () => {
    // Trim and validate name
    const trimmedName = localName.trim();
    if (trimmedName.length < 3) return;

    await onSave(combatant.id, trimmedName, combatant.type);
    onClose();
  };

  const isValid = localName.trim().length >= 3;

  return (
    <div className="flex flex-col gap-4">
      {/* Name Input */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
          Name
        </span>
        <Input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          maxLength={30}
          className="text-lg font-heading font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
          placeholder="Enter name..."
        />
        {localName.trim().length > 0 && localName.trim().length < 3 && (
          <span className="text-xs text-dnd-blood-bright">
            Name must be at least 3 characters
          </span>
        )}
      </div>

      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <Button onClick={handleSave} disabled={isPending || !isValid}>
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function NameEditDialog({
  combatant,
  onSave,
  isPending,
  children,
}: NameEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold">
            Edit Name
          </DialogTitle>
          <DialogDescription>
            Set the combatant name.
          </DialogDescription>
        </DialogHeader>
        <NameEditForm
          combatant={combatant}
          onSave={onSave}
          isPending={isPending}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
