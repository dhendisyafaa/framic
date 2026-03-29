"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

const KATEGORI_OPTIONS = ["Wedding", "Graduation", "Portrait", "Event", "Product", "Landscape"]
const KOTA_OPTIONS = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Bali", "Medan"]

const filterSchema = z.object({
  kota: z.string().default("all"),
  kategori: z.string().default("all"),
  minRating: z.string().default("0"),
  sortBy: z.string().default("rating"),
})

type FilterValues = z.infer<typeof filterSchema>

export function PhotographerFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      kota: searchParams.get("kota") || "all",
      kategori: searchParams.get("kategori") || "all",
      minRating: searchParams.get("minRating") || "0",
      sortBy: searchParams.get("sortBy") || "rating",
    },
  })

  // Sync Form with URL (for Back/Forward navigation)
  useEffect(() => {
    const values = {
      kota: searchParams.get("kota") || "all",
      kategori: searchParams.get("kategori") || "all",
      minRating: searchParams.get("minRating") || "0",
      sortBy: searchParams.get("sortBy") || "rating",
    }
    form.reset(values)
  }, [searchParams, form])

  // Function to apply filters to URL
  const applyFilters = (values: FilterValues) => {
    const params = new URLSearchParams()
    if (values.kota !== "all") params.set("kota", values.kota)
    if (values.kategori !== "all") params.set("kategori", values.kategori)
    if (values.minRating !== "0") params.set("minRating", values.minRating)
    if (values.sortBy !== "rating") params.set("sortBy", values.sortBy)
    
    const currentQuery = searchParams.toString()
    const newQuery = params.toString()

    if (currentQuery !== newQuery) {
      router.push(`/photographers?${newQuery}`, { scroll: false })
    }
  }

  // Handle value change for each field
  const handleValueChange = (name: keyof FilterValues, value: string) => {
    form.setValue(name, value)
    applyFilters(form.getValues())
  }

  const resetFilters = () => {
    form.reset({
      kota: "all",
      kategori: "all",
      minRating: "0",
      sortBy: "rating",
    })
    router.push("/photographers")
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-white border border-border/50 rounded-2xl shadow-sm sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Search className="w-4 h-4" />
          Filter
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="h-8 text-muted-foreground hover:text-destructive"
        >
          Reset
        </Button>
      </div>

      <Form {...form}>
        <div className="grid gap-5">
          <FormField
            control={form.control}
            name="kota"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kota Domisili</FormLabel>
                <Select 
                  onValueChange={(val) => handleValueChange("kota", val)} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200">
                      <SelectValue placeholder="Pilih Kota" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Kota</SelectItem>
                    {KOTA_OPTIONS.map(kota => (
                      <SelectItem key={kota} value={kota}>{kota}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kategori"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kategori</FormLabel>
                <Select 
                  onValueChange={(val) => handleValueChange("kategori", val)} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {KATEGORI_OPTIONS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minRating"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Minimal Rating</FormLabel>
                <Select 
                  onValueChange={(val) => handleValueChange("minRating", val)} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200">
                      <SelectValue placeholder="Berapapun" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Berapapun</SelectItem>
                    <SelectItem value="4.0">4.0+</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                    <SelectItem value="4.8">4.8+</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortBy"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Urutkan Berdasarkan</FormLabel>
                <Select 
                  onValueChange={(val) => handleValueChange("sortBy", val)} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rating">Rating Tertinggi</SelectItem>
                    <SelectItem value="price_asc">Harga Terendah</SelectItem>
                    <SelectItem value="price_desc">Harga Tertinggi</SelectItem>
                    <SelectItem value="newest">Terbaru</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  )
}
