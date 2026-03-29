"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { CalendarView } from "@/components/features/calendar/calendar-view"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Camera, CheckCircle2, ChevronRight, MapPin, AlertCircle, Clock, ArrowLeft, Badge, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

const bookingSchema = z.object({
  paketId: z.string().uuid("Silakan pilih paket terlebih dahulu"),
  tanggalPotret: z.date({
    required_error: "Silakan pilih tanggal pemotretan",
    invalid_type_error: "Format tanggal tidak valid"
  }),
  lokasi: z.string().min(5, "Lokasi minimal 5 karakter"),
  catatan: z.string().optional(),
})

type BookingValues = z.infer<typeof bookingSchema>

interface BookingButtonProps {
  photographer: any
}

export function BookingButton({ photographer }: BookingButtonProps) {
  const [open, setOpen] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [step, setStep] = useState(1)
  const router = useRouter()

  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      paketId: "",
      lokasi: "",
      catatan: "",
    },
  })

  const { watch, setValue, trigger } = form
  const selectedPackageId = watch("paketId")
  const selectedDate = watch("tanggalPotret")

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      if (selectedPackageId || selectedDate || form.formState.isDirty) {
        setShowExitConfirm(true)
      } else {
        setOpen(false)
        setStep(1)
        form.reset()
      }
    } else {
      setOpen(true)
    }
  }

  const handleForceClose = () => {
    setOpen(false)
    setShowExitConfirm(false)
    setStep(1)
    form.reset()
  }

  const selectedPackage = photographer.packages.find((p: any) => p.id === selectedPackageId)

  const mutation = useMutation({
    mutationFn: async (values: BookingValues) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          photographerId: photographer.id,
          orderType: "direct",
          eventId: null,
          tanggalPotret: values.tanggalPotret.toISOString(),
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: (data) => {
      setOpen(false)
      toast.success("Orderan berhasil dibuat!")
      router.push(`/dashboard/orders/${data.id}`)
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const handleNext = async () => {
    let isValid = false
    if (step === 1) isValid = await trigger("paketId")
    else if (step === 2) isValid = await trigger("tanggalPotret")

    if (isValid) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const onSubmit = (values: BookingValues) => {
    mutation.mutate(values)
  }

  const steps = [
    { title: "Pilih Paket", id: 1 },
    { title: "Pilih Jadwal", id: 2 },
    { title: "Konfirmasi Orderan", id: 3 },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="flex-1 font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 rounded-[1.25rem] py-6 text-base group transition-all duration-500 hover:scale-[1.02]">
            Pesan Sesi Foto
            <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[700px] h-[98vh] p-0 overflow-y-scroll rounded-[2.5rem] border-none shadow-3xl bg-white">
          {/* Header Section with Image and Gradient Overlay */}
          <div className="relative h-48 flex flex-col justify-end p-8 overflow-hidden">
            <div
              className="absolute inset-0 bg-primary bg-center transition-transform duration-[2000ms] hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                {steps.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      step >= s.id ? "w-8 bg-emerald-400" : "w-4 bg-white/20"
                    )} />
                  </div>
                ))}
              </div>
              <DialogHeader>
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">
                  Step {step} of 3 — {steps[step - 1].title}
                </div>
                <DialogTitle className="text-4xl font-black italic tracking-tighter text-white">
                  {step === 1 ? "Pilih Layanan" : step === 2 ? "Tentukan Tanggal" : "Finalisasi Booking"}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {step === 1 && (
                  <FormField
                    control={form.control}
                    name="paketId"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {photographer.packages.map((pkg: any) => (
                            <div
                              key={pkg.id}
                              className={cn(
                                "group relative flex items-start gap-5 p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                                field.value === pkg.id
                                  ? "border-primary bg-primary/5 shadow-xl"
                                  : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg"
                              )}
                              onClick={() => field.onChange(pkg.id)}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 mt-1",
                                field.value === pkg.id ? "border-primary bg-primary" : "border-slate-200"
                              )}>
                                {field.value === pkg.id && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-black text-xl text-slate-900 tracking-tight">{pkg.namaPaket}</h4>
                                  <span className="font-black text-2xl text-primary tracking-tighter">Rp {pkg.harga.toLocaleString("id-ID")}</span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed italic pr-12 line-clamp-2">"{pkg.deskripsi}"</p>
                                <div className="flex gap-6 pt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm"><Clock className="w-3.5 h-3.5 text-primary" /> {pkg.durasiJam} Jam Sesi</span>
                                  <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm"><Camera className="w-3.5 h-3.5 text-primary" /> {pkg.jumlahFotoMin} Hasil Foto</span>
                                  {
                                    pkg.includesEditing && (
                                      <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm"><CheckCircle className="w-3.5 h-3.5 text-primary" />Termasuk Edit</span>
                                    )
                                  }
                                </div>
                              </div>
                              {field.value === pkg.id && (
                                <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary rotate-45 flex items-end justify-center pb-1 shadow-lg">
                                  <CheckCircle2 className="w-4 h-4 text-white -rotate-45" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <FormMessage className="font-bold text-center pt-2" />
                      </FormItem>
                    )}
                  />
                )}

                {step === 2 && (
                  <FormField
                    control={form.control}
                    name="tanggalPotret"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-8 items-center">
                        <div className="w-full bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                          <CalendarView
                            photographerId={photographer.id}
                            selectedDate={field.value}
                            onSelect={(date) => {
                              field.onChange(date)
                              if (date) handleNext() // Auto next for better UX
                            }}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {step === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="lokasi"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-rose-500" /> Lokasi Acara
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Alamat lengkap lokasi..."
                                className="rounded-2xl border-slate-200 p-7 font-bold text-slate-900 focus:ring-slate-900 transition-all shadow-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <Label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-500" /> Jadwal Terpilih
                        </Label>
                        <div className="p-4 bg-primary text-primary-foreground rounded-2xl flex items-center justify-between shadow-xl shadow-primary/10 transition-all duration-500">
                          <span className="font-black text-sm italic tracking-tight underline decoration-white/30">
                            {selectedDate && format(selectedDate, "eeee, d MMMM yyyy", { locale: idLocale })}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep(2)}
                            className="h-8 rounded-full text-[10px] font-black hover:bg-white/20 text-white"
                          >
                            UBAH
                          </Button>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="catatan"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" /> Instruksi Tambahan (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detail khusus untuk fotografer..."
                              className="rounded-[2rem] border-slate-200 font-medium min-h-[120px] p-6 focus:ring-slate-900 transition-all shadow-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-8 bg-slate-50/80 backdrop-blur-md rounded-[2.5rem] border border-slate-100 shadow-inner group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic group-hover:translate-x-1 transition-transform">Layanan Terpilih</span>
                          <Badge variant="secondary" className="rounded-full bg-white font-black px-4">{selectedPackage?.namaPaket}</Badge>
                        </div>
                        <div className="h-px bg-slate-200/50 w-full" />
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Investasi</span>
                            <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                              Rp {selectedPackage?.harga.toLocaleString("id-ID")}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status DP</span>
                            <div className="text-lg font-black text-emerald-600 italic">50% di muka</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-white border-t border-slate-100 flex items-center gap-4">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="rounded-2xl font-black px-6 h-16 border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleOpenChange(false)}
                    className="rounded-2xl font-black px-6 h-16 text-slate-400 hover:text-slate-600"
                  >
                    BATAL
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black h-16 text-lg tracking-tight shadow-2xl shadow-primary/20 group ripple-effect"
                  >
                    Lanjutkan
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex-1 rounded-2xl bg-primary text-primary-foreground font-black h-16 text-xl tracking-tight shadow-3xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                  >
                    {mutation.isPending ? "MEMPROSES..." : "BUAT ORDERAN"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* EXIT CONFIRMATION DIALOG */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="sm:max-w-[400px] p-8 rounded-[2.5rem] border-none shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-2">
              <AlertCircle size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tight">Batalkan Order?</DialogTitle>
            </DialogHeader>
            <p className="text-slate-500 font-medium leading-relaxed">
              Data yang sudah Anda pilih akan terhapus. Apakah Anda yakin ingin keluar dari proses booking ini?
            </p>
            <div className="flex flex-col w-full gap-3 pt-4">
              <Button
                className="w-full h-14 rounded-2xl font-black bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => setShowExitConfirm(false)}
              >
                LANJUTKAN ORDER
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={handleForceClose}
              >
                Ya, Batalkan Saja
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
