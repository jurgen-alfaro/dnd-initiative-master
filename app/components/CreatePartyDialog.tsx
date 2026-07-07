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

import { Field } from "@/app/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import { Button } from "@/app/components/ui/button";
import { HeartHandshakeIcon, SwordIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createParty } from "@/app/server/actions";
import { storeDmToken, storeRecoveryCode } from "@/app/lib/dm-token";
import { getDeviceLabel, getOrCreateDeviceId } from "@/app/lib/device-id";

// Sub-componente del formulario para aislar el estado
const CreatePartyForm = () => {
  const [state, formAction, isPending] = useActionState(createParty, null);
  const router = useRouter();
  // Read lazily: this form only mounts on the client (inside the open dialog),
  // so localStorage/userAgent are available.
  const [deviceId] = useState(getOrCreateDeviceId);
  const [deviceLabel] = useState(getDeviceLabel);

  // On success, persist the DM token (and recovery code on first creation).
  // localStorage is the only thing that grants DM. If a recovery code was
  // returned we show it once before navigating; otherwise navigate right away.
  useEffect(() => {
    if (state && "success" in state && state.success) {
      storeDmToken(state.code, state.dmToken);
      if (state.recoveryCode) {
        storeRecoveryCode(state.recoveryCode);
      } else {
        router.push(`/party/${state.code}`);
      }
    }
  }, [state, router]);

  // First-time DM: surface the recovery code before entering the party.
  if (state && "success" in state && state.success && state.recoveryCode) {
    const { code, recoveryCode } = state;
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Guardá esta frase de recuperación. Te permite recuperar tus parties de
          DM en otro dispositivo. No la compartas.
        </p>
        <p className="rounded-md border border-dnd-gold/30 bg-dnd-gold/5 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-dnd-gold">
          {recoveryCode}
        </p>
        <AlertDialogFooter>
          <Button className="w-full" onClick={() => router.push(`/party/${code}`)}>
            Ya la guardé, continuar
          </Button>
        </AlertDialogFooter>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <Field className="max-w-sm">
        <InputGroup>
          <InputGroupInput
            maxLength={30}
            id="inline-start-input"
            name="partyName"
            placeholder="My Party"
            className="capitalize"
          />
          <InputGroupAddon align="inline-start">
            <SwordIcon className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
        {state && "error" in state && state.error && (
          <p className="text-sm font-medium text-destructive mt-2 text-center">
            {typeof state.error === "string"
              ? state.error
              : Object.values(state.error).flat().join(", ")}
          </p>
        )}
      </Field>
      <input type="hidden" name="deviceId" value={deviceId} />
      <input type="hidden" name="deviceLabel" value={deviceLabel} />
      <AlertDialogFooter className="mt-4">
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Continue"}
        </Button>
      </AlertDialogFooter>
    </form>
  );
};

const CreatePartyDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="w-full cursor-pointer">
          Create Party
          <HeartHandshakeIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create Party</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the name of the party
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* 
            Al pasarle una key que cambia o simplemente confiando en que el contenido 
            se desmonta al cerrarse, logramos resetear el estado del formulario.
            Usamos 'open' como key para forzar remontaje cada vez que se abre.
          */}
        {open && <CreatePartyForm />}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreatePartyDialog;
