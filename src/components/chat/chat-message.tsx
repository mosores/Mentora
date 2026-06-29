"use client";

import React from "react";
import { BrainCircuit, UserRound, Loader2, FileText } from "lucide-react";
import { MarkdownMessage } from "./markdown-message";

export type Citation = {
  fileName: string;
  pageNumber: number | null;
  content: string;
};

export type ChatMessageData = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

interface ChatMessageProps {
  message: ChatMessageData;
  t: Record<string, string>;
}

export function ChatMessage({ message, t }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article 
      className={`mentora-chat-message chat-bubble ${isUser ? "is-user ml-auto max-w-[85%]" : "is-assistant mr-auto max-w-[90%]"} rounded-[18px] border p-4 transition-all duration-200`}
    >
      <div className="mentora-chat-message-meta mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--nb-muted)]">
        {isUser ? (
          <span className="mentora-chat-message-icon flex h-5 w-5 items-center justify-center rounded-full">
            <UserRound size={12} />
          </span>
        ) : (
          <span className="mentora-chat-message-icon flex h-5 w-5 items-center justify-center rounded-full">
            <BrainCircuit size={12} />
          </span>
        )}
        <span>{isUser ? t.you : t.mentor}</span>
      </div>

      <div className="chat-message-content">
        {message.content ? (
          <MarkdownMessage content={message.content} />
        ) : (
          <div className="flex items-center gap-2 py-1 text-sm text-[var(--nb-accent)]">
            <Loader2 className="animate-spin" size={14} />
            <span>{t.thinking || "Pensando..."}</span>
          </div>
        )}
      </div>

      {message.citations && message.citations.length > 0 && (
        <div className="mentora-citations mt-4 border-t pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--nb-muted)]">Citas y materiales:</p>
          <div className="flex flex-wrap gap-2">
            {message.citations.slice(0, 5).map((citation, index) => (
              <div 
                key={`${citation.fileName}-${index}`} 
                className="citation-chip flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all"
                title={citation.content}
              >
                <FileText size={12} />
                <span className="max-w-[120px] truncate font-medium">{citation.fileName}</span>
                {citation.pageNumber !== null && (
                  <span className="rounded px-1 py-px font-mono text-[10px]">
                    p. {citation.pageNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
