"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ScrollText } from "lucide-react";
import type { DmParty } from "@/app/lib/types";
import { storeDmToken } from "@/app/lib/dm-token";
import { formatSessionDate } from "@/app/lib/date-format";

interface SelectPartyDialogProps {
  parties: DmParty[];
  triggerLabel?: string;
  triggerSize?: "sm" | "lg" | "default";
  triggerVariant?: "outline" | "ghost" | "link";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SelectPartyDialog({
  parties,
  triggerLabel = "Select Party",
  triggerSize = "lg",
  triggerVariant = "outline",
  open,
  onOpenChange,
}: SelectPartyDialogProps) {
  // Controlled when the parent passes open/onOpenChange, internal otherwise
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = open ?? internalOpen;
  const handleOpenChange = onOpenChange ?? setInternalOpen;
  const router = useRouter();

  const handleSelect = (party: DmParty) => {
    // Persist the token so PartyPage recognises this device as the DM
    storeDmToken(party.code, party.dmToken);
    router.push(`/party/${party.code}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Trigger-less when controlled (e.g. driven by the party actions menu) */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            size={triggerSize}
            variant={triggerVariant}
            className="cursor-pointer"
          >
            {triggerLabel}
            <ScrollText />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your parties</DialogTitle>
          <DialogDescription>
            Choose a party to enter as DM.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {parties.map((party) => (
            <li key={party.code}>
              <button
                type="button"
                onClick={() => handleSelect(party)}
                className="w-full cursor-pointer rounded-lg border border-dnd-gold/15 bg-dnd-parchment/5 p-3 text-left transition-colors hover:border-dnd-gold/40 hover:bg-dnd-gold/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading text-dnd-gold">
                    {party.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {party.code}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Created: {formatSessionDate(party.createdAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
