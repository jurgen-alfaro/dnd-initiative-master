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
import { Input } from "@/app/components/ui/input";
import { Clock } from "lucide-react";

interface RoundEditDialogProps {
  currentRound: number;
  onSave: (newRound: number) => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

const QUICK_ADJUST_VALUES = [1, 5, 10, -1, -5, -10];

function RoundEditForm({
  currentRound,
  onSave,
  isPending,
  onClose,
}: {
  currentRound: number;
  onSave: RoundEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [localValue, setLocalValue] = useState(currentRound);

  const handleQuickAdjust = (amount: number) => {
    setLocalValue((prev) => Math.max(1, prev + amount));
  };

  const handleSave = async () => {
    await onSave(localValue);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Round number display */}
      <div className="flex justify-around">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
            Round Number
          </span>
          <Input
            type="number"
            value={localValue}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) setLocalValue(Math.max(1, val));
            }}
            maxLength={3}
            className="w-32 h-14 text-center font-mono text-3xl font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
          />
        </div>
      </div>

      {/* Quick adjust buttons */}
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

      <DialogFooter>
        <DialogClose disabled={isPending}>Cancel</DialogClose>
        <Button onClick={handleSave} disabled={isPending || localValue < 1}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function RoundEditDialog({
  currentRound,
  onSave,
  isPending,
  children,
}: RoundEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Edit Round
          </DialogTitle>
          <DialogDescription>
            Set the current combat round. The current turn will be maintained.
          </DialogDescription>
        </DialogHeader>
        <RoundEditForm
          currentRound={currentRound}
          onSave={onSave}
          isPending={isPending}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
