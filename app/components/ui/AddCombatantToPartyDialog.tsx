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
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import {
  Dice1Icon,
  Dice2Icon,
  Dice3Icon,
  Dice4Icon,
  Dice5Icon,
  PlusIcon,
  Shield,
  Sword,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
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

// Form sub-component to isolate state
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
  const [hp, setHp] = useState("");
  const [ac, setAc] = useState("");

  // Close dialog on success
  useEffect(() => {
    if (state && "success" in state && state.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const handleNumericChange =
    (setter: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === "") {
        setter("");
        return;
      }

      // Allow only numbers and max 3 digits
      if (!/^\d*$/.test(value)) return;

      if (Number(value) <= 100 && value.length <= 3) {
        setter(value);
      }
    };

  return (
    <form action={formAction}>
      <div className="flex max-w-sm flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="combatantName">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              maxLength={30}
              id="combatantName"
              name="combatantName"
              placeholder={placeholderName}
              required
            />
            <InputGroupAddon align="inline-start">
              <Dice1Icon className="text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="type">Type</FieldLabel>
          <Select name="type" required>
            <SelectTrigger id="type" className="w-full flex justify-start">
              <Dice2Icon className="text-muted-foreground" />
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Type</SelectLabel>
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
        </Field>

        <div className="flex gap-2">
          <Field>
            <FieldLabel htmlFor="initiative">Initiative</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="text"
                inputMode="numeric"
                id="initiative"
                name="initiative"
                placeholder="10"
                value={initiative}
                onChange={handleNumericChange(setInitiative)}
                maxLength={3}
              />
              <InputGroupAddon align="inline-start">
                <Dice3Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="hp">Max HP</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="text"
                inputMode="numeric"
                id="hp"
                name="hp"
                placeholder="10"
                value={hp}
                onChange={handleNumericChange(setHp)}
                maxLength={3}
              />
              <InputGroupAddon align="inline-start">
                <Dice4Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="ac">AC</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="text"
                inputMode="numeric"
                id="ac"
                name="ac"
                placeholder="10"
                value={ac}
                onChange={handleNumericChange(setAc)}
                maxLength={3}
                max={3}
              />
              <InputGroupAddon align="inline-start">
                <Dice5Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>

        <input type="hidden" name="partyCode" value={partyCode} />
        {state?.error && (
          <FieldError>
            {typeof state.error === "string"
              ? state.error
              : "Error adding combatant"}
          </FieldError>
        )}
      </div>
      <AlertDialogFooter className="mt-4">
        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
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
