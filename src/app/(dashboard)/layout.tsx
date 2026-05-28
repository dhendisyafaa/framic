import { Navbar } from "@/components/common/navbar"
import { Footer } from "@/components/common/footer"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 bg-background pb-12">{children}</main>
      <Footer />
    </div>
  )
}
