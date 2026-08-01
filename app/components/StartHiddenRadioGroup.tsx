"use client";

import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

type StartHiddenRadioGroupProps = {
  name?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

const baseClasses =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium cursor-pointer transition-all select-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-focus-visible:border-ring";

/**
 * Chooses whether a new combatant joins the fight right away or waits in the
 * reserve, hidden from the players. Defaults to joining, which is the common
 * case; preparing ahead is the deliberate choice.
 */
const StartHiddenRadioGroup = ({
  name = "isHidden",
  value,
  onChange,
}: StartHiddenRadioGroupProps) => {
  const radioProps = (hidden: boolean) => ({
    type: "radio" as const,
    name,
    value: String(hidden),
    checked: value === hidden,
    onChange: () => onChange(hidden),
    className: "sr-only",
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      <label
        className={cn(
          baseClasses,
          "border-dnd-gold/30 text-dnd-gold-dim hover:bg-dnd-gold/10",
          "has-checked:bg-dnd-gold has-checked:text-black has-checked:hover:bg-dnd-gold/90",
        )}
      >
        <input {...radioProps(false)} />
        <Eye size={14} /> No
      </label>
      <label
        className={cn(
          baseClasses,
          "border-dnd-gold/30 text-dnd-gold-dim hover:bg-dnd-gold/10",
          "has-checked:bg-dnd-gold has-checked:text-black has-checked:hover:bg-dnd-gold/90",
        )}
      >
        <input {...radioProps(true)} />
        <EyeOff size={14} /> Hidden
      </label>
    </div>
  );
};

export default StartHiddenRadioGroup;
