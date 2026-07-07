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
import { HeartHandshakeIcon, DicesIcon } from "lucide-react";
import { useActionState, useState } from "react";
import { joinParty } from "@/app/server/actions";

// Form sub-component to isolate its state
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
        <Button size="lg" className="w-full cursor-pointer">
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
            By passing a changing key, or simply relying on the content
            unmounting when the dialog closes, we reset the form state.
            We use 'open' as the key to force a remount every time it opens.
          */}
        {open && <JoinPartyForm />}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default JoinPartyDialog;
