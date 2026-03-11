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
import type { Condition } from "@/app/lib/types";
import { CONDITION_DESCRIPTIONS } from "@/app/lib/condition-descriptions";
import { CONDITION_ICONS, CONDITION_COLORS } from "@/app/lib/condition-icons";

interface ConditionDescriptionDialogProps {
  condition: Condition;
  children: React.ReactNode;
}

export default function ConditionDescriptionDialog({
  condition,
  children,
}: ConditionDescriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const Icon = CONDITION_ICONS[condition];
  const colorClass = CONDITION_COLORS[condition];
  const description = CONDITION_DESCRIPTIONS[condition];

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Icon className={colorClass} size={20} />
            {condition}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm whitespace-pre-line leading-relaxed text-left max-h-[400px] overflow-y-auto pr-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
