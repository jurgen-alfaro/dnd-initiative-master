"use client";

import { forwardRef } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Sword, Shield, Heart, Trash2, Activity } from "lucide-react";
import type { Combatant, Condition } from "@/app/lib/types";
import StatEditDialog from "@/app/components/StatEditDialog";
import NameTypeEditDialog from "@/app/components/NameTypeEditDialog";
import DamageHealDialog from "@/app/components/DamageHealDialog";
import ConditionsEditDialog from "@/app/components/ConditionsEditDialog";
import ConditionDescriptionDialog from "@/app/components/ConditionDescriptionDialog";
import {
  CONDITION_ICONS,
  CONDITION_COLORS,
} from "@/app/lib/condition-icons";

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
  onDelete: (id: number) => void;
  onConditionsChange: (id: number, conditions: Condition[]) => Promise<void>;
}

const CombatantCard = forwardRef<HTMLDivElement, CombatantCardProps>(
  (
    {
      combatant,
      index,
      isDm,
      isPending,
      currentTurnIndex,
      onStatChange,
      onInfoChange,
      onDamageHeal,
      onDelete,
      onConditionsChange,
    },
    ref,
  ) => {
    return (
      <Card
        ref={ref}
        className={`
        p-4 border-l-4 transition-all duration-300 relative overflow-hidden gap-2
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

        {/* Conditions Display */}
        {combatant.conditions && combatant.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {combatant.conditions.slice(0, 4).map((condition) => {
              const Icon = CONDITION_ICONS[condition];
              const colorClass = CONDITION_COLORS[condition];
              return (
                <ConditionDescriptionDialog key={condition} condition={condition}>
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded bg-dnd-parchment/10 border border-dnd-gold/20 hover:bg-dnd-parchment/15 hover:border-dnd-gold/30 transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    <Icon size={12} className={colorClass} />
                    <span className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground">
                      {condition.slice(0, 3)}
                    </span>
                  </button>
                </ConditionDescriptionDialog>
              );
            })}
            {combatant.conditions.length > 4 && (
              <div className="flex items-center px-2 py-1 rounded bg-dnd-parchment/10 border border-dnd-gold/20">
                <span className="text-[10px] font-heading text-muted-foreground">
                  +{combatant.conditions.length - 4}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stat display: AC, HP, Tmp HP */}
        <div className="flex w-full items-center justify-center gap-3 pt-2 border-t border-dnd-gold/10">
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
                <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parch+ment">
                  {combatant.ac}
                </div>
              </button>
            </StatEditDialog>
          ) : (
            <>
              {combatant.type === "player" && (
                <div className="dnd-stat-block flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-dnd-gold-dim font-heading mb-1">
                    AC
                  </span>
                  <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                    {combatant.ac}
                  </div>
                </div>
              )}
            </>
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
            <>
              {combatant.type === "player" && (
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
            </>
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
            <>
              {combatant.type === "player" && (
                <div className="dnd-stat-block flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-dnd-gold font-heading mb-1">
                    Tmp
                  </span>
                  <div className="w-16 text-center font-mono text-xl font-bold text-dnd-parchment">
                    {combatant.tmpHp}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Damage/Heal buttons (DM only) */}
        {isDm && (
          <div className="flex justify-center gap-2 pt-2 border-t border-dnd-gold/10">
            {/* Damage button */}
            <DamageHealDialog
              combatant={combatant}
              onApply={onDamageHeal}
              isPending={isPending}
              defaultTab="damage"
            >
              <button className="group relative flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dnd-gold/20 hover:border-dnd-gold/40 transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-md hover:shadow-lg bg-dnd-blood/15 hover:bg-dnd-blood/25">
                <Sword size={15} className="text-dnd-blood-bright" />
                <span className="text-xs font-heading font-bold tracking-widest text-dnd-blood-bright uppercase">
                  Dmg
                </span>
              </button>
            </DamageHealDialog>

            {/* Heal button */}
            <DamageHealDialog
              combatant={combatant}
              onApply={onDamageHeal}
              isPending={isPending}
              defaultTab="healing"
            >
              <button className="group relative flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dnd-gold/20 hover:border-dnd-gold/40 transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-md hover:shadow-lg bg-emerald-900/20 hover:bg-emerald-800/30">
                <Heart size={15} className="text-emerald-400" />
                <span className="text-xs font-heading font-bold tracking-widest text-emerald-400 uppercase">
                  Heal
                </span>
              </button>
            </DamageHealDialog>

            {/* Conditions button */}
            <ConditionsEditDialog
              combatant={combatant}
              onSave={onConditionsChange}
              isPending={isPending}
            >
              <button className="group relative flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dnd-gold/20 hover:border-dnd-gold/40 transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-md hover:shadow-lg bg-indigo-900/20 hover:bg-indigo-800/30">
                <Activity size={15} className="text-indigo-400" />
                <span className="text-xs font-heading font-bold tracking-widest text-indigo-400 uppercase">
                  Status
                </span>
              </button>
            </ConditionsEditDialog>
          </div>
        )}

        {/* Delete button (DM only) */}
        {isDm && (
          <div className="flex justify-center">
            <button
              onClick={() => onDelete(combatant.id)}
              disabled={isPending}
              className="group flex items-center gap-2 px-4 py-2 rounded-md border border-dnd-blood/30 bg-dnd-blood/5 hover:bg-dnd-blood/15 hover:border-dnd-blood/50 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2
                size={14}
                className="text-dnd-blood-bright group-hover:text-dnd-blood-bright/80"
              />
              <span className="text-xs font-heading font-semibold tracking-wider text-dnd-blood-bright uppercase">
                Remove
              </span>
            </button>
          </div>
        )}
      </Card>
    );
  },
);

CombatantCard.displayName = "CombatantCard";

export default CombatantCard;
