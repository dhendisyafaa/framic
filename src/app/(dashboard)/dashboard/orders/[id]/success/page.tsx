"use client"

import Link from "next/link"
import { CheckCircle2, ArrowRight, Home, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-emerald-500/10 p-10 text-center space-y-8 border border-white">
          {/* Animated Success Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl rotate-12 animate-pulse" />
            <div className="absolute inset-0 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-white animate-in zoom-in spin-in-12 duration-1000" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Pembayaran Berhasil!</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Terima kasih! Pembayaran Anda telah kami terima dan status order Anda akan segera diperbarui secara otomatis.
            </p>
          </div>

          <div className="grid gap-3 pt-4">
            <Link href="/orders">
              <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 font-black gap-2 group transition-all">
                Cek Daftar Order
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 font-bold gap-2">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/photographers">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-200 font-bold gap-2">
                  <Calendar className="w-4 h-4" />
                  Cari Lagi
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Sistem Pembayaran Aman oleh Xendit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
