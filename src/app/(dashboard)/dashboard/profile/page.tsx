"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Package as PackageType, PhotographerProfile } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Package,
  Plus,
  PlusCircle,
  Star,
  Trash2,
  User
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

// --- SCHEMAS ---
const profileSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  username: z.string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-zA-Z0-9](?!.*\.{2})[a-zA-Z0-9._]{0,28}[a-zA-Z0-9]$|^[a-zA-Z0-9]$/, "Format username tidak valid (hanya huruf, angka, titik, underscore)"),
  email: z.string().optional(),
  bio: z.string().min(10, "Bio minimal 10 karakter"),
  kotaDomisili: z.string().min(3, "Kota minimal 3 karakter"),
  kategori: z.array(z.string()).min(1, "Pilih minimal 1 kategori"),
  isAcceptingOrders: z.boolean().default(true),
  baseMinimumFee: z.coerce.number().min(0, "Minimal fee tidak boleh negatif"),
})

const packageSchema = z.object({
  namaPaket: z.string().min(3, "Nama paket minimal 3 karakter"),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter"),
  harga: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  durasiJam: z.coerce.number().min(1, "Durasi minimal 1 jam"),
  jumlahFotoMin: z.coerce.number().min(1, "Jumlah foto minimal 1"),
  includesEditing: z.boolean().default(false),
  kategori: z.string().optional(),
})

type ProfileValues = z.input<typeof profileSchema>
type PackageValues = z.input<typeof packageSchema>

