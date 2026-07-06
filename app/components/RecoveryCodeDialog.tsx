"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { EyeIcon } from "lucide-react";

interface RecoveryCodeDialogProps {
  recoveryCode: string;
}

export default function RecoveryCodeDialog({
  recoveryCode,
}: RecoveryCodeDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer gap-2">
          <EyeIcon size={16} />
          Ver frase de recuperación
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tu frase de recuperación</AlertDialogTitle>
          <AlertDialogDescription>
            Guardala en un lugar seguro. Te permite recuperar tus parties de DM
            en otro dispositivo. No la compartas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <p className="rounded-md border border-dnd-gold/30 bg-dnd-gold/5 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-dnd-gold">
          {recoveryCode}
        </p>

        <AlertDialogFooter>
          <AlertDialogAction>Listo</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
