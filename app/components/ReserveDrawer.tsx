"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { EyeOff, Shield, Skull, Swords, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import type { Combatant } from "@/app/lib/types";

interface ReserveDrawerProps {
  combatants: Combatant[];
  onReveal: (combatantIds: number[]) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * DM-only roster of combatants prepared in advance but not yet in the fight.
 * Several can be picked at once and dropped into initiative in a single action,
 * which is what makes staged waves of enemies cheap to run.
 */
export default function ReserveDrawer({
  combatants,
  onReveal,
  open,
  onOpenChange,
}: ReserveDrawerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isRevealing, setIsRevealing] = useState(false);

  const sorted = useMemo(
    () => [...combatants].sort((a, b) => b.initiative - a.initiative),
    [combatants],
  );

  // Start from a clean selection every time the drawer opens
  useEffect(() => {
    if (open) setSelectedIds(new Set());
  }, [open]);

  // Drop ids that left the reserve (revealed here or from another session)
  useEffect(() => {
    setSelectedIds((prev) => {
      const stillHere = new Set(
        [...prev].filter((id) => combatants.some((c) => c.id === id)),
      );
      return stillHere.size === prev.size ? prev : stillHere;
    });
  }, [combatants]);

  // Close on Escape and lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  const handleToggleCombatant = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === sorted.length
        ? new Set()
        : new Set(sorted.map((c) => c.id)),
    );
  };

  const handleReveal = async () => {
    if (selectedIds.size === 0) return;
    setIsRevealing(true);
    try {
      await onReveal(Array.from(selectedIds));
      onOpenChange(false);
    } finally {
      setIsRevealing(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <aside className="flex h-full w-full max-w-md flex-col bg-card dnd-card-ornate dnd-parchment-texture shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dnd-gold/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <EyeOff className="text-dnd-gold" size={20} />
            <h2 className="font-heading text-lg font-bold tracking-wide text-dnd-gold">
              Reserve
            </h2>
            {sorted.length > 0 && (
              <Badge
                variant="outline"
                className="border-dnd-gold/40 text-dnd-gold"
              >
                {sorted.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-muted-foreground hover:text-dnd-parchment"
          >
            <X size={20} />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <EyeOff className="mb-4 text-dnd-gold-dim/40" size={40} />
              <p className="max-w-xs text-center text-sm text-muted-foreground">
                Nobody is waiting in the wings. Use the eye button on a
                combatant card to prepare it here, out of the players&apos;
                sight.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Pick who joins the fight
                </p>
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-xs font-heading uppercase tracking-wider text-dnd-gold transition-colors hover:text-dnd-gold-bright"
                >
                  {selectedIds.size === sorted.length
                    ? "Clear all"
                    : "Select all"}
                </button>
              </div>

              <ul className="flex flex-col gap-2">
                {sorted.map((combatant) => (
                  <li key={combatant.id}>
                    {/* The label wraps the checkbox instead of pointing at it
                        with htmlFor, so the whole row is one tap target and the
                        click is never forwarded twice */}
                    <Label
                      className={`
                        relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 pr-20 transition-colors
                        ${
                          selectedIds.has(combatant.id)
                            ? "border-dnd-gold/50 bg-dnd-gold/10"
                            : "border-dnd-gold/15 bg-dnd-parchment/5 hover:border-dnd-gold/30"
                        }
                      `}
                    >
                      <Badge
                        variant="outline"
                        className={`
                          absolute top-2 right-2 shrink-0 text-[10px] font-heading tracking-wider
                          ${
                            combatant.type === "enemy"
                              ? "border-dnd-blood/40 bg-dnd-blood/10 text-dnd-blood-bright"
                              : "border-dnd-hero-blue/40 bg-dnd-hero-blue/10 text-dnd-hero-blue-bright"
                          }
                        `}
                      >
                        {combatant.type === "enemy" ? (
                          <Skull size={11} />
                        ) : (
                          <Shield size={11} />
                        )}
                        {combatant.type === "enemy" ? "Enemy" : "Hero"}
                      </Badge>

                      <Checkbox
                        id={`reserve-combatant-${combatant.id}`}
                        checked={selectedIds.has(combatant.id)}
                        onCheckedChange={() =>
                          handleToggleCombatant(combatant.id)
                        }
                        disabled={isRevealing}
                      />

                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-heading text-sm font-bold text-dnd-parchment">
                          {combatant.name}
                        </span>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Init {combatant.initiative} · {combatant.maxHp} HP ·
                          AC {combatant.ac}
                        </p>
                      </div>
                    </Label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        {sorted.length > 0 && (
          <div className="border-t border-dnd-gold/20 px-5 py-4">
            <Button
              onClick={handleReveal}
              disabled={selectedIds.size === 0 || isRevealing}
              className="w-full cursor-pointer gap-2 font-heading tracking-wider"
            >
              <Swords size={16} />
              {isRevealing
                ? "Adding..."
                : selectedIds.size <= 1
                  ? "Add to combat"
                  : `Add ${selectedIds.size} to combat`}
            </Button>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
