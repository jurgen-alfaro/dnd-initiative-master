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
import { Sparkles, ShieldPlus, Skull, Trash2 } from "lucide-react";
import type { Buff, Combatant } from "@/app/lib/types";

interface BuffsDetailDialogProps {
  combatant: Combatant;
  isDm: boolean;
  isPending: boolean;
  onRemoveBuff: (combatantId: number, buffId: string) => Promise<void>;
  children: React.ReactNode;
}

export default function BuffsDetailDialog({
  combatant,
  isDm,
  isPending,
  onRemoveBuff,
  children,
}: BuffsDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const buffs = combatant.buffs ?? [];

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {combatant.name}&apos;s Buffs &amp; Debuffs
          </AlertDialogTitle>
          <AlertDialogDescription>
            Active effects and how many rounds remain
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
          {buffs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No active buffs or debuffs
            </p>
          ) : (
            buffs.map((buff: Buff) => {
              const isBuff = buff.kind === "buff";
              return (
                <div
                  key={buff.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                    isBuff
                      ? "border-emerald-500/30 bg-emerald-900/15"
                      : "border-dnd-blood/30 bg-dnd-blood/10"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isBuff ? (
                      <ShieldPlus
                        size={18}
                        className="text-emerald-400 shrink-0"
                      />
                    ) : (
                      <Skull
                        size={18}
                        className="text-dnd-blood-bright shrink-0"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-heading font-bold text-sm truncate text-foreground">
                        {buff.name}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-heading ${
                          isBuff
                            ? "text-emerald-400"
                            : "text-dnd-blood-bright"
                        }`}
                      >
                        {isBuff ? "Buff" : "Debuff"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-heading text-muted-foreground whitespace-nowrap">
                      {buff.remainingRounds}{" "}
                      {buff.remainingRounds === 1 ? "round" : "rounds"}
                    </span>
                    {isDm && (
                      <button
                        onClick={() => onRemoveBuff(combatant.id, buff.id)}
                        disabled={isPending}
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-dnd-blood/30 bg-dnd-blood/5 hover:bg-dnd-blood/15 hover:border-dnd-blood/50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Remove ${buff.name}`}
                      >
                        <Trash2 size={14} className="text-dnd-blood-bright" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
