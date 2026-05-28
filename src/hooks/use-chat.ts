"use client"

// src/hooks/use-chat.ts
// Custom hook untuk state chat: fetch history, subscribe Supabase Realtime, kirim & read
//
// Strategi dual-mode:
// - Supabase Realtime  → bekerja di PROD (Supabase DB) untuk push instan
// - Polling fallback   → bekerja di DEV (Docker DB) karena Supabase Realtime
//                        tidak bisa mendeteksi INSERT ke database Docker yang terpisah
//
// Deduplication via message ID memastikan tidak ada pesan ganda meski keduanya aktif.

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"

// Interval polling (ms). Di DEV aktif sebagai satu-satunya mekanisme realtime.
// Di PROD, Supabase Realtime lebih cepat — polling ini redundant tapi tidak berbahaya.
const POLLING_INTERVAL_MS = 3000

// ---------------------------------------------------------------------------
// Types (selaras dengan response EnrichedMessage dari chat.ts server)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string
  orderId: string
  senderClerkId: string
  senderNama: string
  senderAvatarUrl: string
  pesan: string
  isRead: boolean
  createdAt: string
}

interface RealtimePayload {
  id: string
  order_id: string
  sender_clerk_id: string
  pesan: string
  is_read: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat(
  orderId: string,
  currentUserClerkId: string | null | undefined,
  isEnabled: boolean = true,
  isReadOnly: boolean = false,
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // -------------------------------------------------------------------------
  // Merge helper: gabungkan pesan baru ke state tanpa duplikat (dedup by id)
  // -------------------------------------------------------------------------
  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    setChatMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id))
      const newOnes = incoming.filter((m) => !existingIds.has(m.id))
      if (newOnes.length === 0) return prev
      return [...prev, ...newOnes].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })
  }, [])

  // -------------------------------------------------------------------------
  // Fetch history pesan dari API (dipakai saat init & polling)
  // -------------------------------------------------------------------------
  const fetchFromApi = useCallback(async (isInitialLoad = false) => {
    if (!orderId) return
    if (isInitialLoad) {
      setIsLoading(true)
      setError(null)
    }
    try {
      const res = await fetch(`/api/chat/${orderId}`)
      const json = await res.json() as { success: boolean; data: ChatMessage[]; error?: string }
      if (json.success) {
        if (isInitialLoad) {
          // Load pertama: set seluruh data sekaligus
          setChatMessages(json.data)
        } else {
          // Polling: merge incremental tanpa reset scroll
          mergeMessages(json.data)
        }
      } else if (isInitialLoad) {
        setError(json.error ?? "Gagal mengambil riwayat pesan")
      }
    } catch {
      if (isInitialLoad) setError("Terjadi kesalahan koneksi")
    } finally {
      if (isInitialLoad) setIsLoading(false)
    }
  }, [orderId, mergeMessages])

  // -------------------------------------------------------------------------
  // Subscribe Supabase Realtime — aktif di PROD (Supabase DB)
  // Payload postgres_changes menggunakan snake_case (nama kolom DB)
  // -------------------------------------------------------------------------
  const subscribeRealtime = useCallback(() => {
    if (!orderId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const raw = payload.new as RealtimePayload

          // Fetch ulang history agar senderNama ter-enrich dari Clerk
          // (Supabase Realtime payload tidak menyertakan joined/computed fields)
          void fetchFromApi(false)

          // Optimistic: tambahkan langsung ke state dengan nama fallback
          // fetchFromApi di atas akan segera menggantikannya via dedup
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === raw.id)) return prev
            const newMsg: ChatMessage = {
              id: raw.id,
              orderId: raw.order_id,
              senderClerkId: raw.sender_clerk_id,
              senderNama: "Pengguna",
              senderAvatarUrl: "",
              pesan: raw.pesan,
              isRead: raw.is_read,
              createdAt: raw.created_at,
            }
            return [...prev, newMsg]
          })
        },
      )
      .subscribe()

    channelRef.current = channel
  }, [orderId, fetchFromApi])

  // -------------------------------------------------------------------------
  // Polling fallback — aktif di DEV (Docker DB) dan sebagai safety net di PROD
  // -------------------------------------------------------------------------
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => {
      void fetchFromApi(false)
    }, POLLING_INTERVAL_MS)
  }, [fetchFromApi])

  // -------------------------------------------------------------------------
  // Kirim pesan baru
  // -------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (pesan: string): Promise<boolean> => {
      if (!pesan.trim() || !orderId) return false
      setIsSending(true)
      try {
        const res = await fetch(`/api/chat/${orderId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pesan }),
        })
        const json = await res.json() as { success: boolean; error?: string }
        if (!json.success) {
          setError(json.error ?? "Gagal mengirim pesan")
          return false
        }
        // Fetch ulang untuk mendapatkan senderNama ter-enrich dari Clerk
        await fetchFromApi(false)
        return true
      } catch {
        setError("Terjadi kesalahan saat mengirim pesan")
        return false
      } finally {
        setIsSending(false)
      }
    },
    [orderId, fetchFromApi],
  )

  // -------------------------------------------------------------------------
  // Mark pesan masuk sebagai dibaca
  // -------------------------------------------------------------------------
  const markAsRead = useCallback(async () => {
    if (!orderId || !currentUserClerkId) return
    const hasUnread = chatMessages.some(
      (m) => !m.isRead && m.senderClerkId !== currentUserClerkId,
    )
    if (!hasUnread) return

    try {
      await fetch(`/api/chat/${orderId}/read`, { method: "PATCH" })
      setChatMessages((prev) =>
        prev.map((m) =>
          m.senderClerkId !== currentUserClerkId ? { ...m, isRead: true } : m,
        ),
      )
    } catch {
      // Silent fail — tidak kritis
    }
  }, [orderId, currentUserClerkId, chatMessages])

  // -------------------------------------------------------------------------
  // Lifecycle: mount → initial fetch + subscribe Realtime + start polling
  //            unmount → cleanup semua
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    void fetchFromApi(true)

    // Jika order sudah selesai/dibatalkan, tidak ada pesan baru yang mungkin datang.
    // Cukup fetch sekali saat dibuka, skip realtime dan polling.
    if (isReadOnly) {
      return
    }

    subscribeRealtime()
    startPolling()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isEnabled, isReadOnly, fetchFromApi, subscribeRealtime, startPolling])

  return {
    chatMessages,
    isLoading,
    isSending,
    error,
    sendMessage,
    markAsRead,
  }
}
