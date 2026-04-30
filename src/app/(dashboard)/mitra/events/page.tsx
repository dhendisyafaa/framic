import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { mitraProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { MitraEventsClient } from "./events-client"

export default async function MitraEventsPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/")

  const [mitra] = await db
    .select({ id: mitraProfiles.id })
    .from(mitraProfiles)
    .where(eq(mitraProfiles.clerkId, clerkUser.id))
    .limit(1)

  if (!mitra) redirect("/dashboard")

  return <MitraEventsClient mitraId={mitra.id} />
}
