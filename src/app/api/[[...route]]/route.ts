// src/app/api/[[...route]]/route.ts
// Next.js API Routes Adapter untuk melayani framework Hono
// Framework configuration dan endpoint mounting ada di src/server/index.ts

import { handle } from "hono/vercel"
import { app } from "@/server"

// Bind Next.js dynamic routing catch-all ke `app` Hono
export const GET = handle(app)
export const POST = async (req: Request) => {
  return handle(app)(req)
}
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