export default function ManageProfilePage() {
  const queryClient = useQueryClient()
  const { user: clerkFrontUser } = useUser()
  const [activeTab, setActiveTab] = useState("profile")

  // 1. Fetch User Profile Data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user-me"],
    queryFn: async () => {
      const res = await fetch("/api/users/me")
      if (!res.ok) throw new Error("Gagal mengambil data user")
      return res.json()
    }
  })

  const actualUserData = userData?.json?.data || userData?.data
  const photographer = actualUserData?.photographerProfile as PhotographerProfile | null
  const clerkUser = actualUserData

  // 2. Fetch Packages
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ["photographer-packages", photographer?.id],
    enabled: !!photographer?.id,
    queryFn: async () => {
      const res = await fetch(`/api/photographers/${photographer?.id}/packages`)
      if (!res.ok) throw new Error("Gagal mengambil data paket")
      return res.json()
    }
  })

  const actualPackagesData = packagesData?.json?.data || packagesData?.data
  const pgPackages = actualPackagesData as PackageType[] || []

  // 3. Profile Form
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: clerkUser?.name || "",
      username: photographer?.username || "",
      email: clerkUser?.email || "",
      bio: photographer?.bio || "",
      kotaDomisili: photographer?.kotaDomisili || "",
      kategori: photographer?.kategori || [],
      isAcceptingOrders: photographer?.isAcceptingOrders ?? true,
      baseMinimumFee: photographer?.baseMinimumFee || 0,
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (values: Partial<ProfileValues>) => {
      // 1. Ekstrak field khusus
      const { username, ...updateData } = values

      let isGeneralSuccess = false
      let usernameErrorMsg: string | null = null

      // 2. Update data profil umum (jika ada data yang dikirim)
      if (Object.keys(updateData).length > 0) {
        const res = await fetch("/api/photographers/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Gagal update profil umum")
        }
        isGeneralSuccess = true
      }

      // 3. Update username (hanya jika ada perubahan dan nilainya baru)
      if (username !== undefined && username !== photographer?.username) {
        const userRes = await fetch("/api/photographers/me/username", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        })
        if (!userRes.ok) {
          const errorData = await userRes.json()
          // JANGAN throw error, tampung pesan error agar data umum tetap bisa tervisualisasi (invalidate)
          usernameErrorMsg = errorData.error || "Gagal update username"
        }
      }

      return { isGeneralSuccess, usernameErrorMsg }
    },
    onSuccess: (data) => {
      // Selalu invalidate agar data yang berhasil (meski ada parsial error) tampil di UI
      queryClient.invalidateQueries({ queryKey: ["user-me"] })

      if (data.usernameErrorMsg) {
        if (data.isGeneralSuccess) {
          toast.warning(`Profil diperbarui, namun Username gagal: ${data.usernameErrorMsg}`)
        } else {
          toast.error(data.usernameErrorMsg)
        }
      } else {
        toast.success("Profil berhasil diperbarui!")
      }
    },
    onError: (err: any) => toast.error(err.message)
  })


  // 4. Package Form
  const packageForm = useForm<PackageValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      namaPaket: "",
      deskripsi: "",
      harga: 0,
      durasiJam: 1,
      jumlahFotoMin: 10,
      includesEditing: true,
    }
  })

  const addPackageMutation = useMutation({
    mutationFn: async (values: PackageValues) => {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Gagal tambah paket")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Paket berhasil ditambahkan!")
      packageForm.reset()
      queryClient.invalidateQueries({ queryKey: ["photographer-packages"] })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal hapus paket")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Paket berhasil dihapus!")
      queryClient.invalidateQueries({ queryKey: ["photographer-packages"] })
    },
    onError: (err: any) => toast.error(err.message)
  })

  // 4b. Avatar Upload directly via Clerk SDK
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !clerkFrontUser) return

    setIsAvatarUploading(true)
    try {
      await clerkFrontUser.setProfileImage({ file })
      toast.success("Foto profil berhasil diperbarui!")
      queryClient.invalidateQueries({ queryKey: ["user-me"] })
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || err.message || "Gagal upload foto profil")
    } finally {
      setIsAvatarUploading(false)
    }
  }

  // 5. Portfolio Section
  const [isUploading, setIsUploading] = useState(false)
  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Format file tidak didukung! Mohon unggah file gambar (JPG, PNG, WEBP).")
      e.target.value = ""
      return
    }

    // Pre-upload validation: Cek limit 5 foto
    if ((photographer?.portfolioUrls?.length || 0) >= 5) {
      toast.error("Batas maksimal portfolio adalah 5 foto!")
      e.target.value = ""
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/photographers/me/portfolio", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Gagal upload portofolio")
      toast.success("Foto portofolio berhasil ditambahkan!")
      queryClient.invalidateQueries({ queryKey: ["user-me"] })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Profil...</p>
      </div>
    )
  }

  if (!photographer) {
    return (
      <div className="container mx-auto p-12 text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Profil Belum Siap</h2>
        <p className="text-slate-500 max-w-md mx-auto font-medium">
          Anda belum terdaftar sebagai fotografer atau pendaftaran Anda masih menunggu verifikasi admin.
        </p>
        <Button onClick={() => window.location.href = "/dashboard"}>Kembali ke Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Navigation Top Bar */}
      <div className="mb-6 flex items-center">
        <Button variant="ghost" className="gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 rounded-full font-bold pl-3 pr-5" asChild>
          <Link href="/dashboard">
            <ArrowLeft size={18} />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>

      {/* Header Profile Summary */}
      {/* --- PREMIUM PROFILE HEADER --- */}
      <div className="relative mb-12 p-8 md:p-14 rounded-[4rem] bg-indigo-950 text-white overflow-hidden shadow-[0_32px_64px_-16px_rgba(20,20,50,0.4)] border border-white/5">
        {/* Background Accents (Blobs) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse transition-all duration-1000" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[130px] -translate-y-1/2" />

        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] mask-[radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative z-20 flex flex-col md:flex-row items-center gap-10">
          {/* Avatar Container */}
          <div className="relative group z-20">
            <label htmlFor="avatar-upload" className="block relative w-36 h-36 md:w-48 md:h-48 rounded-[3rem] border-[6px] border-white/10 overflow-hidden bg-white/5 shadow-2xl group-hover:scale-105 group-hover:-rotate-2 transition-all duration-700 ring-4 ring-black/20 cursor-pointer [transform:translateZ(0)]">
              {clerkUser?.avatarUrl ? (
                <img src={clerkUser.avatarUrl} alt={clerkUser.name} className={`w-full h-full object-cover transition-all duration-700 ${isAvatarUploading ? 'opacity-50 blur-sm' : 'grayscale-[0.2] group-hover:grayscale-0'}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <User size={80} />
                </div>
              )}
              <div className="absolute inset-0 rounded-[2.5rem] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                {isAvatarUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white/90" />}
              </div>
            </label>
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isAvatarUploading}
            />

            {/* Status Floating Badge */}
            <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-4 rounded-[1.5rem] border-4 border-indigo-950 shadow-[0_8px_16px_rgba(16,185,129,0.3)] font-black text-xs">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="flex flex-col gap-5 text-center md:text-left flex-1">
            <div className="space-y-2">
              <span className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-1 block">PHOTOGRAPHER</span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight ">{clerkUser?.name}</h1>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
              {/* Glassmorphism Badges */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[13px] font-black uppercase tracking-widest backdrop-blur-xl transition-colors shadow-sm">
                <MapPin size={16} className="text-primary" />
                {photographer.kotaDomisili}
              </div>

              <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[13px] font-black uppercase tracking-widest backdrop-blur-xl transition-colors shadow-sm">
                <Star size={16} className="text-yellow-400" />
                {photographer.ratingAverage || '0.0'} ({photographer.ratingCount} Reviews)
              </div>

              <div className={`flex items-center gap-3 px-5 py-2.5 ${photographer.isAcceptingOrders ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} border rounded-2xl text-[13px] font-black uppercase tracking-widest backdrop-blur-xl transition-all`}>
                <div className={`w-2.5 h-2.5 rounded-full ${photographer.isAcceptingOrders ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {photographer.isAcceptingOrders ? 'Open Order' : 'Closed Order'}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Accent Icons (Decoration) */}
        <div className="absolute bottom-5 right-5 text-white/5 hidden lg:block rotate-12">
          <Camera size={240} />
        </div>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col gap-8" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto justify-start overflow-x-auto flex-nowrap scrollbar-hide">
            <TabsTrigger value="profile" className="rounded-2xl px-8 py-3 font-black text-sm uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all gap-2 whitespace-nowrap">
              <User size={18} />
              Biodata
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-2xl px-8 py-3 font-black text-sm uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all gap-2 whitespace-nowrap">
              <ImageIcon size={18} />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="packages" className="rounded-2xl px-8 py-3 font-black text-sm uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all gap-2 whitespace-nowrap">
              <Package size={18} />
              Paket Layanan
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status Profil</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Verified Professional</span>
              <CheckCircle2 className="text-primary w-5 h-5" />
            </div>
          </div>
        </div>

        {/* content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          <div className="space-y-8">
            {/* TABS CONTENT */}
            <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
                  <CardTitle className="text-2xl font-black  flex items-center gap-3">
                    <User className="text-primary" /> Informasi Pribadi
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium tracking-tight">Ceritakan keahlian dan kepribadian Anda kepada kustomer.</CardDescription>
                </CardHeader>
                <CardContent className="py-3">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit((v) => updateProfileMutation.mutate(v))} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Nama Lengkap</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nama lengkap profesional Anda"
                                  className="rounded-2xl border-slate-200 h-14 font-bold text-slate-700"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="relative">
                              <FormLabel className="text-slate-900 font-bold">Username (@framic_id)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">@</div>
                                  <Input
                                    placeholder="username_anda"
                                    className="pl-10 rounded-2xl border-slate-200 h-14 font-black text-indigo-600"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-900 font-bold flex items-center gap-2">
                              Email Akun
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                <Input
                                  className="pl-12 rounded-2xl border-slate-200 h-14 font-medium"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px] leading-tight text-slate-400 font-medium">
                              * Email ini akan digunakan sebagai email utama dan tersinkronisasi otomatis dengan akun Anda.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-900 font-bold">Bio Profesional</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Contoh: Fotografer spesialis wedding dengan gaya sinematik..."
                                className="min-h-[150px] rounded-2xl border-slate-200 focus:ring-primary/20"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className=" text-slate-400">Bio yang menarik meningkatkan kemungkinan booking hingga 40%.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-8">
                        <FormField
                          control={profileForm.control}
                          name="kotaDomisili"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Kota Domisili</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                  <Input placeholder="Contoh: Jakarta Selatan" className="pl-12 rounded-2xl border-slate-200 h-14 font-medium" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="kategori"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Kategori Spesialis</FormLabel>
                              <div className="flex flex-wrap gap-2 pt-1">
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
                                    className={`rounded-xl border px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-sm ${field.value.includes(kat)
                                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
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
                        <FormField
                          control={profileForm.control}
                          name="isAcceptingOrders"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Status Reservasi</FormLabel>
                              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 bg-emerald-50 border-emerald-100`}>
                                <div className="flex flex-col gap-0.5">
                                  <span className={`font-black text-sm tracking-tight ${field.value ? "text-emerald-700" : "text-rose-700"}`}>
                                    {field.value ? "Open Order" : "Closed Order"}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${field.value ? "text-emerald-600/70" : "text-rose-600/70"}`}>
                                    {field.value ? "Menerima Pesanan" : "Tutup Pesanan"}
                                  </span>
                                </div>
                                <Switch
                                  checked={field.value}
                                  disabled={updateProfileMutation.isPending}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked)
                                    updateProfileMutation.mutate({ isAcceptingOrders: checked })
                                  }}
                                  className={`${field.value ? "data-[state=checked]:bg-emerald-700" : "data-[state=unchecked]:bg-rose-200"}`}
                                />
                              </div>
                              <p className="text-xs text-slate-500 mt-4 font-medium leading-relaxed bg-white/50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                {field.value
                                  ? "Profil Anda aktif dan kustomer bisa melakukan booking."
                                  : "Profil Anda tetap tampil, namun kustomer tidak dapat melakukan booking baru (Close Order)."}
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="baseMinimumFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Standard Minimum Fee (Rp)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Rp</div>
                                  <Input
                                    type="number"
                                    placeholder="Contoh: 500000"
                                    className="pl-12 rounded-2xl border-slate-200 h-14 font-black text-lg"
                                    {...field}
                                    value={field.value as string | number}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className=" text-slate-400">Proteksi harga minimal Anda saat menerima proyek dari Mitra.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-8 border-t border-slate-100 flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="h-12 px-8 rounded-2xl font-black text-base gap-2 shadow-xl shadow-primary/25"
                        >
                          {updateProfileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 size={24} />}
                          Simpan Perubahan
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-black  flex items-center gap-3">
                      <ImageIcon size={28} className="text-primary" /> Portfolio Galeri
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Foto portfolio asli adalah penentu utama kustomer mengklik tombol booking.</CardDescription>
                  </div>

                  <div className="relative">
                    {(photographer.portfolioUrls?.length || 0) < 5 ? (
                      <>
                        <input
                          type="file"
                          id="portfolio-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePortfolioUpload}
                          disabled={isUploading}
                        />
                        <Button
                          asChild
                          disabled={isUploading}
                          className="rounded-full gap-2 font-black px-8 h-12 shadow-lg shadow-primary/20"
                        >
                          <label htmlFor="portfolio-upload" className={`${isUploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
                            Unggah Foto
                          </label>
                        </Button>
                      </>
                    ) : (
                      <div className="px-6 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Limit: 5 Foto
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {photographer.portfolioUrls?.length > 0 ? (
                      photographer.portfolioUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 group relative">
                          <img src={url} alt="Portfolio" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                              <ImageIcon size={24} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center flex flex-col items-center gap-6 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-inner">
                          <ImageIcon size={32} />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs ">Galeri portfolio masih kosong</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <Card className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-black  flex items-center gap-3">
                        <Package size={28} className="text-primary" /> Daftar Paket Saya
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium">Tambah atau kelola paket harga jasa pemotretan Anda.</CardDescription>
                    </div>
                    <Button variant="outline" className="rounded-full gap-2 font-bold px-6 border-slate-200" onClick={() => document.getElementById('add-package-form')?.scrollIntoView({ behavior: 'smooth' })}>
                      <Plus size={18} /> Tambah Baru
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid gap-6">
                    {pgPackages.length > 0 ? (
                      pgPackages.filter(p => p.isActive).map((pkg) => (
                        <div key={pkg.id} className="relative p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-primary/30 hover:shadow-xl transition-all group flex flex-col md:flex-row gap-6 items-center">
                          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Package size={32} />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{pkg.namaPaket}</h3>
                            <p className="text-sm text-slate-400 font-medium  line-clamp-1 mb-4">{pkg.deskripsi}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5"><Clock size={14} /> {pkg.durasiJam} Jam</div>
                              <div className="flex items-center gap-1.5"><ImageIcon size={14} /> {pkg.jumlahFotoMin}+ Foto</div>
                              {pkg.includesEditing && <div className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12} /> Editing</div>}
                            </div>
                          </div>
                          <div className="flex flex-col items-center md:items-end gap-3 flex-shrink-0">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">Rp {pkg.harga.toLocaleString('id-ID')}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-full h-10 px-4 gap-2 font-bold"
                              onClick={() => {
                                if (confirm("Hapus paket ini?")) deletePackageMutation.mutate(pkg.id)
                              }}
                              disabled={deletePackageMutation.isPending}
                            >
                              <Trash2 size={16} /> Hapus
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center flex flex-col items-center gap-4 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                        <Package size={48} className="text-slate-200" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs ">Belum ada paket terdaftar</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* FORM TAMBAH PAKET */}
              <Card id="add-package-form" className="rounded-[2.5rem] border-slate-200 shadow-xl shadow-primary/5 overflow-hidden border-2 border-primary/20">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black  text-primary">Tambah Paket Baru</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Buat tawaran menarik yang sulit ditolak kustomer.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <Form {...packageForm}>
                    <form onSubmit={packageForm.handleSubmit((v) => addPackageMutation.mutate(v))} className="space-y-6">
                      <FormField
                        control={packageForm.control}
                        name="namaPaket"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-900 font-bold">Nama Paket</FormLabel>
                            <FormControl>
                              <Input placeholder="Contoh: Wedding Day Signature" className="rounded-xl h-14 font-medium" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={packageForm.control}
                        name="deskripsi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-900 font-bold">Deskripsi Paket</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Beritahukan detail apa saja yang kustomer dapatkan..." className="min-h-[100px] rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={packageForm.control}
                          name="harga"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Harga (Rp)</FormLabel>
                              <FormControl>
                                <Input type="number" className="rounded-xl h-14 font-black" {...field} value={field.value as string | number} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={packageForm.control}
                          name="durasiJam"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Durasi (Jam)</FormLabel>
                              <FormControl>
                                <Input type="number" className="rounded-xl h-14 font-bold" {...field} value={field.value as string | number} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={packageForm.control}
                          name="jumlahFotoMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-900 font-bold">Minimal Foto</FormLabel>
                              <FormControl>
                                <Input type="number" className="rounded-xl h-14 font-bold" {...field} value={field.value as string | number} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={packageForm.control}
                        name="includesEditing"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-200 p-6 bg-slate-50/30">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-bold text-slate-900">Termasuk Foto Editing?</FormLabel>
                              <FormDescription className="text-xs">Aktifkan jika harga paket ini sudah mencakup biaya edit foto.</FormDescription>
                            </div>
                            <FormControl>
                              <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${field.value ? "bg-primary" : "bg-slate-300"
                                  }`}
                              >
                                <span
                                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${field.value ? "translate-x-7" : "translate-x-1"
                                    }`}
                                />
                              </button>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={addPackageMutation.isPending}
                        className="w-full h-16 rounded-[1.5rem] font-black text-xl gap-2 shadow-xl shadow-primary/20 bg-primary hover:bg-primary-dark"
                      >
                        {addPackageMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlusCircle size={24} />}
                        Tambahkan Paket
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* SIDEBAR RIGHT (PREVIEW & TIPS) */}
          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-slate-200 bg-white py-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Profile Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-black text-slate-900  tracking-tighter">Checklist Profil:</h4>
                  <div className="space-y-3">
                    <CheckItem label="Username @Handle" checked={!!photographer.username} />
                    <CheckItem label="Lengkapi Bio" checked={!!photographer.bio} />
                    <CheckItem label="Unggah Portfolio" checked={photographer.portfolioUrls.length > 0} />
                    <CheckItem label="Buat Minimal 1 Paket" checked={pgPackages.length > 0} />
                  </div>
                </div>

                <Button variant="outline" className="w-full py-6 rounded-2xl font-bold border-slate-200 gap-2 hover:bg-slate-50" asChild>
                  <Link href={`/photographers/${photographer.id}`}>
                    Lihat Tampilan Publik <ArrowRightIcon size={18} />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] bg-indigo-900 text-white p-2">
              <div className="p-6 rounded-[2rem] border border-white/10 bg-white/5 space-y-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white border border-white">
                  <Globe size={20} />
                </div>
                <h3 className="font-bold">Kenapa data saya tidak muncul?</h3>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                  Pastikan Anda sudah melengkapi Username, Minimal 1 Paket, dan Portfolio. Akun yang belum lengkap tidak akan tampil di pencarian publik dan tidak bisa menerima order baru.
                </p>
              </div>
            </Card>
          </div>

        </div>
      </Tabs>
    </div>
  )
}

function CheckItem({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
        <CheckCircle2 size={12} fill={checked ? "currentColor" : "none"} />
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </div>
  )
}

function ArrowRightIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
