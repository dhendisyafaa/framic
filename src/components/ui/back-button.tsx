import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  href: string
  label: string
  className?: string
}

export function BackButton({ href, label, className }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-xs mb-8 group bg-card px-4 py-2 rounded-full border border-muted shadow-sm transition-all",
        className
      )}
    >
      <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
      {label}
    </Link>
  )
}
