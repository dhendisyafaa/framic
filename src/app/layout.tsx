import type { Metadata } from "next"
import { Sofia_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const sofiaSans = Sofia_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Framic",
  description: "Platform booking jasa fotografer profesional",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
}

import { ClerkProvider } from "@clerk/nextjs"
import { idID } from '@clerk/localizations';
import { QueryProvider } from "@/components/providers/query-provider"
import { PostHogProvider } from "@/components/providers/posthog-provider"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#FF5F00', // Accent Orange matches framic brand
          colorText: 'var(--foreground)',
          colorBackground: 'var(--card)',
          colorInputBackground: 'var(--input)',
          colorInputText: 'var(--foreground)',
          borderRadius: '20px',
        },
        elements: {
          card: 'shadow-xl rounded-[24px] border border-muted bg-card text-foreground',
          headerTitle: 'text-foreground font-bold',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'bg-card hover:bg-muted border border-muted text-foreground rounded-xl transition-all shadow-sm',
          socialButtonsBlockButtonText: 'text-foreground font-semibold',
          dividerText: 'text-muted-foreground',
          dividerLine: 'bg-muted',
          formFieldLabel: 'text-foreground font-medium',
          formFieldInput: 'bg-input border border-muted text-foreground rounded-xl focus:border-primary focus:ring-1 focus:ring-primary',
          footerActionText: 'text-muted-foreground',
          footerActionLink: 'text-accent hover:text-accent/90 font-semibold',
          backLink: 'text-accent hover:text-accent/90 font-semibold',
          identityPreviewText: 'text-foreground',
          identityPreviewEditButtonIcon: 'text-muted-foreground',
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-[20px]',
          userButtonAvatarBox: 'w-10 h-10 border-2 border-primary/20 shadow-sm transition-transform hover:scale-105',
          userButtonPopoverCard: 'bg-card text-foreground border border-muted/80 shadow-2xl rounded-[24px]',
          userButtonPopoverActionButton: 'hover:bg-muted/50 text-foreground transition-all duration-150',
          userButtonPopoverActionButtonText: 'text-foreground font-semibold',
          userButtonPopoverActionButtonIcon: 'text-muted-foreground',
          userButtonPopoverTitle: 'text-foreground font-bold',
          userButtonPopoverSubtitle: 'text-muted-foreground',
          userButtonPopoverFooter: 'border-t border-muted/50 bg-muted/10 text-muted-foreground',
        }
      }} localization={idID}>
      <html lang="id" className={cn("font-sans", sofiaSans.variable)} suppressHydrationWarning>
        <body className="antialiased bg-background text-foreground">
          <PostHogProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster richColors position="top-center" />
              </ThemeProvider>
            </QueryProvider>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

