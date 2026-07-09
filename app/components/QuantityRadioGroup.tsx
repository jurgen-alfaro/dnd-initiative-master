"use client";

import { cn } from "@/lib/utils";

type QuantityRadioGroupProps = {
  name?: string;
  value: number;
  onChange: (value: number) => void;
};

const QUANTITIES = [1, 2, 3, 4, 5] as const;

const baseClasses =
  "inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium cursor-pointer transition-all select-none border-input text-foreground hover:bg-accent has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 has-focus-visible:border-ring has-checked:bg-primary has-checked:text-primary-foreground has-checked:border-primary has-checked:hover:bg-primary/90";

const QuantityRadioGroup = ({
  name = "quantity",
  value,
  onChange,
}: QuantityRadioGroupProps) => (
  <div className="grid grid-cols-5 gap-2">
    {QUANTITIES.map((q) => (
      <label key={q} className={cn(baseClasses)}>
        <input
          type="radio"
          name={name}
          value={q}
          checked={value === q}
          onChange={() => onChange(q)}
          className="sr-only"
        />
        {q}
      </label>
    ))}
  </div>
);

export default QuantityRadioGroup;
