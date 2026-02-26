import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Shield, Sword, SwordsIcon } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import CopyableCode from "./CopyableCode";
import { Party } from "../lib/types";

interface PartyInfoCard {
  party: Party;
  playerCount: number;
  enemyCount: number;
}

const PartyInfoCard = ({ party, playerCount, enemyCount }: PartyInfoCard) => {
  const currentRound = party.currentRound;

  return (
    <Card className="max-w-2xl mx-auto mb-8 dnd-card-ornate dnd-parchment-texture overflow-hidden">
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
          <div className="flex flex-col gap-2 items-end">
            <Badge className="dnd-badge-active font-heading text-xs tracking-wider">
              Round {currentRound}
            </Badge>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 text-sm">
          <span className="flex items-center gap-2 text-dnd-hero-blue-bright">
            <Shield size={16} className="text-dnd-hero-blue" />
            <span className="font-heading font-semibold">{playerCount}</span>
            <span className="text-muted-foreground">
              Heroe{playerCount !== 1 ? "s" : ""}
            </span>
          </span>
          <Separator orientation="vertical" className="h-5 bg-dnd-gold/20" />
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
  );
};

export default PartyInfoCard;
