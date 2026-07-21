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
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import type { Combatant, Condition } from "@/app/lib/types";
import { ALL_CONDITIONS } from "@/app/lib/types";
import { Activity } from "lucide-react";

interface ConditionsEditDialogProps {
  combatant: Combatant;
  onSave: (id: number, conditions: Condition[]) => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

function ConditionsEditForm({
  combatant,
  onSave,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  onSave: ConditionsEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [selectedConditions, setSelectedConditions] = useState<Set<Condition>>(
    new Set(combatant.conditions || []),
  );

  const handleToggleCondition = (condition: Condition) => {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(condition)) {
        next.delete(condition);
      } else {
        next.add(condition);
      }
      return next;
    });
  };

  const handleSave = async () => {
    await onSave(combatant.id, Array.from(selectedConditions));
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {ALL_CONDITIONS.map((condition) => (
          <div key={condition} className="flex items-center space-x-2">
            <Checkbox
              id={`condition-${condition}`}
              checked={selectedConditions.has(condition)}
              onCheckedChange={() => handleToggleCondition(condition)}
              disabled={isPending}
            />
            <Label
              htmlFor={`condition-${condition}`}
              className="text-sm font-heading cursor-pointer"
            >
              {condition}
            </Label>
          </div>
        ))}
      </div>

      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Conditions"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function ConditionsEditDialog({
  combatant,
  onSave,
  isPending,
  children,
}: ConditionsEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Manage Conditions
          </DialogTitle>
          <DialogDescription>
            Select active conditions for {combatant.name}
          </DialogDescription>
        </DialogHeader>
        <ConditionsEditForm
          combatant={combatant}
          onSave={onSave}
          isPending={isPending}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
