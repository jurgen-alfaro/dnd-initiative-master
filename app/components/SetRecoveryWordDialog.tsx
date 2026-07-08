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
import { KeyRoundIcon, Eye, EyeOff, Copy, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { setRecoveryWord } from "@/app/server/actions";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import { storeRecoveryCode } from "@/app/lib/dm-token";

type RecoveryTab = "view" | "change";

interface SetRecoveryWordDialogProps {
  currentCode: string;
  onChanged: (code: string) => void;
}

export default function SetRecoveryWordDialog({
  currentCode,
  onChanged,
}: SetRecoveryWordDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<RecoveryTab>("view");
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setTab("view");
      setRevealed(false);
      setCopied(false);
      setWord("");
      setError(null);
    }
  };

  const handleTabChange = (next: RecoveryTab) => {
    setTab(next);
    setRevealed(false);
    setCopied(false);
    setWord("");
    setError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Copy it manually.");
    }
  };

  const handleSubmit = async () => {
    const trimmed = word.trim();
    if (trimmed === "") return;

    setIsPending(true);
    setError(null);
    try {
      const result = await setRecoveryWord(getOrCreateDeviceId(), trimmed);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      storeRecoveryCode(result.recoveryCode);
      onChanged(result.recoveryCode);
      handleOpenChange(false);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  const segmentClasses = (active: boolean) =>
    cn(
      "inline-flex h-9 items-center justify-center rounded-md text-sm font-medium transition-all cursor-pointer",
      active
        ? "bg-primary text-primary-foreground shadow-xs"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer gap-2">
          <KeyRoundIcon size={16} />
          Recovery phrase
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recovery phrase</AlertDialogTitle>
          <AlertDialogDescription>
            A word or phrase that&apos;s easy to remember. You&apos;ll use it to
            recover your DM parties on another device.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Segmented control: View phrase / Change it */}
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-input/30 p-1">
          <button
            type="button"
            onClick={() => handleTabChange("view")}
            className={segmentClasses(tab === "view")}
          >
            View phrase
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("change")}
            className={segmentClasses(tab === "change")}
          >
            Change it
          </button>
        </div>

        {tab === "view" ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-dnd-gold">
              Your phrase
            </p>
            {revealed ? (
              <p className="font-heading text-2xl font-bold break-all text-dnd-gold">
                {currentCode}
              </p>
            ) : (
              <p
                aria-hidden="true"
                className="text-2xl tracking-[0.4em] text-dnd-gold"
              >
                ••••••••
              </p>
            )}

            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealed((v) => !v)}
                className="cursor-pointer gap-2"
              >
                {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
                {revealed ? "Hide" : "Reveal"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="cursor-pointer gap-2"
              >
                {copied ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-dnd-gold/20 bg-dnd-gold/5 px-3 py-2.5 text-left">
              <Shield size={16} className="mt-0.5 shrink-0 text-dnd-gold" />
              <p className="text-sm text-muted-foreground">
                Never share this phrase. Anyone with it can recover your
                parties.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="New word or phrase"
              maxLength={40}
              autoComplete="off"
            />
          </div>
        )}

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {tab === "change" && (
            <Button
              onClick={handleSubmit}
              disabled={isPending || word.trim() === ""}
            >
              {isPending ? "Saving..." : "Save phrase"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
