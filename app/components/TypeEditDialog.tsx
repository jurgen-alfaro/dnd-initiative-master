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

interface TypeEditDialogProps {
  combatant: Combatant;
  onSave: (id: number, name: string, type: "player" | "enemy") => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

function TypeEditForm({
  combatant,
  onSave,
  isPending,
  onClose,
}: {
  combatant: Combatant;
  onSave: TypeEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [localType, setLocalType] = useState<"player" | "enemy">(
    combatant.type,
  );

  const handleSave = async () => {
    await onSave(combatant.id, combatant.name, localType);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Type Select */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
          Type
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
        <Button onClick={handleSave} disabled={isPending}>
          Save
        </Button>
      </AlertDialogFooter>
    </div>
  );
}

export default function TypeEditDialog({
  combatant,
  onSave,
  isPending,
  children,
}: TypeEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold">
            Edit Type
          </AlertDialogTitle>
          <AlertDialogDescription>
            Set the combatant type.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {open && (
          <TypeEditForm
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
