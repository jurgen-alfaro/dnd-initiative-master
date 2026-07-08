"use client";

import { Shield, Sword } from "lucide-react";

import { cn } from "@/lib/utils";

type CombatantType = "player" | "enemy";

type CombatantTypeRadioGroupProps = {
  name?: string;
  required?: boolean;
  value?: CombatantType;
  onChange?: (value: CombatantType) => void;
};

const baseClasses =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium cursor-pointer transition-all select-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-focus-visible:border-ring";

const CombatantTypeRadioGroup = ({
  name = "type",
  required,
  value,
  onChange,
}: CombatantTypeRadioGroupProps) => {
  const radioProps = (type: CombatantType) => ({
    type: "radio" as const,
    name,
    value: type,
    required,
    checked: value !== undefined ? value === type : undefined,
    onChange: onChange ? () => onChange(type) : undefined,
    className: "sr-only",
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      <label
        className={cn(
          baseClasses,
          "border-dnd-hero-blue/30 text-dnd-hero-blue hover:bg-dnd-hero-blue/10",
          "has-checked:bg-dnd-hero-blue has-checked:text-white has-checked:hover:bg-dnd-hero-blue/90",
        )}
      >
        <input {...radioProps("player")} />
        <Shield size={14} /> Hero
      </label>
      <label
        className={cn(
          baseClasses,
          "border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10",
          "has-checked:bg-dnd-blood has-checked:text-white has-checked:hover:bg-dnd-blood/90",
        )}
      >
        <input {...radioProps("enemy")} />
        <Sword size={14} /> Enemy
      </label>
    </div>
  );
};

export default CombatantTypeRadioGroup;
