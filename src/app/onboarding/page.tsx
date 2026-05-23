"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { KATEGORI_OPTIONS } from "@/lib/constants"
import { Camera, Building2, ArrowRight, Loader2, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react"
import Link from "next/link"

type Role = "none" | "photographer" | "mitra"

// --- SCHEMAS ---

const photographerSchema = z.object({
  bio: z.string().min(10, "Bio minimal 10 karakter"),
  kotaDomisili: z.string().min(3, "Kota minimal 3 karakter"),
  kategori: z.array(z.string()).min(1, "Pilih minimal 1 kategori"),
  portfolioUrl: z.string().url("Format URL tidak valid").min(1, "Link portofolio wajib diisi"),
})

const mitraSchema = z.object({
  namaOrganisasi: z.string().min(3, "Nama organisasi minimal 3 karakter"),
  tipeMitra: z.string().min(1, "Pilih tipe organisasi"),
  alamat: z.string().min(10, "Alamat minimal 10 karakter"),
  nomorTelepon: z.string().min(10, "Nomor telepon minimal 10 karakter"),
  websiteUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
  dokumenLegalitas: z.any().refine((file) => file instanceof File, "Dokumen wajib diunggah"),
})

type PhotographerValues = z.input<typeof photographerSchema>
type MitraValues = z.input<typeof mitraSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>("none")
  const [isLoading, setIsLoading] = useState(false)

  // Fetch current status to lock roles if already registered
  const { data: userResponse, isLoading: isUserLoading } = useQuery({
    queryKey: ["current-user-full"],
    queryFn: async () => {
      const res = await fetch("/api/users/me")
      if (!res.ok) return null
      return res.json()
    }
  })

  const userData = userResponse?.data
  const isPgRegistered = !!userData?.photographerProfile
  const pgStatus = userData?.photographerProfile?.verificationStatus

  const isMitraRegistered = !!userData?.mitraProfile
  const mitraStatus = userData?.mitraProfile?.verificationStatus

  // Forms
  const pgForm = useForm<PhotographerValues>({
    resolver: zodResolver(photographerSchema),
    defaultValues: {
      bio: "",
      kotaDomisili: "",
      kategori: [],
      portfolioUrl: "",
    },
  })

  const mitraForm = useForm<MitraValues>({
    resolver: zodResolver(mitraSchema),
    defaultValues: {
      namaOrganisasi: "",
      tipeMitra: "",
      alamat: "",
      nomorTelepon: "",
      websiteUrl: "",
    },
  })

  // Pre-fill Photographer Form
  useEffect(() => {
    if (userData?.photographerProfile) {
      pgForm.reset({
        bio: userData.photographerProfile.bio || "",
        kotaDomisili: userData.photographerProfile.kotaDomisili || "",
        kategori: userData.photographerProfile.kategori || [],
        portfolioUrl: userData.photographerProfile.portfolioUrls?.[0] || "",
      })
    }
  }, [userData?.photographerProfile, pgForm])

  // Pre-fill Mitra Form
  useEffect(() => {
    if (userData?.mitraProfile) {
      mitraForm.reset({
        namaOrganisasi: userData.mitraProfile.namaOrganisasi || "",
        tipeMitra: userData.mitraProfile.tipeMitra || "",
        alamat: userData.mitraProfile.alamat || "",
        nomorTelepon: userData.mitraProfile.nomorTelepon || "",
        websiteUrl: userData.mitraProfile.websiteUrl || "",
      })
    }
  }, [userData?.mitraProfile, mitraForm])

  const handleSkip = () => {
    router.push("/")
  }

  const onPhotographerSubmit = async (values: PhotographerValues) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users/apply/photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: values.bio,
          kotaDomisili: values.kotaDomisili,
          kategori: values.kategori,
          portfolioUrls: values.portfolioUrl ? [values.portfolioUrl] : [],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success("Pengajuan fotografer berhasil diajukan!")
      router.push("/pending")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onMitraSubmit = async (values: MitraValues) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("namaOrganisasi", values.namaOrganisasi)
      formData.append("tipeMitra", values.tipeMitra)
      formData.append("alamat", values.alamat)
      formData.append("nomorTelepon", values.nomorTelepon)
      if (values.websiteUrl) formData.append("websiteUrl", values.websiteUrl)
      formData.append("dokumenLegalitas", values.dokumenLegalitas)

      const res = await fetch("/api/users/apply/mitra", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success("Pengajuan mitra berhasil diajukan!")
      router.push("/pending")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedRole === "none") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden p-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 mx-auto w-full max-w-4xl flex flex-col items-center gap-12 text-center animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 self-center">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">LANGKAH PERTAMA</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-[-0.02em] text-foreground leading-tight">
              Selamat datang di <span className="underline decoration-accent decoration-2 underline-offset-4">Framic</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Langkah awal untuk memulai perjalanan visual Anda. Pilih bagaimana Anda ingin berkontribusi di platform kami.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 w-full">
            {/* CARD FOTOGRAFER */}
            <button
              onClick={() => (!isPgRegistered || pgStatus === 'rejected') && setSelectedRole("photographer")}
              disabled={isPgRegistered && pgStatus !== 'rejected'}
              className={`group flex flex-col text-left bg-card p-8 rounded-[32px] border border-muted shadow-sm transition-all duration-500 relative overflow-hidden ${isPgRegistered && pgStatus !== 'rejected'
                ? ' cursor-not-allowed border-muted/80'
                : 'hover:shadow-xl hover:border-primary/20'
                }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] group-hover:bg-accent/10 transition-colors" />
              <div className="mb-8 flex items-center justify-between">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary group-hover:scale-105 transition-transform border border-muted">
                  <Camera size={24} />
                </div>
                {isPgRegistered && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${pgStatus === 'verified' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' :
                    pgStatus === 'pending' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' :
                      'text-rose-500 border-rose-500/20 bg-rose-500/10'
                    }`}>
                    {pgStatus}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-medium text-foreground mb-3 tracking-tight">Sebagai Fotografer</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Tunjukkan karya terbaik Anda, kelola paket jasa, dan temukan klien impian atau bergabung dengan event profesional.
              </p>

              {isPgRegistered && pgStatus !== 'rejected' ? (
                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Akun Terdaftar
                  </div>
                  <Link href={"/dashboard"} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-full shadow-sm text-xs font-bold hover:bg-accent/90 transition-all cursor-pointer">
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="mt-auto flex items-center gap-2 font-bold text-xs text-primary transition-all">
                  {pgStatus === 'rejected' ? (
                    <span className="flex items-center gap-2 text-destructive bg-destructive/5 border border-destructive/10 px-4 py-2 rounded-full">
                      Ajukan Ulang <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Mulai Berkarir <ArrowRight className="w-4 h-4 text-accent" />
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* CARD MITRA */}
            <button
              onClick={() => (!isMitraRegistered || mitraStatus === 'rejected') && setSelectedRole("mitra")}
              disabled={isMitraRegistered && mitraStatus !== 'rejected'}
              className={`group flex flex-col text-left bg-card p-8 rounded-[32px] border border-muted shadow-sm transition-all duration-500 relative overflow-hidden ${isMitraRegistered && mitraStatus !== 'rejected'
                ? 'opacity-60 cursor-not-allowed border-muted/80'
                : 'hover:shadow-xl hover:border-primary/20'
                }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] group-hover:bg-primary/10 transition-colors" />
              <div className="mb-8 flex items-center justify-between">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary group-hover:scale-105 transition-transform border border-muted">
                  <Building2 size={24} />
                </div>
                {isMitraRegistered && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${mitraStatus === 'verified' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' :
                    mitraStatus === 'pending' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' :
                      'text-rose-500 border-rose-500/20 bg-rose-500/10'
                    }`}>
                    {mitraStatus}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-medium text-foreground mb-3 tracking-tight">Sebagai Mitra</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Butuh tim dokumentasi untuk event Anda? Kelola jadwal, rekrut fotografer, dan bangun kepercayaan dengan klien Anda.
              </p>

              {isMitraRegistered && mitraStatus !== 'rejected' ? (
                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mitra Terdaftar
                  </div>
                  <Link href={"/dashboard"} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-full shadow-sm text-xs font-bold hover:bg-accent/90 transition-all cursor-pointer">
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="mt-auto flex items-center gap-2 font-bold text-xs text-primary transition-all">
                  {mitraStatus === 'rejected' ? (
                    <span className="flex items-center gap-2 text-destructive bg-destructive/5 border border-destructive/10 px-4 py-2 rounded-full cursor-pointer">
                      Ajukan Ulang <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 cursor-pointer">
                      Bangun Ekosistem <ArrowRight className="w-4 h-4 text-accent" />
                    </span>
                  )}
                </div>
              )}
            </button>
          </div>

          <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-foreground h-11 px-8 rounded-full text-xs font-bold hover:bg-muted/40">
            Daftar nanti, saya hanya ingin mencari fotografer dulu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden p-6 py-12">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />

      <Card className="w-full max-w-2xl shadow-xl border-muted bg-card rounded-[32px] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="p-5 sm:p-8 pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            Lengkapi Profil {selectedRole === "photographer" ? "Fotografer" : "Mitra"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2">
            Pintu gerbang menuju peluang baru. Pastikan data yang Anda masukkan akurat untuk mempercepat proses verifikasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-8 pt-0">

          {selectedRole === "photographer" && (
            <Form {...pgForm}>
              <form onSubmit={pgForm.handleSubmit(onPhotographerSubmit)} className="space-y-6">
                <FormField
                  control={pgForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Bio Singkat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ceritakan sedikit tentang karya dan diri Anda (min. 10 karakter)"
                          className="rounded-[16px] border-muted resize-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pgForm.control}
                  name="kotaDomisili"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Kota Domisili</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Bandung"
                          className="rounded-full h-10 border-muted focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pgForm.control}
                  name="portfolioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Link Portofolio (Instagram / Google Drive / Website)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          className="rounded-full h-10 border-muted focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Tautan eksternal yang menunjukkan hasil karya fotografi Anda agar dapat ditinjau oleh Admin.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pgForm.control}
                  name="kategori"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Kategori Keahlian</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {KATEGORI_OPTIONS.map((kat) => (
                          <button
                            key={kat}
                            type="button"
                            onClick={() => {
                              const current = field.value
                              const next = current.includes(kat)
                                ? current.filter((v) => v !== kat)
                                : [...current, kat]
                              field.onChange(next)
                            }}
                            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${field.value.includes(kat)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-white dark:bg-[#141413] hover:bg-muted/40 border-muted text-muted-foreground"
                              }`}
                          >
                            {kat}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-muted/50">
                  <Button type="button" variant="ghost" className="w-full sm:w-auto rounded-full font-bold px-8" onClick={() => setSelectedRole("none")} disabled={isLoading}>
                    Kembali
                  </Button>
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-full font-bold px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Ajukan Verifikasi
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {selectedRole === "mitra" && (
            <Form {...mitraForm}>
              <form onSubmit={mitraForm.handleSubmit(onMitraSubmit)} className="space-y-6">
                <FormField
                  control={mitraForm.control}
                  name="namaOrganisasi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Nama Organisasi / WO / Event Organizer</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Budi Wedding"
                          className="rounded-full h-10 border-muted focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mitraForm.control}
                  name="tipeMitra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Tipe Organisasi</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="rounded-full h-10 border-muted focus:ring-1 focus:ring-primary focus:border-primary">
                            <SelectValue placeholder="Pilih tipe organisasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="wedding_organizer">Wedding Organizer</SelectItem>
                          <SelectItem value="kampus">Kampus / Universitas</SelectItem>
                          <SelectItem value="event_organizer">Event Organizer</SelectItem>
                          <SelectItem value="komunitas">Komunitas</SelectItem>
                          <SelectItem value="perusahaan">Perusahaan</SelectItem>
                          <SelectItem value="lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mitraForm.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Alamat Lengkap</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alamat kantor / operasional"
                          className="rounded-[16px] border-muted resize-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mitraForm.control}
                  name="nomorTelepon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Nomor Telepon / WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: 081234567890"
                          className="rounded-full h-10 border-muted focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mitraForm.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Website / Link Portfolio (Opsional)</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://..."
                          className="rounded-full h-10 border-muted focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mitraForm.control}
                  name="dokumenLegalitas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">Dokumen Legalitas (PDF/Gambar)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                          className="cursor-pointer file:font-bold file:text-primary file:bg-primary/5 file:rounded-full file:border-none file:px-4 file:mr-4 border-muted focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary rounded-full h-10"
                        />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">Upload KTP penanggung jawab atau NIB Perusahaan untuk verifikasi trust platform.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-muted/50">
                  <Button type="button" variant="ghost" className="w-full sm:w-auto rounded-full font-bold px-8" onClick={() => setSelectedRole("none")} disabled={isLoading}>
                    Kembali
                  </Button>
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-full font-bold px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Ajukan Verifikasi Mitra
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
