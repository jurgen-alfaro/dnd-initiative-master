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
import { Input } from "@/app/components/ui/input";
import { KeyRoundIcon } from "lucide-react";
import { recoverDm } from "@/app/server/actions";
import { getDeviceLabel, getOrCreateDeviceId } from "@/app/lib/device-id";
import { storeRecoveryCode } from "@/app/lib/dm-token";
import type { DmParty } from "@/app/lib/types";

interface RecoverDmDialogProps {
  onRecovered: (parties: DmParty[]) => void;
}

export default function RecoverDmDialog({ onRecovered }: RecoverDmDialogProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (trimmed === "") return;

    setIsPending(true);
    setError(null);
    try {
      const result = await recoverDm(
        trimmed,
        getOrCreateDeviceId(),
        getDeviceLabel(),
      );
      if ("error" in result) {
        setError(result.error);
        return;
      }
      storeRecoveryCode(trimmed);
      onRecovered(result.parties);
      setCode("");
      setOpen(false);
    } catch {
      setError("Could not recover. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer gap-2">
          <KeyRoundIcon size={16} />
          Recover DM
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recover DM identity</AlertDialogTitle>
          <AlertDialogDescription>
            Enter your recovery phrase to access your parties from this
            device.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="your word or phrase"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Case doesn&apos;t matter.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleSubmit}
            disabled={isPending || code.trim() === ""}
          >
            {isPending ? "Searching..." : "Recover"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
