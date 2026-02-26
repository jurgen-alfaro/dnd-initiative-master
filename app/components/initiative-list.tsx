"use client";

import { useTransition } from "react";
import {
  updateCombatantStat,
  updateCombatantInfo,
  applyDamageOrHealing,
} from "@/app/server/actions";
import type { Combatant } from "@/app/lib/types";
import CombatantCard from "@/app/components/combatant-card";
import AddCombatantToPartyDialog from "./ui/AddCombatantToPartyDialog";

interface InitiativeListProps {
  data: Combatant[];
  partyCode: string;
  isDm: boolean;
  currentTurnIndex: number;
  onDamageHeal?: (
    id: number,
    amount: number,
    type: "damage" | "healing",
  ) => Promise<void>;
}

export default function InitiativeList({
  data,
  partyCode,
  isDm,
  currentTurnIndex,
  onDamageHeal,
}: InitiativeListProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatChange = (
    id: number,
    field: "hp" | "ac" | "tmpHp" | "maxHp" | "initiative",
    val: string,
  ): Promise<void> => {
    const numVal = parseInt(val);
    if (isNaN(numVal)) return Promise.resolve();

    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await updateCombatantStat(id, field, numVal, partyCode);
        resolve();
      });
    });
  };

  const handleInfoChange = (
    id: number,
    name: string,
    type: "player" | "enemy",
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await updateCombatantInfo(id, { name, type }, partyCode);
        resolve();
      });
    });
  };

  const handleDamageHeal = async (
    id: number,
    amount: number,
    type: "damage" | "healing",
  ): Promise<void> => {
    // If optimistic function provided, use it; otherwise fallback to direct server action
    if (onDamageHeal) {
      return onDamageHeal(id, amount, type);
    }

    // Fallback for backward compatibility
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        await applyDamageOrHealing(id, amount, type, partyCode);
        resolve();
      });
    });
  };

  return (
    <div className="space-y-3 max-w-2xl mx-auto p-4">
      {data.map((char, index) => (
        <CombatantCard
          key={char.id}
          combatant={char}
          index={index}
          isDm={isDm}
          isPending={isPending}
          currentTurnIndex={currentTurnIndex}
          onStatChange={handleStatChange}
          onInfoChange={handleInfoChange}
          onDamageHeal={handleDamageHeal}
        />
      ))}

      {data.length === 0 && (
        <div className="flex flex-col items-center py-16">
          <div className="text-6xl mb-6 opacity-30">&#x2694;&#xFE0F;</div>
          <h3 className="font-heading text-xl text-dnd-gold-dim mb-2">
            No Combatants Yet
          </h3>
          <p className="text-center text-sm text-muted-foreground max-w-xs mb-6">
            The battlefield lies silent. Add combatants to begin tracking
            initiative order.
          </p>
          <AddCombatantToPartyDialog />
        </div>
      )}
    </div>
  );
}
