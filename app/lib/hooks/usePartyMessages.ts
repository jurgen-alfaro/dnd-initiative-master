"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChatMessage,
  MessageRole,
  MessageThreadSummary,
} from "@/app/lib/types";
import {
  claimCombatant,
  markThreadRead,
  releaseCombatantClaim,
  releaseOwnClaim,
  sendPartyMessage,
} from "@/app/server/actions";
import {
  subscribeConnected,
  subscribePartyEvent,
} from "@/app/lib/pusher-client";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import {
  deletePartyArchives,
  isArchiveEnabled as readArchiveEnabled,
  mergeMessages,
  readArchive,
  saveArchive,
  setArchiveEnabled,
  type ArchivedChatMessage,
} from "@/app/lib/message-archive";

type UnclaimedCombatant = { id: number; name: string };

type ActiveThread = {
  combatantId: number;
  combatantName: string;
  messages: ArchivedChatMessage[];
  unreadCount: number;
};

export type PartyMessagingState = {
  role: MessageRole | "loading";
  threads: MessageThreadSummary[];
  unclaimedCombatants: UnclaimedCombatant[];
  activeThread: ActiveThread | null;
  unreadTotal: number;
  isSending: boolean;
  error: string | null;
  openThread: (combatantId: number | null) => void;
  handleSend: (body: string) => Promise<void>;
  handleClaim: (combatantId: number) => Promise<void>;
  handleReleaseOwn: () => Promise<void>;
  handleReleaseAsDm: (combatantId: number) => Promise<void>;
  isArchiveEnabled: boolean;
  handleToggleArchive: (enabled: boolean) => void;
  handleDeleteArchive: () => void;
  refresh: () => Promise<void>;
};

type MessagesResponse =
  | { role: "unclaimed"; retentionCutoff: string }
  | {
      role: "dm";
      retentionCutoff: string;
      threads: MessageThreadSummary[];
      unclaimedCombatants: UnclaimedCombatant[];
      totalUnread: number;
    }
  | {
      role: "dm" | "player";
      retentionCutoff: string;
      combatantId: number;
      combatantName: string;
      messages: ChatMessage[];
      unreadCount: number;
    };

function isThreadResponse(
  data: MessagesResponse,
): data is Extract<MessagesResponse, { combatantId: number }> {
  return "combatantId" in data;
}

/**
 * Drives the private DM ↔ player messaging for one party.
 *
 * Kept apart from `usePartySync` on purpose: it talks to a different endpoint,
 * has its own lifecycle (an open thread, a local archive) and takes no part in
 * the optimistic rollback machinery — folding it in would also re-render every
 * consumer of the party state on each incoming message.
 */
