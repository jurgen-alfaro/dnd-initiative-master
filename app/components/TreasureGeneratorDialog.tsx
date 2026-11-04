"use client";

import { useMemo, useState } from "react";
import { Coins as CoinsIcon, Dices } from "lucide-react";
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
import { Checkbox } from "@/app/components/ui/checkbox";
import { Field, FieldLabel } from "@/app/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { todayInputValue } from "@/app/lib/date-format";
import {
  deliverIndividualTreasure,
  deliverPartyTreasure,
} from "@/app/server/actions";
import { randomDie } from "@/app/lib/treasure/dice";
import {
  isEveryItemAssigned,
  partyShares,
  splitAmong,
  toggleRecipient,
  type PartySelection,
} from "@/app/lib/treasure/party";
import { formatCoinList, formatCpAsPo } from "@/app/lib/treasure/coins";
import {
  MAX_ENCOUNTER_LEVEL,
  MIN_ENCOUNTER_LEVEL,
  formatItem,
  formatItemName,
  generateTreasure,
  totalValueCp,
} from "@/app/lib/treasure/treasure";
import type { Combatant } from "@/app/lib/types";

interface TreasureGeneratorDialogProps {
  partyCode: string;
  dmToken: string;
  combatants: Combatant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Destination = "party" | "individual";

const LEVELS = Array.from(
  { length: MAX_ENCOUNTER_LEVEL - MIN_ENCOUNTER_LEVEL + 1 },
  (_, i) => MIN_ENCOUNTER_LEVEL + i,
);

/**
 * DM-only generator for a tesoro de party or individual. The treasure is
 * rolled in the browser so rerolling is instant; only delivering touches the
 * server.
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
            <CoinsIcon className="w-5 h-5" />
            Treasure
          </DialogTitle>
          <DialogDescription>
            Roll a treasure for the party or for one character
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
  const players = combatants.filter((c) => c.type === "player");
  // A private message needs someone to read it, so only claimed PJs qualify.
  const claimedPlayers = players.filter((c) => c.isClaimed);

  const [level, setLevel] = useState(MIN_ENCOUNTER_LEVEL);
  const [destination, setDestination] = useState<Destination>("party");
  const [treasure, setTreasure] = useState(() =>
    generateTreasure(MIN_ENCOUNTER_LEVEL, randomDie),
  );
  // Party treasure: the PJs ticked (unhidden ones to start with) and the PJ
  // each item goes to.
  const [selection, setSelection] = useState<PartySelection>(() => ({
    recipientIds: new Set(players.filter((c) => !c.isHidden).map((c) => c.id)),
    assignments: {},
  }));
  const [recipientId, setRecipientId] = useState<number | null>(
    claimedPlayers.length === 1 ? claimedPlayers[0].id : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);

  // Derived from the PJs present right now: polling can add or remove one
  // while the dialog is open.
  const partyRecipients = players.filter((c) =>
    selection.recipientIds.has(c.id),
  );
  const recipientIds = partyRecipients.map((c) => c.id);
  const recipientIdSet = new Set(recipientIds);
  const recipientCount = recipientIds.length;
  // The coin split is redone only when the treasure or the number of
  // recipients changes, so the leftover copper keeps its lucky owner between
  // renders.
  const coinShares = useMemo(
    () => splitAmong(treasure.coins, recipientCount, randomDie),
    [treasure, recipientCount],
  );
  const shares = partyShares(
    treasure,
    recipientIds,
    coinShares,
    selection.assignments,
  );

  const roll = (nextLevel: number) => {
    setTreasure(generateTreasure(nextLevel, randomDie));
    setSelection((current) => ({ ...current, assignments: {} }));
  };

  const handleLevelChange = (value: string) => {
    const next = Number(value);
    setLevel(next);
    roll(next);
  };

  const handleReroll = () => roll(level);

  const handleToggleRecipient = (id: number, isChecked: boolean) => {
    setSelection((current) => toggleRecipient(current, id, isChecked));
  };

  const handleAssign = (itemIndex: number, owner: number) => {
    setSelection((current) => ({
      ...current,
      assignments: { ...current.assignments, [itemIndex]: owner },
    }));
  };

  const canDeliver =
    destination === "party"
      ? partyRecipients.length > 0 &&
        isEveryItemAssigned(treasure, selection.assignments, recipientIdSet)
      : claimedPlayers.some((c) => c.id === recipientId);

  const handleDeliver = async () => {
    if (!canDeliver) {
      setError(
        destination === "party"
          ? "Choose recipients and assign every item"
          : "Choose a character",
      );
      return;
    }
    setError(null);
    setIsDelivering(true);
    try {
      const result =
        destination === "party"
          ? await deliverPartyTreasure(
              partyCode,
              dmToken,
              treasure,
              shares,
              new Date(`${todayInputValue()}T12:00:00`).toISOString(),
            )
          : await deliverIndividualTreasure(
              partyCode,
              dmToken,
              // NOTE: canDeliver guarantees a recipient in this branch.
              recipientId ?? 0,
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

  const coinLines = formatCoinList(treasure.coins);

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
          <FieldLabel htmlFor="treasureDestination">Destination</FieldLabel>
          <Select
            value={destination}
            onValueChange={(v) =>
              setDestination(v === "individual" ? "individual" : "party")
            }
          >
            <SelectTrigger id="treasureDestination" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="party">Party</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {destination === "individual" && (
          <Field>
            <FieldLabel htmlFor="treasureRecipient">Character</FieldLabel>
            <Select
              value={recipientId === null ? "" : String(recipientId)}
              onValueChange={(v) => setRecipientId(Number(v))}
              disabled={claimedPlayers.length === 0}
            >
              <SelectTrigger id="treasureRecipient" className="w-full">
                <SelectValue
                  placeholder={
                    claimedPlayers.length === 0
                      ? "No claimed characters"
                      : "Choose"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {claimedPlayers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

      {destination === "party" && (
        <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
          <legend className="mb-1 text-sm font-heading">Recipients</legend>
          {players.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selection.recipientIds.has(c.id)}
                onCheckedChange={(v) => handleToggleRecipient(c.id, v === true)}
              />
              {c.name}
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-dnd-gold/20 p-3">
        {coinLines.length === 0 ? (
          <PreviewLine label="No coins" />
        ) : (
          coinLines.map((line) => <PreviewLine key={line} label={line} />)
        )}
        {destination === "party" && coinLines.length > 0 && (
          <ul className="text-xs text-muted-foreground">
            {partyRecipients.map((c, i) => (
              <li key={c.id}>
                <span className="font-heading">{c.name}:</span>{" "}
                {formatCoinList(shares[i].coins).join(", ") || "no coins"}
              </li>
            ))}
          </ul>
        )}
        {treasure.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <PreviewLine
              label={formatItem(item)}
              description={item.description}
            />
            {destination === "party" && (
              <Select
                value={
                  recipientIdSet.has(selection.assignments[i])
                    ? String(selection.assignments[i])
                    : ""
                }
                onValueChange={(v) => handleAssign(i, Number(v))}
                disabled={partyRecipients.length === 0}
              >
                <SelectTrigger
                  aria-label={`Recipient of ${formatItemName(item)}`}
                  className="w-36 shrink-0"
                >
                  <SelectValue placeholder="Assign" />
                </SelectTrigger>
                <SelectContent>
                  {partyRecipients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
        <p className="border-t border-dnd-gold/20 pt-2 text-sm font-heading text-dnd-gold">
          Total: {formatCpAsPo(totalValueCp(treasure))}
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
        <Button onClick={handleDeliver} disabled={isDelivering || !canDeliver}>
          {isDelivering ? "Delivering..." : "Deliver"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/** One line of the preview; expanding it shows its descripción, if any. */
function PreviewLine({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  if (!description) return <p className="text-sm font-heading">{label}</p>;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-heading">{label}</summary>
      <p className="mt-1 pl-4 text-xs text-muted-foreground whitespace-pre-line">
        {description}
      </p>
    </details>
  );
}
