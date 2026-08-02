"use client";

import { MessagesSquare, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { formatMessageTime } from "@/app/lib/date-format";
import type { MessageThreadSummary } from "@/app/lib/types";

interface MessageThreadListProps {
  threads: MessageThreadSummary[];
  unclaimedCombatants: { id: number; name: string }[];
  onOpenThread: (combatantId: number) => void;
}

/**
 * The DM's inbox: one row per claimed character. Characters nobody has claimed
 * are listed apart and are not openable — there is no one on the other end yet,
 * and anything written there would be read by whoever claims them later.
 */
export default function MessageThreadList({
  threads,
  unclaimedCombatants,
  onOpenThread,
}: MessageThreadListProps) {
  if (threads.length === 0 && unclaimedCombatants.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Add player characters to the party so they can message you.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {threads.length === 0 ? (
        <p className="pt-6 text-center text-sm text-muted-foreground">
          No one has claimed a character yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((thread) => (
            <li key={thread.combatantId}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenThread(thread.combatantId)}
                className="flex h-auto w-full cursor-pointer flex-col items-stretch gap-1 border-dnd-gold/20 px-4 py-3 text-left hover:border-dnd-gold/40 hover:bg-dnd-gold/10"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <UserRound className="size-4 shrink-0 text-dnd-hero-blue" />
                    <span className="font-heading font-semibold text-dnd-gold">
                      {thread.combatantName}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {thread.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(thread.lastMessage.createdAt)}
                      </span>
                    )}
                    {thread.unreadCount > 0 && (
                      <Badge className="min-w-5 justify-center bg-dnd-blood px-1.5 text-white">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </span>
                </span>
                <span className="truncate text-sm font-normal text-muted-foreground">
                  {thread.lastMessage
                    ? `${thread.lastMessage.sender === "dm" ? "You: " : ""}${thread.lastMessage.preview}`
                    : "No messages yet"}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {unclaimedCombatants.length > 0 && (
        <div className="border-t border-dnd-gold/15 pt-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <MessagesSquare size={13} /> Waiting for a player
          </h3>
          <ul className="flex flex-col gap-1">
            {unclaimedCombatants.map((character) => (
              <li
                key={character.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground"
              >
                <span>{character.name}</span>
                <span className="text-xs">Not claimed yet</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
