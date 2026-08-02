"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { formatMessageTime } from "@/app/lib/date-format";
import type { ArchivedChatMessage } from "@/app/lib/message-archive";
import type { MessageSender } from "@/app/lib/types";

interface MessageThreadViewProps {
  messages: ArchivedChatMessage[];
  /** Which side the reader is on, so their own messages align right. */
  ownSide: MessageSender;
  onSend: (body: string) => Promise<void>;
  isSending: boolean;
  error: string | null;
}

/** Index of the first message that only exists in the local archive, or -1. */
function firstLocalOnlyIndex(messages: ArchivedChatMessage[]): number {
  return messages.findIndex((m) => m.isLocalOnly);
}

export default function MessageThreadView({
  messages,
  ownSide,
  onSend,
  isSending,
  error,
}: MessageThreadViewProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Follow the conversation as it grows, the way every chat does.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (body === "" || isSending) return;

    // Clear optimistically so typing can continue; a failed send surfaces the
    // error above the composer and the text is still in the thread history.
    setDraft("");
    await onSend(body);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const archiveBoundary = firstLocalOnlyIndex(messages);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Whatever you write here stays between the two of
            you.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message, index) => (
              <li key={message.id}>
                {index === archiveBoundary && (
                  <div className="my-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Separator className="flex-1 bg-dnd-gold/15" />
                    <span className="flex shrink-0 items-center gap-1">
                      <Archive size={11} /> Older than 30 days — kept only on
                      this device
                    </span>
                    <Separator className="flex-1 bg-dnd-gold/15" />
                  </div>
                )}
                <div
                  className={
                    message.sender === ownSide
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={[
                      "max-w-[80%] rounded-lg border px-3 py-2",
                      message.sender === ownSide
                        ? "border-dnd-gold/25 bg-dnd-gold/10"
                        : "border-dnd-hero-blue/25 bg-dnd-hero-blue/10",
                      message.isLocalOnly
                        ? "border-dashed border-dnd-gold/20 opacity-70"
                        : "",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm text-dnd-parchment/90">
                      {message.body}
                    </p>
                    <p className="mt-1 text-right text-[11px] text-muted-foreground">
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-dnd-gold/20 px-5 py-4">
        {error && <p className="mb-2 text-sm text-dnd-blood-bright">{error}</p>}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a private message..."
            rows={2}
            maxLength={2000}
            className="max-h-32 flex-1 resize-none border-dnd-gold/20 bg-transparent"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void handleSend()}
            disabled={isSending || draft.trim() === ""}
            className="cursor-pointer"
          >
            <Send size={16} />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Enter sends · Shift+Enter adds a line break
        </p>
      </div>
    </div>
  );
}
