import { auth } from "@clerk/nextjs/server"
import { createMiddleware } from "hono/factory"
import { AuthError } from "@/lib/clerk"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * Memastikan request memiliki user session Clerk yang valid & akun aktif.
 * Jika tidak login, akan melempar AuthError (401).
 * Jika login tapi akun di-ban (isActive: false), lempar AuthError (403).
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const { userId } = await auth()

  if (!userId) {
    throw new AuthError(401, "Unauthorized: Harus login")
  }

  // Check global isActive di setiap request terproteksi
  const [dbUser] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  if (dbUser && !dbUser.isActive) {
    throw new AuthError(403, "Akses dilarang: Akun Anda telah ditangguhkan oleh admin.")
  }

  c.set("clerkId", userId)
  await next()
})
