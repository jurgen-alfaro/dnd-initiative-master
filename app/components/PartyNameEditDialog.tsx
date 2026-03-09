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
import { Edit3 } from "lucide-react";

interface PartyNameEditDialogProps {
  currentName: string;
  onSave: (newName: string) => Promise<void>;
  isPending: boolean;
  children: React.ReactNode;
}

function PartyNameEditForm({
  currentName,
  onSave,
  isPending,
  onClose,
}: {
  currentName: string;
  onSave: PartyNameEditDialogProps["onSave"];
  isPending: boolean;
  onClose: () => void;
}) {
  const [localValue, setLocalValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    // Validate
    if (value.length < 3) {
      setError("Name must be at least 3 characters");
    } else if (value.length > 50) {
      setError("Name must be less than 50 characters");
    } else {
      setError(null);
    }
  };

  const handleSave = async () => {
    if (error || localValue.length < 3) return;
    await onSave(localValue);
    onClose();
  };

  const isValid = !error && localValue.length >= 3;

  return (
    <div className="flex flex-col gap-4">
      {/* Party name input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-widest text-muted-foreground font-heading">
          Party Name
        </label>
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="Enter party name"
          maxLength={50}
          className="font-heading text-lg bg-transparent border-dnd-gold/20 focus-visible:ring-dnd-gold/30"
          autoFocus
        />
        {error && <p className="text-xs text-dnd-blood-bright">{error}</p>}
        <p className="text-xs text-muted-foreground">
          {localValue.length}/50 characters
        </p>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <Button onClick={handleSave} disabled={isPending || !isValid}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </AlertDialogFooter>
    </div>
  );
}

export default function PartyNameEditDialog({
  currentName,
  onSave,
  isPending,
  children,
}: PartyNameEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-dnd-gold flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Party Name
          </AlertDialogTitle>
          <AlertDialogDescription>
            Change the name of your party.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {open && (
          <PartyNameEditForm
            currentName={currentName}
            onSave={onSave}
            isPending={isPending}
            onClose={() => setOpen(false)}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
