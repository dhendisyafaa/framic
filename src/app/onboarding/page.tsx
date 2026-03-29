"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
})

const mitraSchema = z.object({
  namaOrganisasi: z.string().min(3, "Nama organisasi minimal 3 karakter"),
  tipeMitra: z.string().min(1, "Pilih tipe organisasi"),
  alamat: z.string().min(10, "Alamat minimal 10 karakter"),
  nomorTelepon: z.string().min(10, "Nomor telepon minimal 10 karakter"),
  websiteUrl: z.string().url("URL tidak valid").optional().or(z.literal("")),
  dokumenLegalitas: z.any().refine((file) => file instanceof File, "Dokumen wajib diunggah"),
})

type PhotographerValues = z.infer<typeof photographerSchema>
type MitraValues = z.infer<typeof mitraSchema>

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
          ...values,
          portfolioUrls: [],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success("Aplikasi fotografer berhasil diajukan!")
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

      toast.success("Aplikasi mitra berhasil diajukan!")
      router.push("/pending")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedRole === "none") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 mx-auto w-full max-w-4xl flex flex-col items-center gap-12 text-center animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Selamat datang di <span className="text-primary italic">Framic</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              Langkah awal untuk memulai perjalanan visual Anda. Pilih bagaimana Anda ingin berkontribusi di platform kami.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 w-full">
            {/* CARD FOTOGRAFER */}
            <button
              onClick={() => !isPgRegistered && setSelectedRole("photographer")}
              disabled={isPgRegistered && pgStatus !== 'rejected'}
              className={`group flex flex-col text-left bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all duration-500 relative overflow-hidden ${isPgRegistered && pgStatus !== 'rejected'
                ? 'grayscale-[0.5] cursor-not-allowed border-emerald-100 bg-emerald-50/10'
                : 'hover:shadow-2xl hover:border-primary/30'
                }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] group-hover:bg-primary/10 transition-colors" />
              <div className="mb-8 flex items-center justify-between">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Camera size={28} />
                </div>
                {isPgRegistered && (
                  <Badge variant="outline" className={`rounded-full px-4 border-2 font-black ${pgStatus === 'verified' ? 'text-emerald-600 border-emerald-200 bg-white' :
                    pgStatus === 'pending' ? 'text-amber-600 border-amber-200 bg-white' :
                      'text-rose-600 border-rose-200 bg-white'
                    }`}>
                    {pgStatus?.toUpperCase()}
                  </Badge>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Sebagai Fotografer</h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Tunjukkan karya terbaik Anda, kelola paket jasa, dan temukan klien impian atau bergabung dengan event profesional.
              </p>

              {isPgRegistered && pgStatus !== 'rejected' ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Akun Terdaftar
                  </div>
                  <Link href={"/dashboard"} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                </div>
              ) : (
                <div className="mt-auto flex items-center gap-2 font-bold text-primary opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                  Mulai Berkarir <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>

            {/* CARD MITRA */}
            <button
              onClick={() => !isMitraRegistered && setSelectedRole("mitra")}
              disabled={isMitraRegistered && mitraStatus !== 'rejected'}
              className={`group flex flex-col text-left bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all duration-500 relative overflow-hidden ${isMitraRegistered && mitraStatus !== 'rejected'
                ? 'grayscale-[0.5] cursor-not-allowed border-blue-100 bg-blue-50/10'
                : 'hover:shadow-2xl hover:border-blue-500/30'
                }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] group-hover:bg-blue-500/10 transition-colors" />
              <div className="mb-8 flex items-center justify-between">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                  <Building2 size={28} />
                </div>
                {isMitraRegistered && (
                  <Badge variant="outline" className={`rounded-full px-4 border-2 font-black ${mitraStatus === 'verified' ? 'text-emerald-600 border-emerald-200 bg-white' :
                    mitraStatus === 'pending' ? 'text-amber-600 border-amber-200 bg-white' :
                      'text-rose-600 border-rose-200 bg-white'
                    }`}>
                    {mitraStatus?.toUpperCase()}
                  </Badge>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Sebagai Mitra</h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Butuh tim dokumentasi untuk event Anda? Kelola jadwal, rekrut fotografer, dan bangun kepercayaan dengan klien Anda.
              </p>

              {isMitraRegistered && mitraStatus !== 'rejected' ? (
                <div className="flex items-center gap-4">
                  <div className="mt-auto flex items-center gap-2 font-bold text-blue-600">
                    <CheckCircle2 className="w-4 h-4" /> Mitra Terdaftar
                  </div>
                  <Link href={"/dashboard"} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                </div>
              ) : (
                <div className="mt-auto flex items-center gap-2 font-bold text-blue-500 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                  Bangun Ekosistem <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>

          <Button variant="ghost" onClick={handleSkip} className="text-slate-400 hover:text-slate-900 h-12 px-8 rounded-full">
            Daftar nanti, saya hanya ingin mencari fotografer dulu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 relative overflow-hidden p-6 py-12">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />

      <Card className="w-full max-w-2xl shadow-2xl border-white/40 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="p-10 pb-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
            Lengkapi Profil {selectedRole === "photographer" ? "Fotografer" : "Mitra"}
          </CardTitle>
          <CardDescription className="text-base text-slate-500 mt-2">
            Pintu gerbang menuju peluang baru. Pastikan data yang Anda masukkan akurat untuk mempercepat proses verifikasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 pt-0">

          {selectedRole === "photographer" && (
            <Form {...pgForm}>
              <form onSubmit={pgForm.handleSubmit(onPhotographerSubmit)} className="space-y-6">
                <FormField
                  control={pgForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio Singkat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ceritakan sedikit tentang karya dan diri Anda (min. 10 karakter)"
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
                      <FormLabel>Kota Domisili</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Bandung" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pgForm.control}
                  name="kategori"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Keahlian</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {["wedding", "wisuda", "portrait", "event", "product"].map((kat) => (
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
                            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-all shadow-sm ${field.value.includes(kat)
                              ? "bg-primary text-white border-primary"
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                          >
                            {kat.charAt(0).toUpperCase() + kat.slice(1)}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                  <Button type="button" variant="ghost" className="rounded-xl font-bold px-8" onClick={() => setSelectedRole("none")} disabled={isLoading}>
                    Kembali
                  </Button>
                  <Button type="submit" disabled={isLoading} className="rounded-xl font-bold px-8 shadow-xl shadow-primary/20">
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
                      <FormLabel>Nama Organisasi / WO / Event Organizer</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Budi Wedding" {...field} />
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
                      <FormLabel>Tipe Organisasi</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Alamat Lengkap</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Alamat kantor / operasional" {...field} />
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
                      <FormLabel>Nomor Telepon / WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 081234567890" {...field} />
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
                      <FormLabel>Website / Link Portfolio (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://..." {...field} />
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
                      <FormLabel>Dokumen Legalitas (PDF/Gambar)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                          className="cursor-pointer file:font-bold file:text-primary file:bg-primary/10 file:rounded-lg file:border-none file:px-4 file:mr-4"
                        />
                      </FormControl>
                      <FormDescription>Upload KTP penanggung jawab atau NIB Perusahaan untuk verifikasi trust platform.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                  <Button type="button" variant="ghost" className="rounded-xl font-bold px-8" onClick={() => setSelectedRole("none")} disabled={isLoading}>
                    Kembali
                  </Button>
                  <Button type="submit" disabled={isLoading} className="rounded-xl font-bold px-8 shadow-xl shadow-blue-500/20">
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
