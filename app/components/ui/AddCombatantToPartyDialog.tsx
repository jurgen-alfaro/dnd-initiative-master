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
import { useParams } from "next/navigation";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/app/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import {
  Dice1Icon,
  Dice3Icon,
  Dice4Icon,
  Dice5Icon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useActionState, useState, useEffect } from "react";
import { addCombatantToParty } from "@/app/server/actions";
import CombatantTypeRadioGroup from "@/app/components/CombatantTypeRadioGroup";
import QuantityRadioGroup from "@/app/components/QuantityRadioGroup";
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
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [initiative, setInitiative] = useState("");
  const [hp, setHp] = useState("");
  const [ac, setAc] = useState("");

  const trimmedName = name.trim();
  const previewText =
    Array.from({ length: quantity }, (_, i) => `${trimmedName} ${i + 1}`)
      .slice(0, 3)
      .join(", ") + (quantity > 3 ? "..." : "");

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
      <div className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="combatantName">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              maxLength={30}
              id="combatantName"
              name="combatantName"
              placeholder={placeholderName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <InputGroupAddon align="inline-start">
              <Dice1Icon className="text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel>Quantity</FieldLabel>
          <QuantityRadioGroup value={quantity} onChange={setQuantity} />
          {quantity > 1 && trimmedName !== "" && (
            <FieldDescription>
              They will be added as: {previewText}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel>Type</FieldLabel>
          <CombatantTypeRadioGroup name="type" required />
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
      <DialogFooter className="mt-4">
        <DialogClose className="cursor-pointer">Cancel</DialogClose>
        <Button type="submit" disabled={isPending} className="cursor-pointer">
          {isPending
            ? "Adding..."
            : quantity === 1
              ? "Add to Party"
              : `Add ${quantity} Combatants`}
        </Button>
      </DialogFooter>
    </form>
  );
};

const AddCombatantDialog = ({
  floating = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  floating?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const params = useParams();
  const partyCode = params.code as string;

  // Controlled mode when open/onOpenChange are provided (e.g. driven by a menu);
  // otherwise the dialog owns its state and renders its own trigger button.
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {floating ? (
            <Button
              size="icon"
              className="fixed bottom-20 right-6 rounded-full w-14 h-14 shadow-lg cursor-pointer z-50"
            >
              <PlusIcon className="w-7 h-7" />
            </Button>
          ) : (
            <Button size="lg" className="cursor-pointer">
              Add Combatant
              <PlusIcon />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Combatant</DialogTitle>
          <DialogDescription>
            Enter the combatant's info to add it to the party
          </DialogDescription>
        </DialogHeader>
        <AddCombatantToPartyForm
          onSuccess={() => setOpen(false)}
          partyCode={partyCode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddCombatantDialog;
