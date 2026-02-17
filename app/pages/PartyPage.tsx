import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import InitiativeList from "@/app/components/initiative-list";
import { Shield, Users } from "lucide-react";

type Combatant = {
  id: number;
  name: string;
  initiative: number;
  type: "player" | "enemy";
  partyId: number;
  createdAt: Date;
};

type Party = {
  id: number;
  name: string;
  code: string;
  isActive: boolean | null;
  createdAt: Date;
  combatants: Combatant[];
};

interface PartyPageProps {
  party: Party;
}

export default function PartyPage({ party }: PartyPageProps) {
  const playerCount = party.combatants.filter(
    (c) => c.type === "player"
  ).length;
  const enemyCount = party.combatants.filter(
    (c) => c.type === "enemy"
  ).length;

  const sortedCombatants = [...party.combatants].sort(
    (a, b) => b.initiative - a.initiative
  );

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="text-primary" size={28} />
                <div>
                  <CardTitle className="text-2xl">{party.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Código:{" "}
                    <span className="font-mono font-bold tracking-widest text-foreground">
                      {party.code}
                    </span>
                  </CardDescription>
                </div>
              </div>
              <Badge variant={party.isActive ? "default" : "secondary"}>
                {party.isActive ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users size={14} />
                {playerCount} Héroe{playerCount !== 1 ? "s" : ""}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>
                {enemyCount} Enemigo{enemyCount !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <InitiativeList
        data={sortedCombatants}
        partyCode={party.code}
        isDm={true}
      />
    </main>
  );
}
