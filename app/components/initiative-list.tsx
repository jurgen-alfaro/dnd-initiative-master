"use client";

import { useTransition } from "react";
import { updateInitiative } from "@/app/server/actions";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Sword, Shield } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import AddCombatantToPartyDialog from "./ui/AddCombatantToPartyDialog";

// Definición de tipos para las props
type Combatant = {
  id: number;
  name: string;
  initiative: number;
  type: "player" | "enemy";
};

interface InitiativeListProps {
  data: Combatant[];
  partyCode: string;
  isDm: boolean;
}

export default function InitiativeList({
  data,
  partyCode,
  isDm,
}: InitiativeListProps) {
  const [isPending, startTransition] = useTransition();

  // Función para manejar el cambio (debounce recomendado en producción, aquí directo para demo)
  const handleInitiativeChange = (id: number, val: string) => {
    const numVal = parseInt(val);
    if (isNaN(numVal)) return;

    startTransition(async () => {
      await updateInitiative(id, numVal, partyCode);
    });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      {data.map((char, index) => (
        <Card
          key={char.id}
          className={`
            p-4 border-l-4 transition-all
            ${index === 0 ? "border-l-yellow-500 bg-yellow-50/10 scale-105 shadow-lg" : "border-l-slate-500"}
            ${char.type === "enemy" ? "bg-red-950/20" : "bg-slate-900/50"}
          `}
        >
          <div className="flex items-center justify-center gap-4">
            {/* <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-200 font-bold">
              {index + 1}
            </div> */}
            <div className="w-full flex  justify-between ">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {char.name}
              </h3>
              <Badge
                variant={char.type === "enemy" ? "destructive" : "default"}
                className="text-xs"
              >
                {char.type === "enemy" ? "Enemy" : "Hero"}
                {char.type === "enemy" ? (
                  <Sword size={16} />
                ) : (
                  <Shield size={16} className="text-blue-500" />
                )}
              </Badge>
            </div>
          </div>

          <div className="flex  gap-2">
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mr-2">INIT</span>
              {isDm ? (
                <Input
                  type="number"
                  defaultValue={char.initiative}
                  className="w-20 text-center font-mono text-lg font-bold"
                  onBlur={(e) =>
                    handleInitiativeChange(char.id, e.target.value)
                  }
                  disabled={isPending}
                />
              ) : (
                <div className="w-20 text-center font-mono text-2xl font-bold">
                  {char.initiative}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground mr-2">AC</span>
              {isDm ? (
                <Input
                  type="number"
                  defaultValue={char.ac}
                  className="w-20 text-center font-mono text-lg font-bold"
                  onBlur={(e) =>
                    handleInitiativeChange(char.id, e.target.value)
                  }
                  disabled={isPending}
                />
              ) : (
                <div className="w-20 text-center font-mono text-2xl font-bold">
                  {char.initiative}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {data.length === 0 ? (
        <div className="flex flex-col items-center">
          <div className="text-center py-10 text-muted-foreground">
            Battle has not started.
            <br />
            Waiting for combatants...
          </div>
          <AddCombatantToPartyDialog />
        </div>
      ) : (
        <AddCombatantToPartyDialog floating />
      )}
    </div>
  );
}
