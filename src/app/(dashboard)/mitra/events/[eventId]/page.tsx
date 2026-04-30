import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { mitraProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { EventDetailClient } from "./event-detail-client"

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/")

  const { eventId } = await params

  const [mitra] = await db
    .select({ id: mitraProfiles.id })
    .from(mitraProfiles)
    .where(eq(mitraProfiles.clerkId, clerkUser.id))
    .limit(1)

  if (!mitra) redirect("/dashboard")

  return <EventDetailClient eventId={eventId} mitraId={mitra.id} />
}
