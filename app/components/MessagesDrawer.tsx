"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Loader2, MessageCircle, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import ClaimCharacterPanel from "./ClaimCharacterPanel";
import MessageThreadList from "./MessageThreadList";
import MessageThreadView from "./MessageThreadView";
import type { PartyMessagingState } from "@/app/lib/hooks/usePartyMessages";
import type { Combatant } from "@/app/lib/types";

interface MessagesDrawerProps {
  messaging: PartyMessagingState;
  combatants: Combatant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Private messaging between the DM and a single player character. It routes
 * between three views depending on who the server says the caller is: the DM's
 * inbox, a player's own thread, or the character picker for a player who has
 * not claimed one yet.
 */
export default function MessagesDrawer({
  messaging,
  combatants,
  open,
  onOpenChange,
}: MessagesDrawerProps) {
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<number | null>(null);
  const [isDeleteArchiveOpen, setIsDeleteArchiveOpen] = useState(false);

  const {
    role,
    threads,
    unclaimedCombatants,
    activeThread,
    isSending,
    error,
    openThread,
    handleSend,
    handleClaim,
    handleReleaseOwn,
    handleReleaseAsDm,
    isArchiveEnabled,
    handleToggleArchive,
    handleDeleteArchive,
    refresh,
  } = messaging;

  // Pull fresh state whenever the drawer opens, so a badge seen minutes ago
  // never renders a stale thread.
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  // Close on Escape and lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  const isDm = role === "dm";
  const isThreadOpen = activeThread !== null;
  const canGoBack = isDm && isThreadOpen;

  const title = isThreadOpen ? activeThread.combatantName : "Messages";

  const confirmRelease = () => {
    if (isDm && releaseTarget !== null) {
      void handleReleaseAsDm(releaseTarget);
    } else if (!isDm) {
      void handleReleaseOwn();
    }
    setIsReleaseOpen(false);
    setReleaseTarget(null);
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <aside className="flex h-full w-full max-w-md flex-col bg-card dnd-card-ornate dnd-parchment-texture shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-dnd-gold/20 px-5 py-4">
            <div className="flex items-center gap-2">
              {canGoBack ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openThread(null)}
                  className="cursor-pointer text-dnd-gold"
                >
                  <ArrowLeft size={18} />
                  <span className="sr-only">Back to all threads</span>
                </Button>
              ) : (
                <MessageCircle className="text-dnd-gold" size={20} />
              )}
              <h2 className="font-heading text-lg font-bold tracking-wide text-dnd-gold">
                {title}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-muted-foreground hover:text-dnd-parchment"
            >
              <X size={20} />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Archive controls */}
          <div className="flex items-start justify-between gap-3 border-b border-dnd-gold/15 px-5 py-3">
            <label className="flex cursor-pointer items-start gap-2">
              <Checkbox
                checked={isArchiveEnabled}
                onCheckedChange={(checked) =>
                  handleToggleArchive(checked === true)
                }
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground">
                Keep a copy on this device. Messages are deleted from the server
                after 30 days; the copy is stored unencrypted in this browser.
              </span>
            </label>
            {isArchiveEnabled && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsDeleteArchiveOpen(true)}
                className="cursor-pointer shrink-0 text-muted-foreground hover:text-dnd-blood-bright"
              >
                <Trash2 size={15} />
                <span className="sr-only">Delete local copy</span>
              </Button>
            )}
          </div>

          {/* Body */}
          {role === "loading" ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : role === "unclaimed" ? (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ClaimCharacterPanel
                combatants={combatants}
                onClaim={handleClaim}
                error={error}
              />
            </div>
          ) : isThreadOpen ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <MessageThreadView
                messages={activeThread.messages}
                ownSide={isDm ? "dm" : "player"}
                onSend={handleSend}
                isSending={isSending}
                error={error}
              />
              <div className="border-t border-dnd-gold/15 px-5 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReleaseTarget(activeThread.combatantId);
                    setIsReleaseOpen(true);
                  }}
                  className="w-full cursor-pointer text-xs text-muted-foreground hover:text-dnd-blood-bright"
                >
                  {isDm
                    ? `Release ${activeThread.combatantName}`
                    : "Release my character"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <MessageThreadList
                threads={threads}
                unclaimedCombatants={unclaimedCombatants}
                onOpenThread={openThread}
              />
              {error && (
                <p className="mt-3 text-sm text-dnd-blood-bright">{error}</p>
              )}
            </div>
          )}
        </aside>
      </div>

      <AlertDialog open={isReleaseOpen} onOpenChange={setIsReleaseOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Release this character?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone in the party will be able to claim it — and whoever does
              will read the whole conversation, because the history belongs to
              the character rather than to a device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReleaseTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRelease}>
              Release
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteArchiveOpen}
        onOpenChange={setIsDeleteArchiveOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the local copy?</AlertDialogTitle>
            <AlertDialogDescription>
              Messages older than 30 days are already gone from the server, so
              they cannot be recovered once this device forgets them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDeleteArchive();
                setIsDeleteArchiveOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>,
    document.body,
  );
}
