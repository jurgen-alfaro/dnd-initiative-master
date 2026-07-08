"use client";

import { useState, useEffect } from "react";
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

type ActionType = "damage" | "healing";

interface DamageHealDialogProps {
  combatant: Combatant;
  onApply: (id: number, amount: number, type: ActionType) => void;
  isPending: boolean;
  children: React.ReactNode;
  defaultTab?: ActionType;
}

// Quick values for damage and healing
const QUICK_VALUES = [1, 5, 20];

function DamageHealForm({
  combatant,
  onApply,
  isPending,
  onClose,
  defaultTab = "damage",
}: {
  combatant: Combatant;
  onApply: DamageHealDialogProps["onApply"];
  isPending: boolean;
  onClose: () => void;
  defaultTab?: ActionType;
}) {
  const [activeTab, setActiveTab] = useState<ActionType>("damage");
  const [amount, setAmount] = useState(0);
  const [localPending, setLocalPending] = useState(false);

  // Reset state when modal opens (component mounts)
  useEffect(() => {
    setAmount(0);
    setLocalPending(false);
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Calculate a preview of the result
  const calculatePreview = () => {
    let previewHp = combatant.hp;
    let previewTmpHp = combatant.tmpHp;

    if (activeTab === "damage" && amount > 0) {
      // D&D 5e damage logic
      if (previewTmpHp > 0) {
        if (amount >= previewTmpHp) {
          const overflow = amount - previewTmpHp;
          previewTmpHp = 0;
          previewHp = Math.max(0, previewHp - overflow);
        } else {
          previewTmpHp = previewTmpHp - amount;
        }
      } else {
        previewHp = Math.max(0, previewHp - amount);
      }
    } else if (activeTab === "healing" && amount > 0) {
      // Healing logic
      previewHp = Math.min(combatant.maxHp, previewHp + amount);
    }

    return { previewHp, previewTmpHp };
  };

  const { previewHp, previewTmpHp } = calculatePreview();

  const handleQuickAdjust = (value: number) => {
    setAmount((prev) => Math.max(0, prev + value));
  };

  const handleApply = async () => {
    if (amount <= 0) return;
    setLocalPending(true);
    try {
      onApply(combatant.id, amount, activeTab);
      // Brief delay to show feedback before closing
      setTimeout(() => {
        setLocalPending(false);
        onClose();
      }, 300);
    } catch (error) {
      setLocalPending(false);
    }
  };

  const quickValues = QUICK_VALUES;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={activeTab === "damage" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("damage");
            setAmount(0);
          }}
          className={
            activeTab === "damage"
              ? "bg-dnd-blood text-white hover:bg-dnd-blood/90"
              : "border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10"
          }
        >
          Damage
        </Button>
        <Button
          variant={activeTab === "healing" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("healing");
            setAmount(0);
          }}
          className={
            activeTab === "healing"
              ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
              : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          }
        >
          Healing
        </Button>
      </div>

      {/* Estado actual */}
      <div className="flex justify-around py-2 px-4 bg-dnd-parchment/5 rounded border border-dnd-gold/10">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-dnd-blood-bright font-heading">
            Current HP
          </span>
          <span className="font-mono text-lg font-bold text-dnd-parchment">
            {combatant.hp}
            <span className="text-sm text-muted-foreground">
              /{combatant.maxHp}
            </span>
          </span>
        </div>
        {combatant.tmpHp !== 0 && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-dnd-gold font-heading">
              Current Tmp
            </span>
            <span className="font-mono text-lg font-bold text-dnd-parchment">
              {combatant.tmpHp}
            </span>
          </div>
        )}
      </div>

      {/* Input de cantidad */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
          {activeTab === "damage" ? "Damage Amount" : "Healing Amount"}
        </span>
        <Input
          type="number"
          value={amount || ""}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setAmount(isNaN(val) ? 0 : Math.max(0, val));
          }}
          className="w-32 h-14 text-center font-mono text-3xl font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
        />
      </div>

      {/* Quick adjust buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickValues.map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(value)}
            disabled={localPending}
            className={
              activeTab === "damage"
                ? "border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10 font-mono font-bold"
                : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-mono font-bold"
            }
          >
            {activeTab === "damage" ? "-" : "+"}
            {value}
          </Button>
        ))}
      </div>

      {/* Result preview */}
      {amount > 0 && (
        <div className="flex justify-around py-2 px-4 bg-dnd-gold/5 rounded border border-dnd-gold/20">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-dnd-blood-bright font-heading">
              After HP
            </span>
            <span
              className={`font-mono text-lg font-bold ${
                previewHp < combatant.hp
                  ? "text-dnd-blood-bright"
                  : "text-emerald-400"
              }`}
            >
              {previewHp}
              <span className="text-sm text-muted-foreground">
                /{combatant.maxHp}
              </span>
            </span>
          </div>
          {combatant.tmpHp !== 0 && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-dnd-gold font-heading">
                After Tmp
              </span>
              <span
                className={`font-mono text-lg font-bold ${
                  previewTmpHp < combatant.tmpHp
                    ? "text-dnd-blood-bright"
                    : "text-dnd-parchment"
                }`}
              >
                {previewTmpHp}
              </span>
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        <DialogClose disabled={localPending}>Cancel</DialogClose>
        <Button
          onClick={handleApply}
          disabled={localPending || amount <= 0}
          className={
            activeTab === "damage"
              ? "bg-dnd-blood hover:bg-dnd-blood/90"
              : "bg-emerald-600 hover:bg-emerald-600/90"
          }
        >
          {localPending
            ? `${activeTab === "damage" ? "Damaging" : "Healing"}...`
            : activeTab === "damage"
              ? "Damage"
              : "Healing"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function DamageHealDialog({
  combatant,
  onApply,
  isPending,
  children,
  defaultTab,
}: DamageHealDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold">
            Apply Damage or Healing
          </DialogTitle>
          <DialogDescription>
            Set the damage or healing amount.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <DamageHealForm
            combatant={combatant}
            onApply={onApply}
            isPending={isPending}
            onClose={() => setOpen(false)}
            defaultTab={defaultTab}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
