"use client"

import { useState, useEffect } from "react"
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
import { Camera, CheckCircle2, ChevronRight, MapPin, AlertCircle, Clock, ArrowLeft, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const bookingSchema = z.object({
  paketId: z.string().uuid("Silakan pilih paket terlebih dahulu"),
  tanggalPotret: z.date({ message: "Silakan pilih tanggal pemotretan" }),
  lokasi: z.string().min(5, "Lokasi minimal 5 karakter"),
  catatan: z.string().optional(),
})

type BookingValues = z.input<typeof bookingSchema>

interface BookingButtonProps {
  photographer: any
}

export function BookingButton({ photographer }: BookingButtonProps) {
  const [open, setOpen] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [step, setStep] = useState(1)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!mounted) {
    return (
      <Button
        disabled={!photographer.isAcceptingOrders}
        className={cn(
          "flex-1 font-black shadow-2xl rounded-[1.25rem] py-6 text-base group transition-all duration-500 cursor-pointer",
          photographer.isAcceptingOrders
            ? "bg-accent hover:bg-accent/90 text-white shadow-accent/20 hover:scale-[1.02]"
            : "bg-muted/50 text-muted-foreground border-muted cursor-not-allowed shadow-none"
        )}
      >
        {photographer.isAcceptingOrders ? (
          <>
            Pesan Sesi Foto
            <ChevronRight className="ml-2 w-6 h-6" />
          </>
        ) : (
          <>
            <Clock className="mr-2 w-5 h-5" />
            Booking Ditutup
          </>
        )}
      </Button>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            disabled={!photographer.isAcceptingOrders}
            className={cn(
              "flex-1 font-black shadow-2xl rounded-[1.25rem] py-6 text-base group transition-all duration-500 cursor-pointer",
              photographer.isAcceptingOrders
                ? "bg-accent hover:bg-accent/90 text-white shadow-accent/20 hover:scale-[1.02]"
                : "bg-muted/50 text-muted-foreground border-muted cursor-not-allowed shadow-none"
            )}
          >
            {photographer.isAcceptingOrders ? (
              <>
                Pesan Sesi Foto
                <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <Clock className="mr-2 w-5 h-5" />
                Booking Ditutup
              </>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-[95vw] sm:max-w-[700px] h-[92vh] sm:h-auto sm:max-h-[90vh] p-0 overflow-y-auto rounded-[2.5rem] border-none shadow-3xl bg-card text-foreground">
          {/* Header Section with Image and Gradient Overlay */}
          <div className="relative h-36 sm:h-48 flex flex-col justify-end p-6 sm:p-8 overflow-hidden shrink-0">
            <div
              className="absolute inset-0 bg-[#FF5F00] bg-center transition-transform duration-[2000ms] hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141413] via-[#141413]/60 to-transparent" />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                {steps.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      step >= s.id ? "w-8 bg-accent" : "w-4 bg-white/20"
                    )} />
                  </div>
                ))}
              </div>
              <DialogHeader>
                <div className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
                  Step {step} of 3 — {steps[step - 1].title}
                </div>
                <DialogTitle className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
                  {step === 1 ? "Pilih Layanan" : step === 2 ? "Tentukan Tanggal" : "Finalisasi Booking"}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-card overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
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
                                "group relative flex items-start gap-3 sm:gap-5 p-4 sm:p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                                field.value === pkg.id
                                  ? "border-accent bg-accent/5 shadow-xl"
                                  : "border-muted bg-card hover:border-muted/80 hover:shadow-lg"
                              )}
                              onClick={() => field.onChange(pkg.id)}
                            >
                              <div className={cn(
                                "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 mt-1 shrink-0",
                                field.value === pkg.id ? "border-accent bg-accent" : "border-muted"
                              )}>
                                {field.value === pkg.id && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />}
                              </div>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                                  <h4 className="font-black text-lg sm:text-xl text-foreground tracking-tight truncate">{pkg.namaPaket}</h4>
                                  <span className="font-black text-xl sm:text-2xl text-accent tracking-tighter shrink-0">Rp {pkg.harga.toLocaleString("id-ID")}</span>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed pr-12 line-clamp-2">"{pkg.deskripsi}"</p>
                                <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  <span className="flex items-center gap-2 bg-muted/10 px-3 py-1 rounded-full border border-muted shadow-xs"><Clock className="w-3.5 h-3.5 text-accent" /> {pkg.durasiJam} Jam Sesi</span>
                                  <span className="flex items-center gap-2 bg-muted/10 px-3 py-1 rounded-full border border-muted shadow-xs"><Camera className="w-3.5 h-3.5 text-accent" /> {pkg.jumlahFotoMin} Hasil Foto</span>
                                  {
                                    pkg.includesEditing && (
                                      <span className="flex items-center gap-2 bg-muted/10 px-3 py-1 rounded-full border border-muted shadow-xs"><CheckCircle className="w-3.5 h-3.5 text-accent" />Termasuk Edit</span>
                                    )
                                  }
                                </div>
                              </div>
                              {field.value === pkg.id && (
                                <div className="absolute -right-4 -top-4 w-12 h-12 bg-accent rotate-45 flex items-end justify-center pb-1 shadow-lg">
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
                      <FormItem className="flex flex-col gap-4 sm:gap-8 items-center w-full">
                        <div className="w-full bg-muted/5 p-2 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-muted">
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
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="lokasi"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-rose-500" /> Lokasi Acara
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Alamat lengkap lokasi..."
                                className="rounded-2xl border-muted bg-card p-5 sm:p-7 font-bold text-foreground focus:ring-accent focus-visible:ring-accent transition-all shadow-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-accent" /> Jadwal Terpilih
                        </Label>
                        <div className="p-4 bg-accent text-white rounded-2xl flex items-center justify-between shadow-xl shadow-accent/10 transition-all duration-500">
                          <span className="font-black text-sm tracking-tight underline decoration-white/30">
                            {selectedDate && format(selectedDate, "eeee, d MMMM yyyy", { locale: idLocale })}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep(2)}
                            disabled={mutation.isPending}
                            className="h-8 rounded-full text-[10px] font-black hover:bg-white/20 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                          <FormLabel className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" /> Instruksi Tambahan (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detail khusus untuk fotografer..."
                              className="rounded-[2rem] border-muted bg-card font-medium min-h-[120px] p-4 sm:p-6 focus:ring-accent focus-visible:ring-accent text-foreground transition-all shadow-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-5 sm:p-8 bg-muted/10 backdrop-blur-md rounded-[2.5rem] border border-muted shadow-inner group">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:translate-x-1 transition-transform">Layanan Terpilih</span>
                          <Badge variant="secondary" className="rounded-full bg-card border border-muted text-foreground font-black px-4">{selectedPackage?.namaPaket}</Badge>
                        </div>
                        <div className="h-px bg-muted w-full" />
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Total Investasi</span>
                            <div className="text-4xl font-black text-foreground tracking-tighter leading-none">
                              Rp {selectedPackage?.harga.toLocaleString("id-ID")}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Status DP</span>
                            <div className="text-lg font-black text-accent">50% di muka</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-8 bg-card border-t border-muted flex items-center gap-3 sm:gap-4 shrink-0">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={mutation.isPending}
                    className="rounded-2xl font-black px-4 sm:px-6 h-12 sm:h-16 border-2 border-muted hover:bg-muted/50 text-foreground transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleOpenChange(false)}
                    disabled={mutation.isPending}
                    className="rounded-2xl font-black px-4 sm:px-6 h-12 sm:h-16 text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
                  >
                    Batal
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={mutation.isPending}
                    className="flex-1 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black h-12 sm:h-16 text-sm sm:text-lg tracking-tight shadow-2xl shadow-accent/20 group ripple-effect cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Lanjutkan
                    <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex-1 rounded-2xl bg-accent text-white font-black h-12 sm:h-16 text-sm sm:text-xl tracking-tight shadow-3xl shadow-accent/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
        <DialogContent className="sm:max-w-[400px] p-8 rounded-[2.5rem] border-none shadow-2xl bg-card text-foreground">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-2">
              <AlertCircle size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Batalkan Order?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Data yang sudah Anda pilih akan terhapus. Apakah Anda yakin ingin keluar dari proses booking ini?
            </p>
            <div className="flex flex-col w-full gap-3 pt-4">
              <Button
                className="w-full h-14 rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                onClick={() => setShowExitConfirm(false)}
              >
                Lanjutkan Order
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 cursor-pointer"
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
