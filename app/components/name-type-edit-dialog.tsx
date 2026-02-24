"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { Combatant } from "@/app/lib/types";
import { Shield, Sword } from "lucide-react";

interface NameTypeEditDialogProps {
  combatant: Combatant;
  onSave: (id: number, name: string, type: "player" | "enemy") => void;
  isPending: boolean;
  children: React.ReactNode;
}

function NameTypeEditForm({
  combatant,
  onSave,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  onSave: NameTypeEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [localName, setLocalName] = useState(combatant.name);
  const [localType, setLocalType] = useState<"player" | "enemy">(
    combatant.type,
  );

  const handleSave = () => {
    // Trim and validate name
    const trimmedName = localName.trim();
    if (trimmedName.length < 3) return;

    onSave(combatant.id, trimmedName, localType);
    onClose();
  };

  const isValid = localName.trim().length >= 3;

  return (
    <div className="flex flex-col gap-4">
      {/* Name Input */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
          Combatant Name
        </span>
        <Input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          maxLength={30}
          className="text-lg font-heading font-bold bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
          placeholder="Enter name..."
        />
        {localName.trim().length > 0 && localName.trim().length < 3 && (
          <span className="text-xs text-dnd-blood-bright">
            Name must be at least 3 characters
          </span>
        )}
      </div>

      {/* Type Select */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
          Combatant Type
        </span>
        <Select
          value={localType}
          onValueChange={(val) => setLocalType(val as "player" | "enemy")}
        >
          <SelectTrigger className="w-full border-dnd-gold/20 focus-visible:ring-dnd-gold/30 bg-transparent font-heading">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="player">
                <span className="flex items-center gap-2">
                  <Shield size={16} className="text-dnd-hero-blue" />
                  <span>Hero</span>
                </span>
              </SelectItem>
              <SelectItem value="enemy">
                <span className="flex items-center gap-2">
                  <Sword size={16} className="text-dnd-blood" />
                  <span>Enemy</span>
                </span>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button onClick={handleSave} disabled={isPending || !isValid}>
          Save
        </Button>
      </AlertDialogFooter>
    </div>
  );
}

export default function NameTypeEditDialog({
  combatant,
  onSave,
  isPending,
  children,
}: NameTypeEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold">
            Edit Combatant Info
          </AlertDialogTitle>
        </AlertDialogHeader>
        {open && (
          <NameTypeEditForm
            combatant={combatant}
            onSave={onSave}
            isPending={isPending}
            onClose={() => setOpen(false)}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
