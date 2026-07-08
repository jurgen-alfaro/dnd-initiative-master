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
import CombatantTypeRadioGroup from "@/app/components/CombatantTypeRadioGroup";
import type { Combatant } from "@/app/lib/types";

interface TypeEditDialogProps {
  combatant: Combatant;
  onSave: (id: number, name: string, type: "player" | "enemy") => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

function TypeEditForm({
  combatant,
  onSave,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  onSave: TypeEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [localType, setLocalType] = useState<"player" | "enemy">(
    combatant.type,
  );

  const handleSave = async () => {
    await onSave(combatant.id, combatant.name, localType);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Type radio group */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
          Type
        </span>
        <CombatantTypeRadioGroup
          name="edit-type"
          value={localType}
          onChange={setLocalType}
        />
      </div>

      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <Button onClick={handleSave} disabled={isPending}>
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function TypeEditDialog({
  combatant,
  onSave,
  isPending,
  children,
}: TypeEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold">
            Edit Type
          </DialogTitle>
          <DialogDescription>
            Set the combatant type.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <TypeEditForm
            combatant={combatant}
            onSave={onSave}
            isPending={isPending}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
