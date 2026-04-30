// src/server/middleware/error-handler.ts
// Global error handler untuk aplikasi Hono
// Menangkap AuthError, ZodError, dan error tak terduga (dilaporkan ke Sentry)

import { ErrorHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import type { StatusCode } from "hono/utils/http-status"
import { ZodError } from "zod"
import { AuthError } from "@/lib/clerk"
import { captureError } from "@/lib/sentry"

export const errorHandler: ErrorHandler = (err, c) => {
  // 1. Tangkap AuthError dari clerk guard
  if (err instanceof AuthError) {
    return c.json(
      { success: false, error: err.message },
      { status: err.statusCode }, // 401 | 403
    )
  }

  // 2. Tangkap ZodError (jika validasi manual ter-trigger dan throw ZodError)
  if (err instanceof ZodError) {
    const zodErr = err as ZodError<unknown>
    // type casting for ZodError generic since strict TS doesn't allow any
    const errorMessage = (zodErr.issues || []).map((e) => e.message).join(", ")
    return c.json({ success: false, error: `Validasi gagal: ${errorMessage}` }, { status: 400 })
  }

  // 3. Tangkap HTTPException bawaan dari Hono (contoh: 404 dari c.notFound())
  if (err instanceof HTTPException) {
    return c.json(
      { success: false, error: err.message },
      { status: err.status },
    )
  }

  // 4. Unexpected Errors (Internal Server Error)
  // Tampilkan stack trace di terminal development agar mudah di-debug
  if (process.env.NODE_ENV === "development") {
    console.error(`\x1b[31m[ERROR 500]\x1b[0m ${c.req.method} ${c.req.url}`)
    console.error(err)
  }

  // Laporkan ke Sentry beserta context tambahan jika memungkinkan
  captureError(err, {
    method: c.req.method,
    url: c.req.url,
  })

  // Jangan bocorkan detail error sensitive di environment production
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "Internal Server Error"

  return c.json({ success: false, error: message }, { status: 500 })
}
