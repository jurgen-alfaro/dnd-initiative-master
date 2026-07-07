"use client";

import { useState } from "react";
import { PlusIcon, UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import AddCombatantToPartyDialog from "@/app/components/ui/AddCombatantToPartyDialog";
import AddBuffDialog from "@/app/components/AddBuffDialog";
import type { BuffKind, Combatant } from "@/app/lib/types";

interface AddActionsMenuProps {
  combatants: Combatant[];
  onAddBuff: (
    combatantIds: number[],
    name: string,
    kind: BuffKind,
    rounds: number,
  ) => Promise<void>;
  isPending: boolean;
}

export default function AddActionsMenu({
  combatants,
  onAddBuff,
  isPending,
}: AddActionsMenuProps) {
  const [combatantOpen, setCombatantOpen] = useState(false);
  const [buffOpen, setBuffOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-20 right-6 rounded-full w-14 h-14 shadow-lg cursor-pointer z-50"
          >
            <PlusIcon className="w-7 h-7" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-52">
          <DropdownMenuLabel>Add</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setCombatantOpen(true)}
          >
            <UserPlus className="text-dnd-hero-blue" />
            Add combatant
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setBuffOpen(true)}
          >
            <Sparkles className="text-indigo-400" />
            Add buff/debuff
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs are siblings of the menu, opened via controlled state */}
      <AddCombatantToPartyDialog
        open={combatantOpen}
        onOpenChange={setCombatantOpen}
      />
      <AddBuffDialog
        combatants={combatants}
        onAddBuff={onAddBuff}
        isPending={isPending}
        open={buffOpen}
        onOpenChange={setBuffOpen}
      />
    </>
  );
}
