"use client";

import { ShieldPlus, Skull } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BuffKind } from "@/app/lib/types";

type BuffKindRadioGroupProps = {
  name?: string;
  required?: boolean;
  value?: BuffKind;
  onChange?: (value: BuffKind) => void;
};

const baseClasses =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium cursor-pointer transition-all select-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-focus-visible:border-ring";

const BuffKindRadioGroup = ({
  name = "kind",
  required,
  value,
  onChange,
}: BuffKindRadioGroupProps) => {
  const radioProps = (kind: BuffKind) => ({
    type: "radio" as const,
    name,
    value: kind,
    required,
    checked: onChange ? value === kind : undefined,
    onChange: onChange ? () => onChange(kind) : undefined,
    className: "sr-only",
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      <label
        className={cn(
          baseClasses,
          "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10",
          "has-checked:bg-emerald-500 has-checked:text-white has-checked:hover:bg-emerald-500/90",
        )}
      >
        <input {...radioProps("buff")} />
        <ShieldPlus size={14} /> Buff
      </label>
      <label
        className={cn(
          baseClasses,
          "border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10",
          "has-checked:bg-dnd-blood has-checked:text-white has-checked:hover:bg-dnd-blood/90",
        )}
      >
        <input {...radioProps("debuff")} />
        <Skull size={14} /> Debuff
      </label>
    </div>
  );
};

export default BuffKindRadioGroup;
