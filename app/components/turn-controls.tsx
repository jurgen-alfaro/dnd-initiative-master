"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TurnControlsProps {
  partyCode: string;
  currentTurnIndex: number;
  currentRound: number;
  totalCombatants: number;
  isDm: boolean;
  onAdvanceTurn: () => Promise<void>;
  onPreviousTurn: () => Promise<void>;
  onNextRound: () => Promise<void>;
}

export function TurnControls({
  partyCode,
  currentTurnIndex,
  currentRound,
  totalCombatants,
  isDm,
  onAdvanceTurn,
  onPreviousTurn,
  onNextRound,
}: TurnControlsProps) {
  const [localPending, setLocalPending] = useState(false);

  // Don't show controls if not DM or no combatants
  if (!isDm || totalCombatants === 0) {
    return null;
  }

  const isAtStart = currentTurnIndex === 0;
  const isAtEnd = currentTurnIndex >= totalCombatants - 1;

  const handlePreviousTurn = async () => {
    setLocalPending(true);
    try {
      await onPreviousTurn();
    } finally {
      // Brief delay to prevent spam clicks
      setTimeout(() => setLocalPending(false), 300);
    }
  };

  const handleNextTurn = async () => {
    setLocalPending(true);
    try {
      await onAdvanceTurn();
    } finally {
      setTimeout(() => setLocalPending(false), 300);
    }
  };

  const handleNextRound = async () => {
    setLocalPending(true);
    try {
      await onNextRound();
    } finally {
      setTimeout(() => setLocalPending(false), 300);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-dnd-gold/20 p-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* Previous Turn Button */}
        <Button
          variant="outline"
          onClick={handlePreviousTurn}
          disabled={isAtStart || localPending}
          className="w-full sm:w-auto border-dnd-gold/30 hover:bg-dnd-gold/10 disabled:opacity-50 font-heading"
        >
          <ChevronLeft size={20} />
          Back
        </Button>

        {/* Next Round Button */}
        <Button
          variant="default"
          onClick={handleNextRound}
          disabled={localPending}
          className="w-full sm:w-auto bg-dnd-gold/20 border-2 border-dnd-gold hover:bg-dnd-gold/30 font-heading text-sm tracking-wider"
        >
          Next Round
        </Button>

        {/* Next Turn Button */}
        <Button
          variant="default"
          onClick={handleNextTurn}
          disabled={isAtEnd || localPending}
          className="w-full sm:w-auto disabled:opacity-50 font-heading"
        >
          Next Turn
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
}
