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
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Field, FieldLabel } from "@/app/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import BuffKindRadioGroup from "@/app/components/BuffKindRadioGroup";
import { Sparkles } from "lucide-react";
import type { BuffKind, Combatant } from "@/app/lib/types";

interface AddBuffDialogProps {
  combatants: Combatant[];
  onAddBuff: (
    combatantIds: number[],
    name: string,
    kind: BuffKind,
    rounds: number,
  ) => Promise<void>;
  isPending: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function AddBuffForm({
  combatants,
  onAddBuff,
  isPending,
  onClose,
}: {
  combatants: Combatant[];
  onAddBuff: AddBuffDialogProps["onAddBuff"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<BuffKind | "">("");
  const [rounds, setRounds] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setRounds("");
      return;
    }
    if (!/^\d*$/.test(value)) return;
    if (Number(value) <= 999 && value.length <= 3) {
      setRounds(value);
    }
  };

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
      prev.size === combatants.length
        ? new Set()
        : new Set(combatants.map((c) => c.id)),
    );
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const roundsNum = Number(rounds);

    if (!trimmedName) {
      setError("Enter a name");
      return;
    }
    if (kind !== "buff" && kind !== "debuff") {
      setError("Select buff or debuff");
      return;
    }
    if (!rounds || roundsNum < 1) {
      setError("Enter the number of rounds");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Select at least one combatant");
      return;
    }

    setError(null);
    await onAddBuff(Array.from(selectedIds), trimmedName, kind, roundsNum);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="buffName">Name</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="buffName"
            maxLength={30}
            placeholder="Bless"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <InputGroupAddon align="inline-start">
            <Sparkles className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <FieldLabel>Type</FieldLabel>
        <BuffKindRadioGroup
          name="buffKind"
          value={kind === "" ? undefined : kind}
          onChange={setKind}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="buffRounds">Rounds</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="buffRounds"
            type="text"
            inputMode="numeric"
            placeholder="3"
            value={rounds}
            onChange={handleRoundsChange}
            maxLength={3}
          />
        </InputGroup>
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-heading">Affected combatants</Label>
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs font-heading uppercase tracking-wider text-dnd-gold hover:text-dnd-gold-bright transition-colors"
          >
            {selectedIds.size === combatants.length
              ? "Clear all"
              : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
          {combatants.map((combatant) => (
            <div key={combatant.id} className="flex items-center space-x-2">
              <Checkbox
                id={`buff-combatant-${combatant.id}`}
                checked={selectedIds.has(combatant.id)}
                onCheckedChange={() => handleToggleCombatant(combatant.id)}
                disabled={isPending}
              />
              <Label
                htmlFor={`buff-combatant-${combatant.id}`}
                className="text-sm font-heading cursor-pointer truncate"
              >
                {combatant.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-dnd-blood-bright">{error}</p>}

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending
            ? "Adding..."
            : kind === "buff"
              ? "Add Buff"
              : kind === "debuff"
                ? "Add Debuff"
                : "Add Buff/Debuff"}
        </Button>
      </AlertDialogFooter>
    </div>
  );
}

export default function AddBuffDialog({
  combatants,
  onAddBuff,
  isPending,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddBuffDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Controlled mode when open/onOpenChange are provided (e.g. driven by a menu);
  // otherwise the dialog owns its state and renders its own floating trigger.
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setInternalOpen;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <AlertDialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-36 right-6 rounded-full w-14 h-14 shadow-lg cursor-pointer z-50 bg-indigo-900/80 hover:bg-indigo-800 border border-dnd-gold/30"
          >
            <Sparkles className="w-7 h-7" />
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Add Buff / Debuff
          </AlertDialogTitle>
          <AlertDialogDescription>
            Create a buff or debuff and choose which combatants it affects
          </AlertDialogDescription>
        </AlertDialogHeader>
        {open && (
          <AddBuffForm
            combatants={combatants}
            onAddBuff={onAddBuff}
            isPending={isPending}
            onClose={() => setOpen(false)}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
