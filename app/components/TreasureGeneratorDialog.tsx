"use client";

import { useState } from "react";
import { Coins, Dices } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Field, FieldLabel } from "@/app/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { deliverIndividualTreasure } from "@/app/server/actions";
import { randomDie } from "@/app/lib/treasure/dice";
import {
  DENOMINATIONS,
  MAX_ENCOUNTER_LEVEL,
  MIN_ENCOUNTER_LEVEL,
  formatCoins,
  formatCpAsGp,
  generateTreasure,
  totalValueCp,
  type Roll,
} from "@/app/lib/treasure/treasure";
import type { Combatant } from "@/app/lib/types";

interface TreasureGeneratorDialogProps {
  partyCode: string;
  dmToken: string;
  combatants: Combatant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEVELS = Array.from(
  { length: MAX_ENCOUNTER_LEVEL - MIN_ENCOUNTER_LEVEL + 1 },
  (_, i) => MIN_ENCOUNTER_LEVEL + i,
);

/**
 * DM-only generator for a tesoro individual. The treasure is rolled in the
 * browser so rerolling is instant; only delivering touches the server.
 */
export default function TreasureGeneratorDialog({
  partyCode,
  dmToken,
  combatants,
  open,
  onOpenChange,
}: TreasureGeneratorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Treasure
          </DialogTitle>
          <DialogDescription>
            Roll an individual treasure and give it to a claimed character
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open: each opening starts from a fresh roll. */}
        <TreasureGeneratorForm
          partyCode={partyCode}
          dmToken={dmToken}
          combatants={combatants}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function TreasureGeneratorForm({
  partyCode,
  dmToken,
  combatants,
  onClose,
}: Omit<TreasureGeneratorDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
}) {
  // A private message needs someone to read it, so only claimed PJs qualify.
  const recipients = combatants.filter(
    (c) => c.type === "player" && c.isClaimed,
  );

  const [level, setLevel] = useState(MIN_ENCOUNTER_LEVEL);
  const [treasure, setTreasure] = useState(() =>
    generateTreasure(MIN_ENCOUNTER_LEVEL, randomDie),
  );
  const [recipientId, setRecipientId] = useState<number | null>(
    recipients.length === 1 ? recipients[0].id : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);

  const handleLevelChange = (value: string) => {
    const next = Number(value);
    setLevel(next);
    setTreasure(generateTreasure(next, randomDie));
  };

  const handleReroll = () => {
    setTreasure(generateTreasure(level, randomDie));
  };

  const handleDeliver = async () => {
    if (recipientId === null) {
      setError("Choose a character");
      return;
    }
    setError(null);
    setIsDelivering(true);
    try {
      const result = await deliverIndividualTreasure(
        partyCode,
        dmToken,
        recipientId,
        treasure,
      );
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onClose();
    } catch (e) {
      console.error("Error delivering treasure:", e);
      setError("Error delivering treasure");
    } finally {
      setIsDelivering(false);
    }
  };

  const coinLines = DENOMINATIONS.filter((d) => treasure.coins[d] > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="treasureLevel">Encounter level</FieldLabel>
          <Select value={String(level)} onValueChange={handleLevelChange}>
            <SelectTrigger id="treasureLevel" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={String(l)}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="treasureRecipient">Character</FieldLabel>
          <Select
            value={recipientId === null ? "" : String(recipientId)}
            onValueChange={(v) => setRecipientId(Number(v))}
            disabled={recipients.length === 0}
          >
            <SelectTrigger id="treasureRecipient" className="w-full">
              <SelectValue
                placeholder={
                  recipients.length === 0 ? "No claimed characters" : "Choose"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-dnd-gold/20 p-3">
        {coinLines.length === 0 ? (
          <PreviewLine label="No coins" rolls={treasure.coinRolls} />
        ) : (
          coinLines.map((d) => (
            <PreviewLine
              key={d}
              label={formatCoins(treasure.coins[d], d)}
              rolls={treasure.coinRolls}
            />
          ))
        )}
        {treasure.items.map((item, i) => (
          <PreviewLine
            key={i}
            label={`${item.name} (${formatCpAsGp(item.valueCp)})`}
            rolls={item.rolls}
          />
        ))}
        <p className="border-t border-dnd-gold/20 pt-2 text-sm font-heading text-dnd-gold">
          Total: {formatCpAsGp(totalValueCp(treasure))}
        </p>
      </div>

      {error && <p className="text-sm text-dnd-blood-bright">{error}</p>}

      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <Button
          variant="outline"
          onClick={handleReroll}
          disabled={isDelivering}
          className="gap-2"
        >
          <Dices className="w-4 h-4" />
          Reroll
        </Button>
        <Button
          onClick={handleDeliver}
          disabled={isDelivering || recipientId === null}
        >
          {isDelivering ? "Delivering..." : "Deliver"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/** One line of the preview; expanding it shows the rolls behind it. */
function PreviewLine({ label, rolls }: { label: string; rolls: Roll[] }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-heading">{label}</summary>
      <ul className="mt-1 pl-4 text-xs text-muted-foreground">
        {rolls.map((roll, i) => (
          <li key={i}>
            {roll.label}: {roll.dice} → {roll.values.join(" + ")}
          </li>
        ))}
      </ul>
    </details>
  );
}
