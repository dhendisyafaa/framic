// src/lib/clerk.ts
// Helper untuk ambil current user dan check role di server-side
// Role disimpan di Clerk publicMetadata: { roles: ['customer', 'photographer'] }
// Docs: https://clerk.com/docs/references/nextjs/current-user

import { auth, currentUser } from "@clerk/nextjs/server"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "customer" | "photographer" | "mitra" | "admin"

export interface FramicUser {
  clerkId: string
  email: string
  name: string
  avatarUrl: string | null
  roles: UserRole[]
}

// ---------------------------------------------------------------------------
// Get current user (Server Components & API Routes)
// ---------------------------------------------------------------------------

/**
 * Ambil data user yang sedang login beserta roles-nya.
 * Gunakan di Server Components atau Hono API routes.
 * @returns null jika tidak ada user yang login
 */
export async function getCurrentUser(): Promise<FramicUser | null> {
  const user = await currentUser()
  if (!user) return null

  const roles = getRolesFromMetadata(user.publicMetadata)

  return {
    clerkId: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    avatarUrl: user.imageUrl ?? null,
    roles,
  }
}

/**
 * Ambil hanya clerkId user yang sedang login.
 * Lebih ringan dari getCurrentUser() — pakai jika hanya butuh ID.
 * @returns null jika tidak ada user yang login
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

/**
 * Baca roles dari Clerk publicMetadata.
 * Default: ['customer'] jika tidak ada metadata roles.
 */
export function getRolesFromMetadata(
  publicMetadata: Record<string, unknown>,
): UserRole[] {
  const roles = publicMetadata?.roles
  if (Array.isArray(roles) && roles.length > 0) {
    return roles as UserRole[]
  }
  return ["customer"]
}

/**
 * Cek apakah user memiliki role tertentu.
 */
export function hasRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role)
}

/**
 * Cek apakah user adalah photographer yang sudah login.
 */
export function isPhotographer(roles: UserRole[]): boolean {
  return hasRole(roles, "photographer")
}

/**
 * Cek apakah user adalah mitra yang sudah login.
 */
export function isMitra(roles: UserRole[]): boolean {
  return hasRole(roles, "mitra")
}

/**
 * Cek apakah user adalah admin.
 */
export function isAdmin(roles: UserRole[]): boolean {
  return hasRole(roles, "admin")
}

// ---------------------------------------------------------------------------
// Role guard untuk Hono API routes
// ---------------------------------------------------------------------------

/**
 * Guard untuk dipakai di Hono API routes.
 * Throw error 401/403 jika user tidak memiliki role yang dibutuhkan.
 *
 * @example
 * // Di Hono route handler:
 * const clerkId = await requireRole(c, 'photographer')
 */
export async function requireRole(
  requiredRole: UserRole,
): Promise<{ clerkId: string; roles: UserRole[] }> {
  const { userId } = await auth()

  if (!userId) {
    throw new AuthError(401, "Unauthorized: harus login")
  }

  const user = await currentUser()
  if (!user) {
    throw new AuthError(401, "Unauthorized: user tidak ditemukan")
  }

  const roles = getRolesFromMetadata(user.publicMetadata)

  if (!hasRole(roles, requiredRole)) {
    throw new AuthError(
      403,
      `Forbidden: membutuhkan role '${requiredRole}'`,
    )
  }

  return { clerkId: userId, roles }
}

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  constructor(
    public readonly statusCode: 401 | 403,
    message: string,
  ) {
    super(message)
    this.name = "AuthError"
  }
}
