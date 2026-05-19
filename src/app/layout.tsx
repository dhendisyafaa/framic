import type { Metadata } from "next"
import { Lora } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const lora = Lora({ subsets: ["latin"], variable: "--font-serif" })

export const metadata: Metadata = {
  title: "Framic",
  description: "Platform booking jasa fotografer profesional",
}

import { ClerkProvider } from "@clerk/nextjs"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#059669',
          colorText: '#0f172a',
          colorInputBackground: '#ffffff',
          colorInputText: '#0f172a',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'shadow-xl rounded-2xl border border-slate-100',
          formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-700 shadow-md',
          userButtonAvatarBox: 'w-10 h-10 border-2 border-emerald-500/20 shadow-sm transition-transform hover:scale-105',
        }
      }}>
      <html lang="en" className={cn("font-serif", lora.variable)}>
        <body className="antialiased">
          <QueryProvider>
            {children}
            <Toaster richColors position="top-center" />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
