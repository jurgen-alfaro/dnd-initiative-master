import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeartHandshakeIcon, DicesIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { joinParty } from "@/app/server/actions";

// Sub-componente del formulario para aislar el estado
const JoinPartyForm = () => {
  const [state, formAction, isPending] = useActionState(joinParty, null);

  return (
    <form action={formAction}>
      <Field className="max-w-sm">
        <InputGroup>
          <InputGroupInput
            maxLength={6}
            id="inline-start-input"
            name="code"
            placeholder="ABC123"
            className="uppercase"
          />
          <InputGroupAddon align="inline-start">
            <DicesIcon className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
        {state?.error && (
          <p className="text-sm font-medium text-destructive mt-2 text-center">
            {state.error as string}
          </p>
        )}
      </Field>
      <AlertDialogFooter className="mt-4">
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Joining..." : "Continue"}
        </Button>
      </AlertDialogFooter>
    </form>
  );
};

const JoinPartyDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="cursor-pointer">
          Join Party
          <HeartHandshakeIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enter Party Code</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the party code the DM gave you
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* 
            Al pasarle una key que cambia o simplemente confiando en que el contenido 
            se desmonta al cerrarse, logramos resetear el estado del formulario.
            Usamos 'open' como key para forzar remontaje cada vez que se abre.
          */}
        {open && <JoinPartyForm />}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default JoinPartyDialog;
