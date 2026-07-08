"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";
import type { Condition } from "@/app/lib/types";
import { CONDITION_DESCRIPTIONS } from "@/app/lib/condition-descriptions";
import { CONDITION_ICONS, CONDITION_COLORS } from "@/app/lib/condition-icons";

interface ConditionDescriptionDialogProps {
  condition: Condition;
  children: React.ReactNode;
  onRemove?: () => void;
  isPending?: boolean;
}

export default function ConditionDescriptionDialog({
  condition,
  children,
  onRemove,
  isPending,
}: ConditionDescriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const Icon = CONDITION_ICONS[condition];
  const colorClass = CONDITION_COLORS[condition];
  const description = CONDITION_DESCRIPTIONS[condition];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Icon className={colorClass} size={20} />
            {condition}
          </DialogTitle>
          <DialogDescription className="text-sm whitespace-pre-line leading-relaxed text-left max-h-[400px] overflow-y-auto pr-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {onRemove && (
            <button
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-dnd-blood/30 bg-dnd-blood/5 hover:bg-dnd-blood/15 hover:border-dnd-blood/50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-heading uppercase tracking-wider text-dnd-blood-bright"
              aria-label={`Remove ${condition}`}
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
