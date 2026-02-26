"use client";

import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Sword, Shield, Heart } from "lucide-react";
import type { Combatant } from "@/app/lib/types";
import StatEditDialog from "@/app/components/stat-edit-dialog";
import NameTypeEditDialog from "@/app/components/name-type-edit-dialog";
import DamageHealDialog from "@/app/components/damage-heal-dialog";

interface CombatantCardProps {
  combatant: Combatant;
  index: number;
  isDm: boolean;
  isPending: boolean;
  currentTurnIndex: number;
  onStatChange: (
    id: number,
    field: "hp" | "ac" | "tmpHp" | "maxHp" | "initiative",
    val: string,
  ) => Promise<void>;
  onInfoChange: (
    id: number,
    name: string,
    type: "player" | "enemy",
  ) => Promise<void>;
  onDamageHeal: (
    id: number,
    amount: number,
    type: "damage" | "healing",
  ) => void;
}

export default function CombatantCard({
  combatant,
  index,
  isDm,
  isPending,
  currentTurnIndex,
  onStatChange,
  onInfoChange,
  onDamageHeal,
}: CombatantCardProps) {
  return (
    <Card
      className={`
        p-4 border-l-4 transition-all duration-300 relative overflow-hidden
        ${index === currentTurnIndex ? "dnd-active-glow scale-[1.03] z-10" : "dnd-card-ornate"}
        ${
          combatant.type === "enemy"
            ? `bg-dnd-blood/8 border-l-dnd-blood-bright ${index !== currentTurnIndex ? "dnd-enemy-menace" : ""}`
            : `bg-dnd-hero-blue/6 border-l-dnd-hero-blue-bright ${index !== currentTurnIndex ? "dnd-hero-aura" : ""}`
        }
        ${index === currentTurnIndex && combatant.type === "enemy" ? "bg-dnd-blood/12" : ""}
        ${index === currentTurnIndex && combatant.type === "player" ? "bg-dnd-hero-blue/10" : ""}
      `}
    >
      {/* Turn position indicator */}
      <div className="absolute top-2 right-3 text-xs font-heading text-dnd-gold-dim/60 tracking-wider">
        {index === currentTurnIndex ? (
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
        {isDm ? (
          <StatEditDialog
            combatant={combatant}
            statType="initiative"
            onSave={onStatChange}
            isPending={isPending}
          >
            <button
              className={`
                flex flex-col items-center justify-center w-16 h-16 rounded-full font-heading font-bold cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-dnd-gold/40 active:scale-95
                ${
                  index === currentTurnIndex
                    ? "dnd-initiative-circle-active text-dnd-gold-bright text-xl"
                    : "dnd-initiative-circle text-dnd-parchment-dim text-lg"
                }
              `}
            >
              {combatant.initiative}
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans font-normal">
                Init
              </span>
            </button>
          </StatEditDialog>
        ) : (
          <div
            className={`
              flex flex-col items-center justify-center w-16 h-16 rounded-full font-heading font-bold
              ${
                index === currentTurnIndex
                  ? "dnd-initiative-circle-active text-dnd-gold-bright text-xl"
                  : "dnd-initiative-circle text-dnd-parchment-dim text-lg"
              }
            `}
          >
            {combatant.initiative}
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans font-normal">
              Init
            </span>
          </div>
        )}

        {/* Name and type badge */}
        <div className="w-full flex justify-between items-center">
          {isDm ? (
            <NameTypeEditDialog
              combatant={combatant}
              onSave={onInfoChange}
              isPending={isPending}
            >
              <button
                className={`
                  text-lg font-heading font-bold flex items-center gap-2
                  cursor-pointer transition-all duration-200
                  hover:text-dnd-gold-bright active:scale-95
                  ${index === currentTurnIndex ? "text-dnd-gold" : "text-foreground hover:text-dnd-gold/80"}
                `}
              >
                {combatant.name}
              </button>
            </NameTypeEditDialog>
          ) : (
            <h3
              className={`
                text-lg font-heading font-bold flex items-center gap-2
                ${index === currentTurnIndex ? "text-dnd-gold" : "text-foreground"}
              `}
            >
              {combatant.name}
            </h3>
          )}
          <Badge
            variant="outline"
            className={`
              text-xs font-heading tracking-wider border
              ${
                combatant.type === "enemy"
                  ? "border-dnd-blood/40 text-dnd-blood-bright bg-dnd-blood/10"
                  : "border-dnd-hero-blue/40 text-dnd-hero-blue-bright bg-dnd-hero-blue/10"
              }
            `}
          >
            {combatant.type === "enemy" ? "Enemy" : "Hero"}
            {combatant.type === "enemy" ? (
              <Sword size={14} className="text-dnd-blood-bright" />
            ) : (
              <Shield size={14} className="text-dnd-hero-blue-bright" />
            )}
          </Badge>
        </div>
      </div>

      {/* Stat display: AC, HP, Tmp HP */}
      <div className="flex w-full justify-center gap-3 mt-3 pt-3 border-t border-dnd-gold/10">
        {isDm ? (
          <StatEditDialog
            combatant={combatant}
            statType="ac"
            onSave={onStatChange}
            isPending={isPending}
          >
            <button className="dnd-stat-block dnd-stat-block-interactive flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-dnd-gold-dim font-heading mb-1">
                AC
              </span>
              <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                {combatant.ac}
              </div>
            </button>
          </StatEditDialog>
        ) : (
          <div className="dnd-stat-block flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-dnd-gold-dim font-heading mb-1">
              AC
            </span>
            <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
              {combatant.ac}
            </div>
          </div>
        )}

        {isDm ? (
          <StatEditDialog
            combatant={combatant}
            statType="hp"
            onSave={onStatChange}
            isPending={isPending}
          >
            <button className="dnd-stat-block dnd-stat-block-interactive flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-dnd-blood-bright font-heading mb-1">
                HP
              </span>
              <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                {combatant.hp}
                <span className="text-sm text-muted-foreground">
                  /{combatant.maxHp}
                </span>
              </div>
            </button>
          </StatEditDialog>
        ) : (
          <div className="dnd-stat-block flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-dnd-blood-bright font-heading mb-1">
              HP
            </span>
            <div className="text-center font-mono text-xl font-bold text-dnd-parchment">
              {combatant.hp}
              <span className="text-sm text-muted-foreground">
                /{combatant.maxHp}
              </span>
            </div>
          </div>
        )}

        {isDm ? (
          <StatEditDialog
            combatant={combatant}
            statType="tmpHp"
            onSave={onStatChange}
            isPending={isPending}
          >
            <button className="dnd-stat-block dnd-stat-block-interactive flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-widest text-dnd-gold font-heading mb-1">
                Tmp
              </span>
              <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                {combatant.tmpHp}
              </div>
            </button>
          </StatEditDialog>
        ) : (
          <div className="dnd-stat-block flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-dnd-gold font-heading mb-1">
              Tmp
            </span>
            <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
              {combatant.tmpHp}
            </div>
          </div>
        )}
      </div>

      {/* Damage/Heal button (DM only) */}
      {isDm && (
        <div className="flex justify-center mt-2 pt-2 border-t border-dnd-gold/10">
          <DamageHealDialog
            combatant={combatant}
            onApply={onDamageHeal}
            isPending={isPending}
          >
            <button className="group relative flex items-stretch rounded-lg overflow-hidden border border-dnd-gold/20 hover:border-dnd-gold/40 transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-md hover:shadow-lg">
              {/* Damage half */}
              <span className="flex items-center gap-1.5 px-4 py-2 bg-dnd-blood/15 hover:bg-dnd-blood/25 transition-colors duration-200">
                <Sword size={15} className="text-dnd-blood-bright" />
                <span className="text-xs font-heading font-bold tracking-widest text-dnd-blood-bright uppercase">
                  Dmg
                </span>
              </span>
              {/* Divider */}
              <span className="w-px bg-dnd-gold/20 self-stretch" />
              {/* Heal half */}
              <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900/20 hover:bg-emerald-800/30 transition-colors duration-200">
                <Heart size={15} className="text-emerald-400" />
                <span className="text-xs font-heading font-bold tracking-widest text-emerald-400 uppercase">
                  Heal
                </span>
              </span>
            </button>
          </DamageHealDialog>
        </div>
      )}
    </Card>
  );
}
