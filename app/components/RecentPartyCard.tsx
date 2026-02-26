"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { HistoryIcon, XIcon, SwordsIcon } from "lucide-react";
import type { RecentPartyData } from "@/app/lib/types";
import { formatRelativeTime } from "@/app/lib/time-utils";

interface RecentPartyCardProps {
  partyData: RecentPartyData;
  onDismiss: () => void;
}

export function RecentPartyCard({
  partyData,
  onDismiss,
}: RecentPartyCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleResume = async () => {
    setIsNavigating(true);
    setError(null);

    try {
      // Validate party still exists
      const res = await fetch(`/api/party/${partyData.code}`, {
        cache: "no-store",
      });

      if (res.status === 404) {
        // Party doesn't exist - dismiss card and clear localStorage
        onDismiss();
        return;
      }

      if (!res.ok) {
        setError("Failed to validate party");
        setIsNavigating(false);
        return;
      }

      // Navigate to party page
      router.push(`/party/${partyData.code}`);
    } catch (err) {
      console.error("Error resuming party:", err);
      setError("Network error. Please try again.");
      setIsNavigating(false);
    }
  };

  const relativeTime = formatRelativeTime(partyData.lastAccessedAt);

  return (
    <Card className="max-w-2xl mx-auto mb-6 dnd-card-ornate dnd-parchment-texture">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HistoryIcon className="text-dnd-gold-dim" size={32} />
            <CardTitle className="text-2xl font-heading text-dnd-gold">
              Return to Party
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            aria-label="Dismiss recent party card"
          >
            <XIcon className="text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Party Name</p>
          <p className="font-heading text-lg text-dnd-gold-bright">
            {partyData.name}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Party Code</p>
          <p className="font-mono text-sm font-semibold">{partyData.code}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Last Accessed</p>
          <p className="text-sm text-foreground">{relativeTime}</p>
        </div>
        {error && (
          <div className="text-sm font-medium text-destructive text-center">
            {error}
          </div>
        )}
        <Button
          className="w-full"
          size="lg"
          onClick={handleResume}
          disabled={isNavigating}
          aria-label={`Resume session for party ${partyData.name}`}
        >
          {isNavigating ? (
            "Loading..."
          ) : (
            <>
              <SwordsIcon />
              Resume Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
