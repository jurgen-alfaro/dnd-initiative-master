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
import { setRecoveryWord } from "@/app/server/actions";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import { storeRecoveryCode } from "@/app/lib/dm-token";

interface SetRecoveryWordDialogProps {
  currentCode: string;
  onChanged: (code: string) => void;
}

export default function SetRecoveryWordDialog({
  currentCode,
  onChanged,
}: SetRecoveryWordDialogProps) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
      setWord("");
      setOpen(false);
    } catch {
      setError("No se pudo guardar. Intentá de nuevo.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer gap-2">
          <KeyRoundIcon size={16} />
          Frase de recuperación
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Frase de recuperación</AlertDialogTitle>
          <AlertDialogDescription>
            Elegí una palabra o frase fácil de recordar. La usás para recuperar
            tus parties de DM en otro dispositivo. No la compartas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Frase actual</p>
          <p className="rounded-md border border-dnd-gold/30 bg-dnd-gold/5 px-4 py-3 text-center text-lg font-bold text-dnd-gold">
            {currentCode}
          </p>
        </div>

        <div className="space-y-1">
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="palabra o frase fácil de recordar"
            maxLength={40}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            No importa mayúsculas o minúsculas.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            onClick={handleSubmit}
            disabled={isPending || word.trim() === ""}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
