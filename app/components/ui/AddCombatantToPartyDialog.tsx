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
import { useParams } from "next/navigation";
import { Field, FieldDescription, FieldLabel } from "@/app/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import { Dice2Icon, Dice3Icon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { HeartHandshakeIcon, DicesIcon, Dice1Icon } from "lucide-react";
import { useActionState, useState, useEffect } from "react";
import { addCombatantToParty } from "@/app/server/actions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { generateRandomName } from "@/app/lib/name-gen";

// Sub-componente del formulario para aislar el estado
const AddCombatantToPartyForm = ({
  onSuccess,
  partyCode,
}: {
  onSuccess: () => void;
  partyCode: string;
}) => {
  const [state, formAction, isPending] = useActionState(
    addCombatantToParty,
    null,
  );

  const [placeholderName] = useState(() => generateRandomName());
  const [initiative, setInitiative] = useState("");

  // Close dialog on success
  useEffect(() => {
    if (state && "success" in state && state.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const handleInitiativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setInitiative("");
      return;
    }

    // Allow only numbers and max 3 digits
    if (!/^\d*$/.test(value)) return;

    if (Number(value) <= 100 && value.length <= 3) {
      setInitiative(value);
    }
  };

  return (
    <form action={formAction}>
      <Field className="max-w-sm">
        <FieldLabel htmlFor="combatantName">Name</FieldLabel>
        <InputGroup id="combatantName">
          <InputGroupInput
            maxLength={30}
            id="inline-start-input"
            name="combatantName"
            placeholder={placeholderName}
          />
          <InputGroupAddon align="inline-start">
            <Dice1Icon className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
        <FieldLabel htmlFor="type">Type</FieldLabel>
        <InputGroup id="type">
          <Select name="type">
            <SelectTrigger className="w-full flex justify-start">
              <Dice2Icon className="text-muted-foreground" />
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Type</SelectLabel>
                <SelectItem value="player">Heroe</SelectItem>
                <SelectItem value="enemy">Enemy</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </InputGroup>
        <FieldLabel htmlFor="initiative">Initiative</FieldLabel>
        <InputGroup id="initiative">
          <InputGroupInput
            type="text"
            inputMode="numeric"
            id="initiative"
            name="initiative"
            placeholder="10"
            value={initiative}
            onChange={handleInitiativeChange}
            maxLength={3}
          />
          <InputGroupAddon align="inline-start">
            <Dice3Icon className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
        <input type="hidden" name="partyCode" value={partyCode} />
        {state?.error && (
          <p className="text-sm font-medium text-destructive mt-2 text-center">
            {typeof state.error === "string"
              ? state.error
              : "Error adding combatant"}
          </p>
        )}
      </Field>
      <AlertDialogFooter className="mt-4">
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding to party..." : "Add to Party"}
        </Button>
      </AlertDialogFooter>
    </form>
  );
};

const AddCombatantDialog = ({ floating = false }: { floating?: boolean }) => {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const partyCode = params.code as string;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {floating ? (
          <Button
            size="icon"
            className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg cursor-pointer z-50"
          >
            <PlusIcon className="w-7 h-7" />
          </Button>
        ) : (
          <Button size="lg" className="cursor-pointer">
            Add Combatant
            <PlusIcon />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Combatant</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the combatant's info to add it to the party
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AddCombatantToPartyForm
          onSuccess={() => setOpen(false)}
          partyCode={partyCode}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddCombatantDialog;
