"use client"

// src/components/features/chat/chat-bubble.tsx
// Komponen visual balon pesan tunggal dalam chat window

import { CheckCheck, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/hooks/use-chat"

interface ChatBubbleProps {
  message: ChatMessage
  isSelf: boolean
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

export function ChatBubble({ message, isSelf }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[78%] animate-in fade-in slide-in-from-bottom-1 duration-200",
        isSelf ? "self-end items-end" : "self-start items-start",
      )}
    >
      {/* Nama pengirim — hanya tampil untuk pesan orang lain */}
      {!isSelf && (
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
          {message.senderNama}
        </span>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
          isSelf
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border text-foreground rounded-bl-sm",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.pesan}</p>
      </div>

      {/* Timestamp + read indicator */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
        {isSelf && (
          <span className={cn("text-[10px]", message.isRead ? "text-primary" : "text-muted-foreground/50")}>
            {message.isRead ? (
              <CheckCheck className="w-3 h-3" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </div>
  )
}
