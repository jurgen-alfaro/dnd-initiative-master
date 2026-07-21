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
      <DialogFooter className="mt-4">
        <DialogClose>Cancel</DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Joining..." : "Continue"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const JoinPartyDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full cursor-pointer">
          Join Party
          <HeartHandshakeIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Party Code</DialogTitle>
          <DialogDescription>
            Enter the party code the DM gave you
          </DialogDescription>
        </DialogHeader>
        {/*
          Radix unmounts the dialog content when it closes, so the form state
          resets on every open. Rendering it directly (not gated on `open`)
          keeps the form visible during the close animation, avoiding a flash
          of the header alone.
        */}
        <JoinPartyForm />
      </DialogContent>
    </Dialog>
  );
};

export default JoinPartyDialog;
