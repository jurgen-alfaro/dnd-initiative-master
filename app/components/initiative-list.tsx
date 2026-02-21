"use client";

import { useTransition } from "react";
import { updateInitiative } from "@/app/server/actions";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Sword, Shield } from "lucide-react";
import AddCombatantToPartyDialog from "./ui/AddCombatantToPartyDialog";

type Combatant = {
  id: number;
  name: string;
  initiative: number;
  ac?: number;
  type: "player" | "enemy";
};

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

  const handleInitiativeChange = (id: number, val: string) => {
    const numVal = parseInt(val);
    if (isNaN(numVal)) return;

    startTransition(async () => {
      await updateInitiative(id, numVal, partyCode);
    });
  };

  return (
    <div className="space-y-3 max-w-2xl mx-auto p-4">
      {data.map((char, index) => (
        <Card
          key={char.id}
          className={`
            p-4 border-l-4 transition-all duration-300 relative overflow-hidden
            ${
              index === 0
                ? "dnd-active-glow scale-[1.03] z-10"
                : "dnd-card-ornate"
            }
            ${
              char.type === "enemy"
                ? `bg-dnd-blood/8 border-l-dnd-blood-bright ${index !== 0 ? "dnd-enemy-menace" : ""}`
                : `bg-dnd-hero-blue/6 border-l-dnd-hero-blue-bright ${index !== 0 ? "dnd-hero-aura" : ""}`
            }
            ${index === 0 && char.type === "enemy" ? "bg-dnd-blood/12" : ""}
            ${index === 0 && char.type === "player" ? "bg-dnd-hero-blue/10" : ""}
          `}
        >
          {/* Turn position indicator */}
          <div className="absolute top-2 right-3 text-xs font-heading text-dnd-gold-dim/60 tracking-wider">
            {index === 0 ? (
              <span className="text-dnd-gold font-bold text-sm flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-dnd-gold animate-pulse" />
                ACTIVE
              </span>
            ) : (
              <span>#{index + 1}</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            {/* Initiative circle */}
            <div
              className={`
                flex flex-col items-center justify-center w-16 h-16 rounded-full font-heading font-bold
                ${
                  index === 0
                    ? "dnd-initiative-circle-active text-dnd-gold-bright text-xl"
                    : "dnd-initiative-circle text-dnd-parchment-dim text-lg"
                }
              `}
            >
              {char.initiative}
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans font-normal">
                Init
              </span>
            </div>

            {/* Name and type badge */}
            <div className="w-full flex justify-between items-center">
              <h3
                className={`
                  text-lg font-heading font-bold flex items-center gap-2
                  ${index === 0 ? "text-dnd-gold" : "text-foreground"}
                `}
              >
                {char.name}
              </h3>
              <Badge
                variant="outline"
                className={`
                  text-xs font-heading tracking-wider border
                  ${
                    char.type === "enemy"
                      ? "border-dnd-blood/40 text-dnd-blood-bright bg-dnd-blood/10"
                      : "border-dnd-hero-blue/40 text-dnd-hero-blue-bright bg-dnd-hero-blue/10"
                  }
                `}
              >
                {char.type === "enemy" ? "Enemy" : "Hero"}
                {char.type === "enemy" ? (
                  <Sword size={14} className="text-dnd-blood-bright" />
                ) : (
                  <Shield size={14} className="text-dnd-hero-blue-bright" />
                )}
              </Badge>
            </div>
          </div>

          {/* Stat display: AC, HP, Tmp HP */}
          <div className="flex w-full justify-center gap-3 mt-3 pt-3 border-t border-dnd-gold/10">
            <div className="dnd-stat-block flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-dnd-gold-dim font-heading mb-1">
                AC
              </span>
              {isDm ? (
                <Input
                  type="number"
                  defaultValue={char.ac}
                  className="w-16 h-8 text-center font-mono text-base font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30 focus-visible:border-dnd-gold/40"
                  onBlur={(e) =>
                    handleInitiativeChange(char.id, e.target.value)
                  }
                  disabled={isPending}
                />
              ) : (
                <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                  {char.initiative}
                </div>
              )}
            </div>
            <div className="dnd-stat-block flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-dnd-blood-bright font-heading mb-1">
                HP
              </span>
              {isDm ? (
                <Input
                  type="number"
                  defaultValue={char.ac}
                  className="w-16 h-8 text-center font-mono text-base font-bold bg-transparent border-dnd-blood/20 focus-visible:ring-dnd-blood/30 focus-visible:border-dnd-blood/40"
                  onBlur={(e) =>
                    handleInitiativeChange(char.id, e.target.value)
                  }
                  disabled={isPending}
                />
              ) : (
                <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                  {char.initiative}
                </div>
              )}
            </div>
            <div className="dnd-stat-block flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-dnd-gold font-heading mb-1">
                Tmp
              </span>
              {isDm ? (
                <Input
                  type="number"
                  defaultValue={char.initiative}
                  className="w-16 h-8 text-center font-mono text-base font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30 focus-visible:border-dnd-gold/40"
                  onBlur={(e) =>
                    handleInitiativeChange(char.id, e.target.value)
                  }
                  disabled={isPending}
                />
              ) : (
                <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                  {char.initiative}
                </div>
              )}
            </div>
          </div>
        </Card>
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
