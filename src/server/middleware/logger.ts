// src/server/middleware/logger.ts
// Custom middleware logger untuk mencatat setiap request API
// Menggunakan honor/logger bawaan untuk memudahkan tracking eksekusi API

import { logger as honoLogger } from "hono/logger"

/**
 * Middleware logger.
 * Mencatat format standar: [HTTP_METHOD] /path - status_code time
 * Berguna saat development.
 */
export const logger = honoLogger()
