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
import { Target } from "lucide-react";
import { AMMO_GLYPH } from "@/app/lib/ammo";
import type { Combatant } from "@/app/lib/types";

interface AddAmmoDialogProps {
  combatant: Combatant;
  onAddAmmo: (
    combatantId: number,
    name: string,
    count: number,
    max: number | null,
  ) => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

// Digits only, capped at 4 characters (matches the server's 9999 ceiling).
function toDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function AddAmmoForm({
  combatant,
  onAddAmmo,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  onAddAmmo: AddAmmoDialogProps["onAddAmmo"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [count, setCount] = useState("");
  const [max, setMax] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    // An empty max means "no quiver capacity", stored as null.
    await onAddAmmo(
      combatant.id,
      trimmedName,
      Number(count),
      max === "" ? null : Number(max),
    );
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="ammoName">Name</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="ammoName"
            maxLength={30}
            placeholder="Virotes"
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
          <FieldLabel htmlFor="ammoCount">Quantity</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="ammoCount"
              type="text"
              inputMode="numeric"
              placeholder="20"
              value={count}
              onChange={(e) => setCount(toDigits(e.target.value))}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="ammoMax">Max (quiver)</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="ammoMax"
              type="text"
              inputMode="numeric"
              placeholder="Optional"
              value={max}
              onChange={(e) => setMax(toDigits(e.target.value))}
            />
          </InputGroup>
        </Field>
      </div>

      {error && <p className="text-sm text-dnd-blood-bright">{error}</p>}

      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Adding..." : "Add Ammo"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AddAmmoDialog({
  combatant,
  onAddAmmo,
  isPending,
  children,
}: AddAmmoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <span aria-hidden>{AMMO_GLYPH}</span>
            Add Ammo
          </DialogTitle>
          <DialogDescription>
            Track {combatant.name}&apos;s bolts, arrows or bullets. The max is
            optional and only sets the quiver capacity.
          </DialogDescription>
        </DialogHeader>
        <AddAmmoForm
          combatant={combatant}
          onAddAmmo={onAddAmmo}
          isPending={isPending}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
