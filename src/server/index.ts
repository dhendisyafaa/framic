// src/server/index.ts
// Setup Hono utama, mounting semua router, middleware global

import { Hono } from "hono"
import { apiReference } from "@scalar/hono-api-reference"
import { errorHandler } from "./middleware/error-handler"
import { logger } from "./middleware/logger"
import { usersRouter } from "./routes/users"
import { photographersRouter } from "./routes/photographers"
import { packagesRouter } from "./routes/packages"
import { eventsRouter } from "./routes/events"
import { reviewsRouter } from "./routes/reviews"
import { ordersRouter } from "./routes/orders"
import { photosRouter } from "./routes/photos"
import { paymentsRouter } from "./routes/payments"
import { webhooksRouter } from "./routes/webhooks"
import { adminRouter } from "./routes/admin"
import { mitraRouter } from "./routes/mitra"
import { contractsRouter } from "./routes/contracts"

// Export type environment variables (bisa di-extend jika butuh cloudflare bindings)
export type Env = {
  Variables: {
    clerkId?: string
  }
}

// Inisialisasi app base path
export const app = new Hono<Env>().basePath("/api")

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Log Request Method & Path
app.use(logger)

// Tangkap semua unhandled error agar return JSON terstruktur
app.onError(errorHandler)

// ---------------------------------------------------------------------------
// API Docs — Scalar
// ---------------------------------------------------------------------------

app.get(
  "/docs",
  apiReference({
    url: "/api/openapi.json",
    pageTitle: "Framic API Reference",
    theme: "default",
  }),
)

// OpenAPI spec placeholder
app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "Framic API",
      version: "1.0.0",
      description: "Platform booking jasa fotografer profesional",
    },
    paths: {},
  })
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (c) => c.json({ success: true, data: { status: "ok" } }))

// ---------------------------------------------------------------------------
// Routers Registration
// ---------------------------------------------------------------------------

app.route("/users", usersRouter)
app.route("/photographers", photographersRouter)
app.route("/packages", packagesRouter)
app.route("/events", eventsRouter)
app.route("/mitra", mitraRouter)
app.route("/contracts", contractsRouter)
app.route("/reviews", reviewsRouter)
app.route("/orders", ordersRouter)
app.route("/payments", paymentsRouter)
app.route("/webhooks", webhooksRouter)
app.route("/photos", photosRouter)
app.route("/admin", adminRouter)
