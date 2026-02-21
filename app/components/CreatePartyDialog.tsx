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

import { Field, FieldDescription, FieldLabel } from "@/app/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { HeartHandshakeIcon, SwordIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { createParty } from "@/app/server/actions";

// Sub-componente del formulario para aislar el estado
const CreatePartyForm = () => {
  const [state, formAction, isPending] = useActionState(createParty, null);

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
        {state?.error && (
          <p className="text-sm font-medium text-destructive mt-2 text-center">
            {typeof state.error === "string"
              ? state.error
              : Object.values(state.error).flat().join(", ")}
          </p>
        )}
      </Field>
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
        <Button size="lg" className="cursor-pointer">
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
