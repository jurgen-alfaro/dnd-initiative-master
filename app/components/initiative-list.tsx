"use client";

import { useTransition } from "react";
import { updateCombatantStat } from "@/app/server/actions";
import type { Combatant } from "@/app/lib/types";
import CombatantCard from "@/app/components/combatant-card";
import AddCombatantToPartyDialog from "./ui/AddCombatantToPartyDialog";

interface InitiativeListProps {
  data: Combatant[];
  partyCode: string;
  isDm: boolean;
}

export default function InitiativeList({
  data,
  partyCode,
  isDm,
}: InitiativeListProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatChange = (id: number, field: "hp" | "ac" | "tmpHp", val: string) => {
    const numVal = parseInt(val);
    if (isNaN(numVal)) return;

    startTransition(async () => {
      await updateCombatantStat(id, field, numVal, partyCode);
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
          onStatChange={handleStatChange}
        />
      ))}

      {data.length === 0 ? (
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
      ) : (
        <AddCombatantToPartyDialog floating />
      )}
    </div>
  );
}
