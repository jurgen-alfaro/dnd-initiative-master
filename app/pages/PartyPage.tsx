import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import InitiativeList from "@/app/components/initiative-list";
import { Shield, Sword, SwordsIcon } from "lucide-react";
import CopyableCode from "@/app/components/CopyableCode";
import type { Combatant } from "@/app/lib/types";

type Party = {
  id: number;
  name: string;
  code: string;
  isActive: boolean | null;
  createdAt: Date;
  combatants: (Combatant & { partyId: number; createdAt: Date })[];
};

interface PartyPageProps {
  party: Party;
}

export default function PartyPage({ party }: PartyPageProps) {
  const playerCount = party.combatants.filter(
    (c) => c.type === "player",
  ).length;
  const enemyCount = party.combatants.filter((c) => c.type === "enemy").length;

  const sortedCombatants = [...party.combatants].sort(
    (a, b) => b.initiative - a.initiative,
  );

  return (
    <main className="min-h-screen py-10 px-4 dnd-page-bg">
      <div className="max-w-2xl mx-auto mb-8">
        <Card className="dnd-card-ornate dnd-parchment-texture overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SwordsIcon className="text-dnd-gold-dim" size={42} />
                <div>
                  <CardTitle className="text-3xl font-heading font-bold tracking-wide text-dnd-gold">
                    {party.name}
                  </CardTitle>
                  <CardDescription className="text-sm mt-2">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">
                      Party Code
                    </span>
                    <br />
                    <CopyableCode code={party.code} />
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  party.isActive
                    ? "dnd-badge-active font-heading text-xs tracking-wider"
                    : "dnd-badge-inactive font-heading text-xs tracking-wider"
                }
              >
                {party.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm">
              <span className="flex items-center gap-2 text-dnd-hero-blue-bright">
                <Shield size={16} className="text-dnd-hero-blue" />
                <span className="font-heading font-semibold">
                  {playerCount}
                </span>
                <span className="text-muted-foreground">
                  Heroe{playerCount !== 1 ? "s" : ""}
                </span>
              </span>
              <Separator
                orientation="vertical"
                className="h-5 bg-dnd-gold/20"
              />
              <span className="flex items-center gap-2 text-dnd-blood-bright">
                <Sword size={16} className="text-dnd-blood" />
                <span className="font-heading font-semibold">{enemyCount}</span>
                <span className="text-muted-foreground">
                  {enemyCount !== 1 ? "Enemies" : "Enemy"}
                </span>
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