export function usePartyMessages(
  partyCode: string,
  isRoleResolved: boolean,
  dmToken: string | null,
  fallbackIntervalMs = 30000,
): PartyMessagingState {
  const [role, setRole] = useState<MessageRole | "loading">("loading");
  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [unclaimedCombatants, setUnclaimedCombatants] = useState<
    UnclaimedCombatant[]
  >([]);
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isArchiveOn, setIsArchiveOn] = useState(false);

  // Credentials and the open thread are mirrored in refs so the polling
  // callback stays stable and the subscription below never rebuilds.
  const dmTokenRef = useRef(dmToken);
  const deviceIdRef = useRef<string | null>(null);
  const openThreadIdRef = useRef<number | null>(null);
  const archiveOnRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dmTokenRef.current = dmToken;
  }, [dmToken]);

  // The device id only exists in the browser, so it is read after mount rather
  // than during render, which would break hydration. This effect is declared
  // before the fetching ones so the id is in place by the time they run.
  useEffect(() => {
    deviceIdRef.current = getOrCreateDeviceId();
  }, []);

  useEffect(() => {
    const enabled = readArchiveEnabled(partyCode);
    setIsArchiveOn(enabled);
    archiveOnRef.current = enabled;
  }, [partyCode]);

  const buildThread = useCallback(
    (
      partyCodeValue: string,
      combatantId: number,
      combatantName: string,
      serverMessages: ChatMessage[],
      retentionCutoff: string,
      unreadCount: number,
    ): ActiveThread => {
      if (!archiveOnRef.current) {
        return {
          combatantId,
          combatantName,
          unreadCount,
          messages: serverMessages.map((m) => ({ ...m, isLocalOnly: false })),
        };
      }

      const stored = readArchive(partyCodeValue, combatantId);
      const merged = mergeMessages(
        stored?.messages ?? [],
        serverMessages,
        retentionCutoff,
      );

      const result = saveArchive(
        partyCodeValue,
        combatantId,
        combatantName,
        merged.map(({ isLocalOnly: _isLocalOnly, ...m }) => m),
      );

      if (result.error) setError(result.error);

      return { combatantId, combatantName, unreadCount, messages: merged };
    },
    [],
  );

  const fetchMessages = useCallback(async () => {
    if (!isRoleResolved) return;

    try {
      const headers: Record<string, string> = {};
      if (dmTokenRef.current) headers["x-dm-token"] = dmTokenRef.current;
      if (deviceIdRef.current) headers["x-device-id"] = deviceIdRef.current;

      const openThreadId = openThreadIdRef.current;
      const query = openThreadId === null ? "" : `?combatantId=${openThreadId}`;

      const res = await fetch(`/api/party/${partyCode}/messages${query}`, {
        cache: "no-store",
        headers,
      });

      if (!res.ok) {
        // A thread that vanished (character deleted or claim released) should
        // drop the user back into the inbox instead of retrying forever.
        if (res.status === 404 || res.status === 403) {
          openThreadIdRef.current = null;
          setActiveThread(null);
        }
        return;
      }

      const data: MessagesResponse = await res.json();
      setRole(data.role);

      if (data.role === "unclaimed") {
        setThreads([]);
        setUnclaimedCombatants([]);
        setActiveThread(null);
        setUnreadTotal(0);
        return;
      }

      if (isThreadResponse(data)) {
        setActiveThread(
          buildThread(
            partyCode,
            data.combatantId,
            data.combatantName,
            data.messages,
            data.retentionCutoff,
            data.unreadCount,
          ),
        );
        // A player's whole inbox is their single thread.
        if (data.role === "player") setUnreadTotal(data.unreadCount);
        return;
      }

      setThreads(data.threads);
      setUnclaimedCombatants(data.unclaimedCombatants);
      setUnreadTotal(data.totalUnread);
      setActiveThread(null);
    } catch {
      console.error("Network error fetching messages for party", partyCode);
    }
  }, [partyCode, isRoleResolved, buildThread]);

  // Nothing is fetched until the caller knows whether this session is the DM:
  // a DM asking too early carries no token and would be told it is "unclaimed",
  // flashing the character picker in their face.
  useEffect(() => {
    if (!isRoleResolved) return;
    void fetchMessages();
  }, [isRoleResolved, fetchMessages]);

  useEffect(() => {
    if (!isRoleResolved) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void fetchMessages();
      }, 150);
    };

    const unsubscribeMessages = subscribePartyEvent(
      partyCode,
      "message",
      scheduleFetch,
    );
    const unsubscribeConnected = subscribeConnected(scheduleFetch);

    timerRef.current = setInterval(() => {
      void fetchMessages();
    }, fallbackIntervalMs);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      unsubscribeMessages();
      unsubscribeConnected();
    };
  }, [partyCode, isRoleResolved, fallbackIntervalMs, fetchMessages]);

  // Reading is only reported when there is something unread. Marking emits a
  // realtime signal so the sender sees the receipt live, and doing it
  // unconditionally would bounce signals between the two browsers forever.
  useEffect(() => {
    if (!activeThread || activeThread.unreadCount === 0) return;

    let cancelled = false;
    markThreadRead(
      partyCode,
      activeThread.combatantId,
      dmTokenRef.current,
      deviceIdRef.current,
    )
      .then((result) => {
        if (cancelled || !("success" in result)) return;
        setActiveThread((current) =>
          current && current.combatantId === activeThread.combatantId
            ? { ...current, unreadCount: 0 }
            : current,
        );
        setUnreadTotal((current) =>
          Math.max(0, current - activeThread.unreadCount),
        );
      })
      .catch((markError) => {
        console.error("Error marking thread as read:", markError);
      });

    return () => {
      cancelled = true;
    };
  }, [partyCode, activeThread]);

  const openThread = useCallback(
    (combatantId: number | null) => {
      openThreadIdRef.current = combatantId;
      setError(null);
      if (combatantId === null) setActiveThread(null);
      void fetchMessages();
    },
    [fetchMessages],
  );

  const handleSend = useCallback(
    async (body: string) => {
      const target = activeThread?.combatantId;
      if (target === undefined || isSending) return;

      setIsSending(true);
      setError(null);

      try {
        const result = await sendPartyMessage(
          partyCode,
          target,
          body,
          dmTokenRef.current,
          deviceIdRef.current,
        );

        if ("error" in result) {
          setError(result.error);
          return;
        }

        // Show the message straight away, then reconcile in the background.
        setActiveThread((current) =>
          current && current.combatantId === target
            ? {
                ...current,
                messages: [
                  ...current.messages,
                  { ...result.message, isLocalOnly: false },
                ],
              }
            : current,
        );

        void fetchMessages();
      } catch (sendError) {
        console.error("Error sending message:", sendError);
        setError("Error sending message");
      } finally {
        setIsSending(false);
      }
    },
    [partyCode, activeThread, isSending, fetchMessages],
  );

  const handleClaim = useCallback(
    async (combatantId: number) => {
      const currentDeviceId = deviceIdRef.current;
      if (!currentDeviceId) return;

      setError(null);

      try {
        const result = await claimCombatant(
          combatantId,
          partyCode,
          currentDeviceId,
        );

        if ("error" in result) {
          setError(result.error);
          return;
        }

        await fetchMessages();
      } catch (claimError) {
        console.error("Error claiming character:", claimError);
        setError("Error claiming character");
      }
    },
    [partyCode, fetchMessages],
  );

  const handleReleaseOwn = useCallback(async () => {
    const currentDeviceId = deviceIdRef.current;
    const target = activeThread?.combatantId;
    if (!currentDeviceId || target === undefined) return;

    setError(null);

    try {
      const result = await releaseOwnClaim(target, partyCode, currentDeviceId);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      openThreadIdRef.current = null;
      setActiveThread(null);
      await fetchMessages();
    } catch (releaseError) {
      console.error("Error releasing character:", releaseError);
      setError("Error releasing character");
    }
  }, [partyCode, activeThread, fetchMessages]);

  const handleReleaseAsDm = useCallback(
    async (combatantId: number) => {
      const currentDmToken = dmTokenRef.current;
      if (!currentDmToken) return;

      setError(null);

      try {
        const result = await releaseCombatantClaim(
          combatantId,
          partyCode,
          currentDmToken,
        );

        if ("error" in result) {
          setError(result.error);
          return;
        }

        if (openThreadIdRef.current === combatantId) {
          openThreadIdRef.current = null;
          setActiveThread(null);
        }
        await fetchMessages();
      } catch (releaseError) {
        console.error("Error releasing character:", releaseError);
        setError("Error releasing character");
      }
    },
    [partyCode, fetchMessages],
  );

  const handleToggleArchive = useCallback(
    (enabled: boolean) => {
      setArchiveEnabled(partyCode, enabled);
      archiveOnRef.current = enabled;
      setIsArchiveOn(enabled);
      setError(null);
      void fetchMessages();
    },
    [partyCode, fetchMessages],
  );

  const handleDeleteArchive = useCallback(() => {
    deletePartyArchives(partyCode);
    archiveOnRef.current = false;
    setIsArchiveOn(false);
    void fetchMessages();
  }, [partyCode, fetchMessages]);

  return {
    role,
    threads,
    unclaimedCombatants,
    activeThread,
    unreadTotal,
    isSending,
    error,
    openThread,
    handleSend,
    handleClaim,
    handleReleaseOwn,
    handleReleaseAsDm,
    isArchiveEnabled: isArchiveOn,
    handleToggleArchive,
    handleDeleteArchive,
    refresh: fetchMessages,
  };
}
