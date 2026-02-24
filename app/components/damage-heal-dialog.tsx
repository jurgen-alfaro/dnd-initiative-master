"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { Combatant } from "@/app/lib/types";

type ActionType = "damage" | "healing";

interface DamageHealDialogProps {
  combatant: Combatant;
  onApply: (id: number, amount: number, type: ActionType) => void;
  isPending: boolean;
  children: React.ReactNode;
}

// Valores rápidos para daño y curación
const QUICK_VALUES = [1, 5, 20];

function DamageHealForm({
  combatant,
  onApply,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  onApply: DamageHealDialogProps["onApply"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ActionType>("damage");
  const [amount, setAmount] = useState(0);

  // Calcular preview del resultado
  const calculatePreview = () => {
    let previewHp = combatant.hp;
    let previewTmpHp = combatant.tmpHp;

    if (activeTab === "damage" && amount > 0) {
      // Lógica de daño D&D 5e
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
      // Lógica de curación
      previewHp = Math.min(combatant.maxHp, previewHp + amount);
    }

    return { previewHp, previewTmpHp };
  };

  const { previewHp, previewTmpHp } = calculatePreview();

  const handleQuickAdjust = (value: number) => {
    setAmount((prev) => Math.max(0, prev + value));
  };

  const handleApply = () => {
    if (amount <= 0) return;
    onApply(combatant.id, amount, activeTab);
    onClose();
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

      {/* Botones de ajuste rápido */}
      <div className="grid grid-cols-3 gap-2">
        {quickValues.map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(value)}
            disabled={isPending}
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

      {/* Preview del resultado */}
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

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button
          onClick={handleApply}
          disabled={isPending || amount <= 0}
          className={
            activeTab === "damage"
              ? "bg-dnd-blood hover:bg-dnd-blood/90"
              : "bg-emerald-600 hover:bg-emerald-600/90"
          }
        >
          Apply {activeTab === "damage" ? "Damage" : "Healing"}
        </Button>
      </AlertDialogFooter>
    </div>
  );
}

export default function DamageHealDialog({
  combatant,
  onApply,
  isPending,
  children,
}: DamageHealDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold">
            Apply Damage or Healing
          </AlertDialogTitle>
          <AlertDialogDescription>
            Set the damage or healing amount.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {open && (
          <DamageHealForm
            combatant={combatant}
            onApply={onApply}
            isPending={isPending}
            onClose={() => setOpen(false)}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
