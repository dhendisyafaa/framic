"use client"

// src/components/features/chat/chat-window.tsx
// Side Sheet chat antara Kustomer dan Fotografer per order

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Send, Loader2, AlertCircle, WifiOff } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { id as localeId } from "date-fns/locale"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ChatBubble } from "./chat-bubble"
import { useChat, type ChatMessage } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return "Hari ini"
  if (isYesterday(date)) return "Kemarin"
  return format(date, "EEEE, d MMMM yyyy", { locale: localeId })
}

function groupByDate(messages: ChatMessage[]): [string, ChatMessage[]][] {
  const groups = new Map<string, ChatMessage[]>()
  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString()
    const existing = groups.get(dateKey) ?? []
    groups.set(dateKey, [...existing, msg])
  }
  return Array.from(groups.entries())
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  currentUserClerkId: string | null | undefined
  /** Status order — jika 'completed' atau 'cancelled' chat hanya baca */
  orderStatus?: string
  /** Nama lawan bicara untuk ditampilkan di header */
  partnerName: string
  /** Avatar URL lawan bicara */
  partnerAvatarUrl?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatWindow({
  isOpen,
  onClose,
  orderId,
  currentUserClerkId,
  orderStatus,
  partnerName,
  partnerAvatarUrl,
}: ChatWindowProps) {
  const isChatClosed = orderStatus === "completed" || orderStatus === "cancelled"

  const { chatMessages, isLoading, isSending, error, sendMessage, markAsRead } =
    useChat(orderId, currentUserClerkId, isOpen, isChatClosed)

  const [inputValue, setInputValue] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  // Mark as read ketika chat dibuka dan ada pesan baru
  useEffect(() => {
    if (isOpen && chatMessages.length > 0) {
      void markAsRead()
    }
  }, [isOpen, chatMessages, markAsRead])

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isSending) return
    setInputValue("")
    await sendMessage(text)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const grouped = groupByDate(chatMessages)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        side="right"
        className="!w-full sm:!w-[420px] sm:!max-w-[420px] p-0 flex flex-col bg-muted/30 border-l border-border"
      >
        {/* ----------------------------------------------------------------- */}
        {/* Header                                                             */}
        {/* ----------------------------------------------------------------- */}
        <SheetHeader className="shrink-0 bg-background border-b border-border p-5 flex-row items-center gap-3 space-y-0">
          <Avatar className="w-10 h-10 ring-2 ring-offset-2 ring-primary/30">
            <AvatarImage src={partnerAvatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
              {partnerName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-sm font-black text-foreground uppercase tracking-tight truncate">
              {partnerName}
            </SheetTitle>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              Chat Order
            </p>
          </div>
        </SheetHeader>

        {/* ----------------------------------------------------------------- */}
        {/* Message Area                                                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">Memuat pesan...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-rose-500">
              <WifiOff className="w-8 h-8" />
              <span className="text-xs font-black uppercase tracking-widest text-center">{error}</span>
            </div>
          )}

          {!isLoading && !error && chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/50">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Belum ada pesan</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">Mulai koordinasi dengan mengirim pesan pertama.</p>
              </div>
            </div>
          )}

          {!isLoading && grouped.map(([dateKey, msgs]) => (
            <div key={dateKey} className="space-y-2">
              {/* Date divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  {formatDateDivider(msgs[0].createdAt)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Bubbles */}
              <div className="flex flex-col gap-2">
                {msgs.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isSelf={msg.senderClerkId === currentUserClerkId}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Anchor scroll-to-bottom */}
          <div ref={bottomRef} />
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Privacy Notice                                                     */}
        {/* ----------------------------------------------------------------- */}
        <div className="shrink-0 px-4 pt-2">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-3 py-2">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-tight">
              Informasi kontak (nomor telepon & email) secara otomatis disembunyikan demi keamanan transaksi.
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Input Area                                                         */}
        {/* ----------------------------------------------------------------- */}
        {isChatClosed ? (
          <div className="shrink-0 p-4 bg-background border-t border-border">
            <div className="flex items-center justify-center gap-2 bg-muted/50 border border-border rounded-2xl px-4 py-3">
              <WifiOff className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground font-medium">
                Chat sudah ditutup — order telah {orderStatus === "completed" ? "selesai" : "dibatalkan"}
              </p>
            </div>
          </div>
        ) : (
          <div className="shrink-0 p-4 bg-background border-t border-border">
            <div className={cn(
              "flex items-end gap-2 bg-muted/50 border border-border rounded-3xl px-4 py-3 transition-all duration-200",
              "focus-within:border-primary/40 focus-within:bg-background focus-within:shadow-sm"
            )}>
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis pesan..."
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 max-h-32 overflow-y-auto leading-relaxed"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = "auto"
                  el.style.height = `${el.scrollHeight}px`
                }}
              />
              <Button
                size="icon"
                onClick={() => void handleSend()}
                disabled={!inputValue.trim() || isSending}
                className={cn(
                  "rounded-full w-9 h-9 shrink-0 transition-all duration-200",
                  inputValue.trim()
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md scale-100"
                    : "bg-muted text-muted-foreground scale-95"
                )}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground/50 mt-2 font-medium">
              Enter untuk kirim · Shift+Enter untuk baris baru
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
