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
    <ClerkProvider>
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
