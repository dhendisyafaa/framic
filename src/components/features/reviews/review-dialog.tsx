"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Textarea } from "@/components/ui/textarea"
import { StarIcon, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  komentar: z.string().min(10, "Ulasan minimal 10 karakter"),
})

type ReviewValues = z.infer<typeof reviewSchema>

interface ReviewDialogProps {
  orderId: string
}

export function ReviewDialog({ orderId }: ReviewDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      komentar: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ReviewValues & { orderId: string }) => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    },
    onSuccess: () => {
      toast.success("Terima kasih atas ulasan Anda! ⭐")
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })
      setOpen(false)
      form.reset()
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const onSubmit = (values: ReviewValues) => {
    mutation.mutate({ ...values, orderId })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-2xl bg-primary text-white font-bold py-7">
           Beri Rating & Review ⭐
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-0 overflow-hidden border-none">
        <div className="bg-slate-900 p-8 text-white">
           <DialogHeader>
             <DialogTitle className="text-2xl font-black italic tracking-tight flex items-center gap-2">
                Bagikan Pengalamanmu 📸
             </DialogTitle>
           </DialogHeader>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
             <FormField
               control={form.control}
               name="rating"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating Anda</FormLabel>
                   <FormControl>
                     <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button 
                            key={s} 
                            type="button"
                            onClick={() => field.onChange(s)}
                            className="focus:outline-none transition-transform hover:scale-125"
                          >
                            <StarIcon className={cn("w-8 h-8", s <= field.value ? "fill-primary text-primary" : "text-slate-200")} />
                          </button>
                        ))}
                     </div>
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />

             <FormField
               control={form.control}
               name="komentar"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" /> Ulasan Singkat
                   </FormLabel>
                   <FormControl>
                     <Textarea 
                       placeholder="Bagikan apa yang Anda suka dari hasil pemotretan ini..."
                       className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 font-medium italic"
                       {...field}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />

             <Button 
               type="submit"
               className="w-full rounded-2xl font-black py-6"
               disabled={mutation.isPending}
             >
                {mutation.isPending ? "Mengirim..." : "Kirim Ulasan Sekarang"}
             </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
