"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { SendIcon } from "lucide-react"

export function RequestEventButton({ eventId, isPhotographer }: { eventId: string; isPhotographer: boolean }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${eventId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal mengirim request")
      return json
    },
    onSuccess: () => {
      toast.success("Request berhasil dikirim!")
      setSubmitted(true)
      setOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  // Jika bukan fotografer, tidak tampil
  if (!isPhotographer) return null

  if (submitted) {
    return (
      <Button className="w-full bg-slate-100 text-slate-500 cursor-not-allowed font-bold" disabled>
        <SendIcon className="w-4 h-4 mr-2" /> Request Terkirim
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md">
          Request Masuk
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic">Ajukan Diri untuk Event</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Mitra akan meninjau profil dan portfolio Anda sebelum menyetujui request.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea 
            placeholder="Tulis pesan opsional untuk meyakinkan mitra (Max 200 karakter)..." 
            className="rounded-xl border-slate-200"
            rows={4}
            maxLength={200}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">Batal</Button>
          <Button 
            onClick={() => requestMutation.mutate()} 
            disabled={requestMutation.isPending}
            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
          >
            {requestMutation.isPending ? "Mengirim..." : "Kirim Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
