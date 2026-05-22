import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/db'
import { customerProfiles, photographerProfiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  // 1. Get Clerk Webhook Secret from env
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET')
    return new Response('Error: Missing webhook secret', { status: 500 })
  }

  // 2. Get headers for verification
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 })
  }

  // 3. Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // 4. Verify signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', { status: 400 })
  }

  // 5. Handle event
  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.updated' || eventType === 'user.created') {
    const { username } = evt.data
    const clerkId = id as string

    if (username) {
      try {
        await db.transaction(async (tx) => {
          // 1. UPSERT ke tabel users
          await tx.insert(users)
            .values({
              clerkId: clerkId,
              username: username,
              roles: ['customer'],
              isActive: true,
            })
            .onConflictDoUpdate({
              target: users.clerkId,
              set: {
                username: username,
                updatedAt: new Date()
              }
            })

          // 2. Pastikan customerProfiles ada (karena semua user minimal punya ini)
          await tx.insert(customerProfiles)
            .values({ clerkId: clerkId })
            .onConflictDoNothing()

          // 3. Sync ke photographer_profiles (HANYA UPDATE jika sudah ada)
          await tx.update(photographerProfiles)
            .set({
              username: username,
              updatedAt: new Date()
            })
            .where(eq(photographerProfiles.clerkId, clerkId))
        })
      } catch (err) {
        console.error('Error syncing username to DB:', err)
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
