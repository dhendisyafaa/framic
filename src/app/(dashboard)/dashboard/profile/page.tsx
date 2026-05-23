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
import { useUser, useClerk } from "@clerk/nextjs"
import { KATEGORI_OPTIONS } from "@/lib/constants"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
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
  const { openUserProfile } = useClerk()
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

  const portfolioImages = photographer?.portfolioUrls?.filter(url => url.includes("cloudinary") || url.includes("res.cloudinary.com") || /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url)) || []
  const externalPortfolioUrls = photographer?.portfolioUrls?.filter(url => !portfolioImages.includes(url)) || []

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
      bio: photographer?.bio || "",
      kotaDomisili: photographer?.kotaDomisili || "",
      kategori: photographer?.kategori || [],
      isAcceptingOrders: photographer?.isAcceptingOrders ?? true,
      baseMinimumFee: photographer?.baseMinimumFee || 0,
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (values: Partial<ProfileValues>) => {
      if (Object.keys(values).length > 0) {
        const res = await fetch("/api/photographers/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        })
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Gagal update profil umum")
        }
      }
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-me"] })
      toast.success("Profil berhasil diperbarui!")
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
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-muted-foreground font-bold tracking-widest text-xs">Memuat Profil...</p>
      </div>
    )
  }

  if (!photographer || photographer.verificationStatus !== "verified") {
    return (
      <div className="container mx-auto p-12 text-center flex flex-col items-center gap-8 min-h-[70vh] justify-center">
        <div className="relative">
          <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center animate-pulse shadow-xl shadow-amber-500/10">
            <Clock size={48} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-card p-2 rounded-full shadow-lg border border-border">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <h2 className="text-4xl font-black text-foreground tracking-tight">Profil Sedang Ditinjau</h2>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Halaman manajemen profil hanya dapat diakses setelah akun fotografer Anda <span className="text-accent font-bold">Terverifikasi</span> oleh tim Admin Framic.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl h-14 shadow-xl cursor-pointer"
            onClick={() => window.location.href = "/dashboard"}
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Dashboard
          </Button>
        </div>

        <div className="pt-8 border-t border-border w-full max-w-sm">
          <p className="text-[10px] font-black text-muted-foreground tracking-[0.3em]">
            Status Saat Ini: <span className="text-amber-500 font-bold">{photographer?.verificationStatus || "Pending"}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-5 duration-700 text-foreground">
      {/* Navigation Top Bar */}
      <div className="mb-6 flex items-center">
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full font-bold pl-3 pr-5 cursor-pointer" asChild>
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
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[130px] -translate-y-1/2" />

        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] mask-[radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative z-20 flex flex-col md:flex-row items-center gap-10">
          {/* Avatar Container */}
          <div className="relative group z-20">
            <div className="block relative w-36 h-36 md:w-48 md:h-48 rounded-[3rem] border-[6px] border-white/10 overflow-hidden bg-white/5 shadow-2xl transition-all duration-700 ring-4 ring-black/20 [transform:translateZ(0)]">
              {clerkUser?.avatarUrl ? (
                <img src={clerkUser.avatarUrl} alt={clerkUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <User size={80} />
                </div>
              )}
            </div>

            {/* Status Floating Badge */}
            <div className="absolute -bottom-3 -right-3 bg-accent text-white p-4 rounded-[1.5rem] border-4 border-indigo-950 shadow-lg shadow-accent/20 font-black text-xs">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="flex flex-col gap-5 text-center md:text-left flex-1">
            <div className="space-y-2">
              <span className="text-xs font-black text-primary tracking-[0.4em] mb-1 block">Fotografer</span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight ">{clerkUser?.name}</h1>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
              {/* Glassmorphism Badges */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[13px] font-black tracking-widest backdrop-blur-xl transition-colors shadow-sm">
                <MapPin size={16} className="text-primary" />
                {photographer.kotaDomisili}
              </div>

              <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[13px] font-black tracking-widest backdrop-blur-xl transition-colors shadow-sm">
                <Star size={16} className="text-yellow-400" />
                {photographer.ratingAverage || '0.0'} ({photographer.ratingCount} reviews)
              </div>

              <div className={`flex items-center gap-3 px-5 py-2.5 ${photographer.isAcceptingOrders ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} border rounded-2xl text-[13px] font-black tracking-widest backdrop-blur-xl transition-all`}>
                <div className={`w-2.5 h-2.5 rounded-full ${photographer.isAcceptingOrders ? 'bg-primary animate-pulse' : 'bg-rose-500'}`} />
                {photographer.isAcceptingOrders ? 'Open order' : 'Closed order'}
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
          <TabsList className="bg-muted p-1.5 rounded-2xl border border-border w-full md:w-auto justify-start overflow-x-auto flex-nowrap scrollbar-hide">
            <TabsTrigger value="profile" className="rounded-2xl px-8 py-3 font-black text-sm tracking-widest data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all gap-2 whitespace-nowrap">
              <User size={18} />
              Biodata
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-2xl px-8 py-3 font-black text-sm tracking-widest data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all gap-2 whitespace-nowrap">
              <ImageIcon size={18} />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="packages" className="rounded-2xl px-8 py-3 font-black text-sm tracking-widest data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all gap-2 whitespace-nowrap">
              <Package size={18} />
              Paket Layanan
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-black text-muted-foreground tracking-widest mb-1">Status Profil</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Verified Professional</span>
              <CheckCircle2 className="text-accent w-5 h-5" />
            </div>
          </div>
        </div>

        {/* content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          <div className="space-y-8">
            {/* TABS CONTENT */}
            <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <Card className="rounded-[2.5rem] border-border shadow-md shadow-black/5 overflow-hidden">
                <CardHeader className="bg-muted/30 p-8 border-b border-border">
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <User className="text-accent" /> Informasi Pribadi
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-medium tracking-tight">Ceritakan keahlian dan kepribadian Anda kepada kustomer.</CardDescription>
                </CardHeader>
                <CardContent className="py-3">
                  {/* Clerk Account Data Info (Read Only) */}
                  <div className="bg-accent/5 border border-accent/10 rounded-[2rem] p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center text-accent shadow-sm border border-border">
                        <User size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-foreground text-lg leading-tight">{clerkFrontUser?.fullName}</h4>
                        <p className="text-sm text-muted-foreground font-bold tracking-widest mt-1">@{clerkFrontUser?.username}</p>
                        <p className="text-xs text-muted-foreground font-medium">{clerkFrontUser?.primaryEmailAddress?.emailAddress}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-accent/30 text-accent font-bold hover:bg-accent/10 px-6 cursor-pointer"
                      onClick={() => openUserProfile()}
                    >
                      Edit Profil
                    </Button>
                  </div>

                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit((v) => updateProfileMutation.mutate(v))} className="space-y-8">

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold">Bio Profesional</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Contoh: Fotografer spesialis wedding dengan gaya sinematik..."
                                className="min-h-[150px] rounded-2xl border-border focus:ring-primary/20"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-muted-foreground">Bio yang menarik meningkatkan kemungkinan booking hingga 40%.</FormDescription>
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
                              <FormLabel className="text-foreground font-bold">Kota Domisili</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-5 h-5" />
                                  <Input placeholder="Contoh: Jakarta Selatan" className="pl-12 rounded-2xl border-border h-14 font-medium" {...field} />
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
                              <FormLabel className="text-foreground font-bold">Kategori Spesialis</FormLabel>
                              <div className="flex flex-wrap gap-2 pt-1">
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
                                    className={`rounded-xl border px-5 py-2.5 text-xs font-black tracking-widest transition-all shadow-sm cursor-pointer ${field.value.includes(kat)
                                      ? "bg-accent text-white border-accent shadow-lg shadow-accent/25 scale-105"
                                      : "bg-card hover:bg-muted/50 border-border text-muted-foreground"
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
                              <FormLabel className="text-foreground font-bold">Status Reservasi</FormLabel>
                              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${field.value ? 'bg-primary/10 border-primary/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                <div className="flex flex-col gap-0.5">
                                  <span className={`font-black text-sm tracking-tight ${field.value ? "text-primary" : "text-rose-500"}`}>
                                    {field.value ? "Open Order" : "Closed Order"}
                                  </span>
                                  <span className={`text-[10px] font-bold tracking-widest ${field.value ? "text-primary/70" : "text-rose-500/70"}`}>
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
                                  className={`${field.value ? "data-[state=checked]:bg-primary" : "data-[state=unchecked]:bg-rose-500"}`}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-4 font-medium leading-relaxed bg-muted/20 p-4 rounded-2xl border border-border shadow-sm">
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
                              <FormLabel className="text-foreground font-bold">Standard Minimum Fee (Rp)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 font-black text-sm">Rp</div>
                                  <Input
                                    type="number"
                                    placeholder="Contoh: 500000"
                                    className="pl-12 rounded-2xl border-border h-14 font-black text-lg"
                                    {...field}
                                    value={field.value as string | number}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-muted-foreground">Proteksi harga minimal Anda saat menerima proyek dari Mitra.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-8 border-t border-border flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="h-12 px-8 rounded-2xl font-black text-base gap-2 bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/25 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
              <Card className="rounded-[2.5rem] border-border shadow-md shadow-black/5 overflow-hidden">
                <CardHeader className="bg-muted/30 p-8 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                      <ImageIcon size={28} className="text-accent" /> Portfolio Galeri
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">Foto portfolio asli adalah penentu utama kustomer mengklik tombol booking.</CardDescription>
                    {externalPortfolioUrls.length > 0 && (
                      <div className="mt-2 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <span>Link Portofolio Registrasi:</span>
                        <a href={externalPortfolioUrls[0]} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline truncate max-w-[250px]">
                          {externalPortfolioUrls[0]}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    {(portfolioImages.length) < 5 ? (
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
                          className="rounded-full gap-2 font-black bg-accent hover:bg-accent/90 text-white px-8 h-12 shadow-lg shadow-accent/20"
                        >
                          <label htmlFor="portfolio-upload" className={`${isUploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
                            Unggah Foto
                          </label>
                        </Button>
                      </>
                    ) : (
                      <div className="px-6 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-black tracking-widest flex items-center gap-2">
                        <Clock size={16} /> Limit: 5 Foto
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {portfolioImages.length > 0 ? (
                      portfolioImages.map((url, i) => (
                        <div key={i} className="aspect-square rounded-[1.5rem] overflow-hidden border border-border group relative">
                          <img src={url} alt="Portfolio" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 cursor-pointer">
                              <ImageIcon size={24} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center flex flex-col items-center gap-6 bg-muted/10 border-2 border-dashed border-border rounded-[2.5rem]">
                        <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center text-muted-foreground/30 shadow-inner">
                          <ImageIcon size={32} />
                        </div>
                        <p className="text-muted-foreground font-black tracking-widest text-xs ">Galeri portfolio masih kosong</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              <Card className="rounded-[2.5rem] border-border shadow-md shadow-black/5 overflow-hidden">
                <CardHeader className="bg-muted/30 p-8 border-b border-border">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl font-black flex items-center gap-3">
                        <Package size={28} className="text-accent" /> Daftar Paket Saya
                      </CardTitle>
                      <CardDescription className="text-muted-foreground font-medium">Tambah atau kelola paket harga jasa pemotretan Anda.</CardDescription>
                    </div>
                    <Button variant="outline" className="rounded-full gap-2 font-bold px-6 border-border cursor-pointer w-full sm:w-auto" onClick={() => document.getElementById('add-package-form')?.scrollIntoView({ behavior: 'smooth' })}>
                      <Plus size={18} /> Tambah Baru
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid gap-6">
                    {pgPackages.length > 0 ? (
                      pgPackages.filter(p => p.isActive).map((pkg) => (
                        <div key={pkg.id} className="relative p-6 rounded-[2rem] border border-border bg-card hover:border-accent/40 hover:shadow-xl transition-all group flex flex-col md:flex-row gap-6 items-center">
                          <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-accent flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Package size={32} />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-black text-foreground tracking-tight mb-1">{pkg.namaPaket}</h3>
                            <p className="text-sm text-muted-foreground font-medium  line-clamp-1 mb-4">{pkg.deskripsi}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-muted-foreground tracking-widest">
                              <div className="flex items-center gap-1.5"><Clock size={14} /> {pkg.durasiJam} Jam</div>
                              <div className="flex items-center gap-1.5"><ImageIcon size={14} /> {pkg.jumlahFotoMin}+ Foto</div>
                              {pkg.includesEditing && <div className="text-accent flex items-center gap-1"><CheckCircle2 size={12} /> Editing</div>}
                            </div>
                          </div>
                          <div className="flex flex-col items-center md:items-end gap-3 flex-shrink-0">
                            <span className="text-2xl font-black text-foreground tracking-tighter">Rp {pkg.harga.toLocaleString('id-ID')}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-full h-10 px-4 gap-2 font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                      <div className="py-20 text-center flex flex-col items-center gap-4 bg-muted/10 border-2 border-dashed border-border rounded-[2.5rem]">
                        <Package size={48} className="text-muted-foreground/30" />
                        <p className="text-muted-foreground font-black tracking-widest text-xs ">Belum ada paket terdaftar</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* FORM TAMBAH PAKET */}
              <Card id="add-package-form" className="rounded-[2.5rem] border-border shadow-md shadow-black/5 overflow-hidden border-2 border-accent/20">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black text-accent">Tambah Paket Baru</CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">Buat tawaran menarik yang sulit ditolak kustomer.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <Form {...packageForm}>
                    <form onSubmit={packageForm.handleSubmit((v) => addPackageMutation.mutate(v))} className="space-y-6">
                      <FormField
                        control={packageForm.control}
                        name="namaPaket"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-bold">Nama Paket</FormLabel>
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
                            <FormLabel className="text-foreground font-bold">Deskripsi Paket</FormLabel>
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
                              <FormLabel className="text-foreground font-bold">Harga (Rp)</FormLabel>
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
                              <FormLabel className="text-foreground font-bold">Durasi (Jam)</FormLabel>
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
                              <FormLabel className="text-foreground font-bold">Minimal Foto</FormLabel>
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
                          <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border p-6 bg-muted/20">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-bold text-foreground">Termasuk Foto Editing?</FormLabel>
                              <FormDescription className="text-xs">Aktifkan jika harga paket ini sudah mencakup biaya edit foto.</FormDescription>
                            </div>
                            <FormControl>
                              <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${field.value ? "bg-accent" : "bg-muted"
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
                        className="w-full h-16 rounded-[1.5rem] font-black text-xl gap-2 shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
            <Card className="rounded-[2.5rem] border-border bg-card shadow-md shadow-black/5">
              <CardHeader className="p-6 pb-2 border-b border-border/50">
                <CardTitle className="text-xs font-black text-muted-foreground tracking-[0.2em]">Status Profil Fotografer</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-black text-foreground tracking-tighter">Checklist Kelengkapan:</h4>
                  <div className="space-y-3">
                    <CheckItem label="Username (contoh: @framic_id)" checked={!!(photographer.username || clerkFrontUser?.username)} />
                    <CheckItem label="Lengkapi Bio" checked={!!photographer.bio} />
                    <CheckItem label="Unggah Portfolio" checked={photographer.portfolioUrls.length > 0} />
                    <CheckItem label="Buat Minimal 1 Paket" checked={pgPackages.length > 0} />
                  </div>
                </div>

                <div className="p-5 rounded-[1.5rem] bg-accent/5 border border-accent/10 space-y-3">
                  <div className="flex items-center gap-2 text-accent font-black tracking-tight text-sm">
                    <Globe size={18} className="text-accent" /> Syarat Tampil Publik
                  </div>
                  <p className="text-xs text-accent/80 font-medium leading-relaxed">
                    Pastikan seluruh checklist di atas terpenuhi. Profil fotografer yang belum lengkap tidak akan muncul di pencarian kustomer.
                  </p>
                </div>
              </CardContent>
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
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${checked ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground/30'}`}>
        <CheckCircle2 size={12} fill={checked ? "currentColor" : "none"} />
      </div>
      <span className={`text-sm font-medium ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
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
