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
import { Button } from "@/app/components/ui/button";
import { Field, FieldLabel } from "@/app/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import { Target, Trash2 } from "lucide-react";
import { AMMO_GLYPH, clampAmmoCount } from "@/app/lib/ammo";
import type { Ammo, Combatant } from "@/app/lib/types";

interface AmmoEditDialogProps {
  combatant: Combatant;
  ammo: Ammo;
  onSave: (
    combatantId: number,
    ammoId: string,
    name: string,
    count: number,
    max: number | null,
  ) => Promise<void>;
  onRemove: (combatantId: number, ammoId: string) => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

const QUICK_ADJUST_VALUES = [1, 5, 20, -1, -5, -20];

// Digits only, capped at 4 characters (matches the server's 9999 ceiling).
function toDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function AmmoEditForm({
  combatant,
  ammo,
  onSave,
  onRemove,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  ammo: Ammo;
  onSave: AmmoEditDialogProps["onSave"];
  onRemove: AmmoEditDialogProps["onRemove"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(ammo.name);
  const [count, setCount] = useState(String(ammo.count));
  const [max, setMax] = useState(ammo.max === null ? "" : String(ammo.max));
  const [error, setError] = useState<string | null>(null);

  const maxValue = max === "" ? null : Number(max);

  const handleQuickAdjust = (amount: number) => {
    const current = count === "" ? 0 : Number(count);
    setCount(String(clampAmmoCount(current + amount, maxValue)));
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a name");
      return;
    }
    if (count === "") {
      setError("Enter the quantity");
      return;
    }

    setError(null);
    await onSave(combatant.id, ammo.id, trimmedName, Number(count), maxValue);
    onClose();
  };

  const handleRemove = async () => {
    // Close first: the dialog keeps its subject mounted through the close
    // animation, and the ammo row is gone from the card right away.
    onClose();
    await onRemove(combatant.id, ammo.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="editAmmoName">Name</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="editAmmoName"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Target className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="editAmmoCount">Quantity</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="editAmmoCount"
              type="text"
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(toDigits(e.target.value))}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="editAmmoMax">Max (quiver)</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="editAmmoMax"
              type="text"
              inputMode="numeric"
              placeholder="Optional"
              value={max}
              onChange={(e) => setMax(toDigits(e.target.value))}
            />
          </InputGroup>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_ADJUST_VALUES.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(amount)}
            disabled={isPending}
            className={
              amount > 0
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 font-mono font-bold"
                : "border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10 hover:border-dnd-blood/50 font-mono font-bold"
            }
          >
            {amount > 0 ? `+${amount}` : amount}
          </Button>
        ))}
      </div>

      {error && <p className="text-sm text-dnd-blood-bright">{error}</p>}

      <Button
        variant="outline"
        onClick={handleRemove}
        disabled={isPending}
        className="border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10 hover:border-dnd-blood/50"
      >
        <Trash2 size={14} />
        Remove all ammo
      </Button>

      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AmmoEditDialog({
  combatant,
  ammo,
  onSave,
  onRemove,
  isPending,
  children,
}: AmmoEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <span aria-hidden>{AMMO_GLYPH}</span>
            Edit Ammo
          </DialogTitle>
          <DialogDescription>
            Rename, restock or spend {combatant.name}&apos;s {ammo.name}.
          </DialogDescription>
        </DialogHeader>
        <AmmoEditForm
          combatant={combatant}
          ammo={ammo}
          onSave={onSave}
          onRemove={onRemove}
          isPending={isPending}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
