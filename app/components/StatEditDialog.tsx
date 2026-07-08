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

type StatType = "ac" | "hp" | "tmpHp" | "initiative";

interface StatEditDialogProps {
  combatant: Combatant;
  statType: StatType;
  onSave: (
    id: number,
    field: "hp" | "ac" | "tmpHp" | "maxHp" | "initiative",
    val: string,
  ) => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

const STAT_CONFIG = {
  initiative: {
    title: "Edit Initiative",
    label: "Initiative",
    description: "Set the initiative.",
    hasQuickAdjust: false,
    hasMaxField: false,
    maxLength: 4,
  },
  ac: {
    title: "Edit Armor Class",
    label: "AC",
    description: "Set the armor class.",
    hasQuickAdjust: false,
    hasMaxField: false,
    maxLength: 2,
  },
  hp: {
    title: "Edit Max Hit Points",
    label: "Max HP",
    description: "Set the maximum hit points.",
    hasQuickAdjust: false,
    hasMaxField: false,
    maxLength: 4,
  },
  tmpHp: {
    title: "Edit Temporary HP",
    label: "Tmp HP",
    description: "Set the temporary hit points.",
    hasQuickAdjust: true,
    hasMaxField: false,
    maxLength: 4,
  },
} as const;

const QUICK_ADJUST_VALUES = [1, 5, 20, -1, -5, -20];

function StatEditForm({
  combatant,
  statType,
  onSave,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  statType: StatType;
  onSave: StatEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const config = STAT_CONFIG[statType];

  const initialValue =
    statType === "initiative"
      ? combatant.initiative
      : statType === "ac"
        ? combatant.ac
        : statType === "hp"
          ? combatant.maxHp
          : combatant.tmpHp;

  const [localValue, setLocalValue] = useState(initialValue);

  const handleQuickAdjust = (amount: number) => {
    setLocalValue((prev) => Math.max(0, prev + amount));
  };

  const handleSave = async () => {
    const field = statType === "hp" ? "maxHp" : statType;
    await onSave(combatant.id, field, String(localValue));
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-around">
        {/* Current value display and input */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
            {config.label}
          </span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={localValue}
            onChange={(e) => {
              const digits = e.target.value
                .replace(/\D/g, "")
                .slice(0, config.maxLength);
              setLocalValue(digits === "" ? 0 : parseInt(digits, 10));
            }}
            onFocus={(e) => {
              const len = e.target.value.length;
              e.target.setSelectionRange(len, len);
            }}
            className="w-24 h-12 text-center font-mono text-2xl font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_ADJUST_VALUES.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(amount)}
            disabled={isPending}
            className={
              amount > 0
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 font-mono font-bold"
                : "border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10 hover:border-dnd-blood/50 font-mono font-bold"
            }
          >
            {amount > 0 ? `+${amount}` : amount}
          </Button>
        ))}
      </div>

      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function StatEditDialog({
  combatant,
  statType,
  onSave,
  isPending,
  children,
}: StatEditDialogProps) {
  const [open, setOpen] = useState(false);
  const config = STAT_CONFIG[statType];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold">
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        {open && (
          <StatEditForm
            combatant={combatant}
            statType={statType}
            onSave={onSave}
            isPending={isPending}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
