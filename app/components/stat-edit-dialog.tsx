"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
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
  ) => void;
  isPending: boolean;
  children: React.ReactNode;
}

const STAT_CONFIG = {
  initiative: {
    title: "Edit Initiative",
    label: "Initiative",
    hasQuickAdjust: false,
    hasMaxField: false,
  },
  ac: {
    title: "Edit Armor Class",
    label: "AC",
    hasQuickAdjust: false,
    hasMaxField: false,
  },
  hp: {
    title: "Edit Hit Points",
    label: "HP",
    hasQuickAdjust: true,
    hasMaxField: true,
  },
  tmpHp: {
    title: "Edit Temporary HP",
    label: "Tmp HP",
    hasQuickAdjust: true,
    hasMaxField: false,
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
          ? combatant.hp
          : combatant.tmpHp;

  const [localValue, setLocalValue] = useState(initialValue);
  const [localMaxHp, setLocalMaxHp] = useState(combatant.maxHp);

  const handleQuickAdjust = (amount: number) => {
    setLocalValue((prev) => {
      const next = prev + amount;
      if (statType === "hp") return Math.max(0, Math.min(next, localMaxHp));
      return Math.max(0, next);
    });
  };

  const handleSave = () => {
    onSave(combatant.id, statType, String(localValue));
    if (statType === "hp" && localMaxHp !== combatant.maxHp) {
      onSave(combatant.id, "maxHp", String(localMaxHp));
    }
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
            type="number"
            value={localValue}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {
                if (statType === "hp") {
                  setLocalValue(Math.max(0, Math.min(val, localMaxHp)));
                } else {
                  setLocalValue(val);
                }
              }
            }}
            className="w-24 h-12 text-center font-mono text-2xl font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
          />
        </div>

        {/* Max HP field (HP mode only) */}
        {config.hasMaxField && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
              Max HP
            </span>
            <Input
              type="number"
              value={localMaxHp}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 0) {
                  setLocalMaxHp(val);
                  setLocalValue((prev) => Math.min(prev, val));
                }
              }}
              className="w-24 h-12 text-center font-mono text-2xl font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
            />
          </div>
        )}
      </div>

      {/* Quick-adjust buttons */}
      {config.hasQuickAdjust && (
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
      )}

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button onClick={handleSave} disabled={isPending}>
          Save
        </Button>
      </AlertDialogFooter>
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold">
            {config.title}
          </AlertDialogTitle>
        </AlertDialogHeader>
        {open && (
          <StatEditForm
            combatant={combatant}
            statType={statType}
            onSave={onSave}
            isPending={isPending}
            onClose={() => setOpen(false)}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
