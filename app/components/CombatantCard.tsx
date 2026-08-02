"use client";

import { forwardRef } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Sword,
  Shield,
  Heart,
  Trash2,
  Activity,
  ShieldPlus,
  Skull,
  Biohazard,
  Eye,
  Plus,
} from "lucide-react";
import type { Combatant, Condition } from "@/app/lib/types";
import StatEditDialog from "@/app/components/StatEditDialog";
import NameEditDialog from "@/app/components/NameEditDialog";
import TypeEditDialog from "@/app/components/TypeEditDialog";
import DamageHealDialog from "@/app/components/DamageHealDialog";
import ConditionsEditDialog from "@/app/components/ConditionsEditDialog";
import ConditionDescriptionDialog from "@/app/components/ConditionDescriptionDialog";
import BuffsDetailDialog from "@/app/components/BuffsDetailDialog";
import AddAmmoDialog from "@/app/components/AddAmmoDialog";
import AmmoEditDialog from "@/app/components/AmmoEditDialog";
import { CONDITION_ICONS, CONDITION_COLORS } from "@/app/lib/condition-icons";
import { AMMO_GLYPH, formatAmmoCount } from "@/app/lib/ammo";

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
  onHide: (id: number) => void;
  onConditionsChange: (id: number, conditions: Condition[]) => Promise<void>;
  onRemoveBuff: (combatantId: number, buffId: string) => Promise<void>;
  onAddAmmo: (
    combatantId: number,
    name: string,
    count: number,
    max: number | null,
  ) => Promise<void>;
  onUpdateAmmo: (
    combatantId: number,
    ammoId: string,
    name: string,
    count: number,
    max: number | null,
  ) => Promise<void>;
  onRemoveAmmo: (combatantId: number, ammoId: string) => Promise<void>;
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
      onHide,
      onConditionsChange,
      onRemoveBuff,
      onAddAmmo,
      onUpdateAmmo,
      onRemoveAmmo,
    },
    ref,
  ) => {
    const buffs = combatant.buffs ?? [];
    const ammo = combatant.ammo ?? [];
    const hasConditions =
      combatant.conditions !== undefined && combatant.conditions.length > 0;
    // An enemy's ammo is as secret as its AC and HP, and the "Ammo" heading
    // doubles as the DM's add button so it stays up even with nothing tracked.
    const showAmmo = isDm || (combatant.type === "player" && ammo.length > 0);
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
              <NameEditDialog
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
              </NameEditDialog>
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
            <div className="flex shrink-0 items-center gap-2">
              {isDm ? (
                <TypeEditDialog
                  combatant={combatant}
                  onSave={onInfoChange}
                  isPending={isPending}
                >
                  <Badge
                    asChild
                    variant="outline"
                    className={`
                  p-1.5 font-heading border rounded-full
                  cursor-pointer transition-all duration-200
                  hover:border-dnd-gold/40 active:scale-95
                  ${
                    combatant.type === "enemy"
                      ? "border-dnd-blood/40 text-dnd-blood-bright bg-dnd-blood/10"
                      : "border-dnd-hero-blue/40 text-dnd-hero-blue-bright bg-dnd-hero-blue/10"
                  }
                `}
                  >
                    <button
                      title={combatant.type === "enemy" ? "Enemy" : "Hero"}
                    >
                      {combatant.type === "enemy" ? (
                        <Skull size={14} className="text-dnd-blood-bright" />
                      ) : (
                        <Shield
                          size={14}
                          className="text-dnd-hero-blue-bright"
                        />
                      )}
                      <span className="sr-only">
                        {combatant.type === "enemy" ? "Enemy" : "Hero"}
                      </span>
                    </button>
                  </Badge>
                </TypeEditDialog>
              ) : (
                <Badge
                  variant="outline"
                  title={combatant.type === "enemy" ? "Enemy" : "Hero"}
                  className={`
                p-1.5 font-heading border rounded-full
                ${
                  combatant.type === "enemy"
                    ? "border-dnd-blood/40 text-dnd-blood-bright bg-dnd-blood/10"
                    : "border-dnd-hero-blue/40 text-dnd-hero-blue-bright bg-dnd-hero-blue/10"
                }
              `}
                >
                  {combatant.type === "enemy" ? (
                    <Skull size={14} className="text-dnd-blood-bright" />
                  ) : (
                    <Shield size={14} className="text-dnd-hero-blue-bright" />
                  )}
                  <span className="sr-only">
                    {combatant.type === "enemy" ? "Enemy" : "Hero"}
                  </span>
                </Badge>
              )}

              {/* Send to reserve (DM only): keeps the combatant prepared but out
                of the players' sight and out of the turn order */}
              {isDm && (
                <button
                  type="button"
                  onClick={() => onHide(combatant.id)}
                  disabled={isPending}
                  title="Hide combatant"
                  className="rounded-md p-1.5 text-dnd-gold-dim transition-all duration-200 hover:bg-dnd-gold/10 hover:text-dnd-gold-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye size={16} />
                  <span className="sr-only">Hide {combatant.name}</span>
                </button>
              )}

              {/* Delete button (DM only) */}
              {isDm && (
                <button
                  type="button"
                  onClick={() => onDelete(combatant.id)}
                  disabled={isPending}
                  title="Remove combatant"
                  className="rounded-md p-1.5 text-dnd-blood-bright/80 transition-all duration-200 hover:bg-dnd-blood/10 hover:text-dnd-blood-bright active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  <span className="sr-only">Remove {combatant.name}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Effects on the left, ammo tucked into the free space on the right */}
        {(hasConditions || buffs.length > 0 || showAmmo) && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Conditions Display */}
              {hasConditions && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {combatant.conditions.slice(0, 4).map((condition) => {
                    const Icon = CONDITION_ICONS[condition];
                    const colorClass = CONDITION_COLORS[condition];
                    return (
                      <ConditionDescriptionDialog
                        key={condition}
                        condition={condition}
                        isPending={isPending}
                        onRemove={
                          isDm
                            ? () =>
                                onConditionsChange(
                                  combatant.id,
                                  combatant.conditions.filter(
                                    (c) => c !== condition,
                                  ),
                                )
                            : undefined
                        }
                      >
                        <button className="flex items-center gap-1 px-2 py-1 rounded bg-dnd-parchment/10 border border-dnd-gold/20 hover:bg-dnd-parchment/15 hover:border-dnd-gold/30 transition-all duration-200 cursor-pointer active:scale-95">
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

              {/* Buffs / Debuffs Display (visible to everyone) */}
              {buffs.length > 0 && (
                <BuffsDetailDialog
                  combatant={combatant}
                  isDm={isDm}
                  isPending={isPending}
                  onRemoveBuff={onRemoveBuff}
                >
                  <button className="flex flex-wrap gap-1 pt-2 w-full cursor-pointer">
                    {buffs.slice(0, 4).map((buff) => {
                      const isBuff = buff.kind === "buff";
                      const Icon = isBuff ? ShieldPlus : Biohazard;
                      return (
                        <span
                          key={buff.id}
                          className={`flex items-center gap-1 px-2 py-1 rounded border transition-all duration-200 ${
                            isBuff
                              ? "bg-emerald-900/20 border-emerald-500/30 hover:bg-emerald-900/30"
                              : "bg-dnd-blood/10 border-dnd-blood/30 hover:bg-dnd-blood/20"
                          }`}
                        >
                          <Icon
                            size={12}
                            className={
                              isBuff
                                ? "text-emerald-400"
                                : "text-dnd-blood-bright"
                            }
                          />
                          <span className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground max-w-20 truncate">
                            {buff.name}
                          </span>
                          <span
                            className={`text-[10px] font-heading font-bold ${
                              isBuff
                                ? "text-emerald-400"
                                : "text-dnd-blood-bright"
                            }`}
                          >
                            {buff.remainingRounds}
                          </span>
                        </span>
                      );
                    })}
                    {buffs.length > 4 && (
                      <span className="flex items-center px-2 py-1 rounded bg-dnd-parchment/10 border border-dnd-gold/20">
                        <span className="text-[10px] font-heading text-muted-foreground">
                          +{buffs.length - 4}
                        </span>
                      </span>
                    )}
                  </button>
                </BuffsDetailDialog>
              )}
            </div>

            {/* Ammo: a tiny "Ammo" heading (the DM's add button) over one line
              per ammunition, e.g. "18 virotes". Enemy ammo is DM-only, like
              their AC and HP. */}
            {showAmmo && (
              <div className="flex max-w-[45%] shrink-0 flex-col items-end gap-0.5 pt-2">
                {isDm ? (
                  <AddAmmoDialog
                    combatant={combatant}
                    onAddAmmo={onAddAmmo}
                    isPending={isPending}
                  >
                    <button className="flex items-center gap-0.5 text-[10px] font-heading uppercase tracking-widest text-dnd-gold-dim transition-colors duration-200 hover:text-dnd-gold-bright active:scale-95">
                      Ammo
                      <Plus size={10} />
                    </button>
                  </AddAmmoDialog>
                ) : (
                  <span className="text-[10px] font-heading uppercase tracking-widest text-dnd-gold-dim">
                    Ammo
                  </span>
                )}

                {ammo.map((entry) => {
                  const isEmpty = entry.count === 0;
                  const label = (
                    <>
                      <span aria-hidden>{AMMO_GLYPH}</span>
                      <span
                        className={`font-mono font-bold ${
                          isEmpty
                            ? "text-dnd-blood-bright"
                            : "text-dnd-parchment"
                        }`}
                      >
                        {formatAmmoCount(entry)}
                      </span>
                      <span className="min-w-0 truncate text-muted-foreground">
                        {entry.name}
                      </span>
                    </>
                  );

                  return isDm ? (
                    <AmmoEditDialog
                      key={entry.id}
                      combatant={combatant}
                      ammo={entry}
                      onSave={onUpdateAmmo}
                      onRemove={onRemoveAmmo}
                      isPending={isPending}
                    >
                      <button className="flex max-w-full items-center gap-1 text-[11px] transition-colors duration-200 hover:text-dnd-gold-bright active:scale-95">
                        {label}
                      </button>
                    </AmmoEditDialog>
                  ) : (
                    <span
                      key={entry.id}
                      className="flex max-w-full items-center gap-1 text-[11px]"
                    >
                      {label}
                    </span>
                  );
                })}
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
      </Card>
    );
  },
);

CombatantCard.displayName = "CombatantCard";

export default CombatantCard;
