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
import RoundEditDialog from "./RoundEditDialog";
import PartyNameEditDialog from "./PartyNameEditDialog";
import SessionNotesDrawer from "./SessionNotesDrawer";
import { Party } from "../lib/types";

interface PartyInfoCardProps {
  party: Party;
  playerCount: number;
  enemyCount: number;
  onRoundEdit: (newRound: number) => Promise<void>;
  onPartyNameEdit: (newName: string) => Promise<void>;
  isPending?: boolean;
  isDm?: boolean;
  dmToken?: string | null;
}

const PartyInfoCard = ({
  party,
  playerCount,
  enemyCount,
  onRoundEdit,
  onPartyNameEdit,
  isPending = false,
  isDm = false,
  dmToken = null,
}: PartyInfoCardProps) => {
  const currentRound = party.currentRound;

  return (
    <Card className="max-w-2xl mx-auto mb-8 dnd-card-ornate dnd-parchment-texture overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SwordsIcon className="text-dnd-gold-dim" size={42} />
            <div>
              <PartyNameEditDialog
                currentName={party.name}
                onSave={onPartyNameEdit}
                isPending={isPending}
              >
                <CardTitle className="text-3xl font-heading font-bold tracking-wide text-dnd-gold cursor-pointer hover:text-dnd-gold-bright transition-colors">
                  {party.name}
                </CardTitle>
              </PartyNameEditDialog>
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
            <RoundEditDialog
              currentRound={currentRound}
              onSave={onRoundEdit}
              isPending={isPending}
            >
              <Badge
                className="dnd-badge-active font-heading text-xs tracking-wider cursor-pointer hover:bg-dnd-gold/20 transition-colors"
                role="button"
                tabIndex={0}
              >
                Round {currentRound}
              </Badge>
            </RoundEditDialog>
            <SessionNotesDrawer
              partyCode={party.code}
              isDm={isDm}
              dmToken={dmToken}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 text-sm">
          <span className="flex items-center gap-2 text-dnd-hero-blue-bright">
            <Shield size={16} className="text-dnd-hero-blue" />
            <span className="font-heading font-semibold">{playerCount}</span>
            <span className="text-muted-foreground">
              Hero{playerCount !== 1 ? "es" : ""}
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
