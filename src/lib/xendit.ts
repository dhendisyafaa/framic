// src/lib/xendit.ts
// Xendit client + payment helpers (xenPlatform)
// Dipakai untuk: DP 50%, pelunasan 50%, split payment otomatis, refund
// Docs: https://developers.xendit.co

import Xendit from "xendit-node"

const xenditSecretKey = process.env.XENDIT_SECRET_KEY

if (!xenditSecretKey) {
  throw new Error(
    "Missing Xendit env variable: XENDIT_SECRET_KEY harus diisi di .env.local",
  )
}

export const xenditClient = new Xendit({ secretKey: xenditSecretKey })

// ---------------------------------------------------------------------------
// Invoice helpers — Xendit Invoice API
// ---------------------------------------------------------------------------

export interface CreateInvoiceParams {
  /** Format: "framic_order_{orderId}_{dp|settle}" */
  externalId: string
  amount: number
  payerEmail: string
  description: string
  /** Waktu expired invoice dalam detik (default: 24 jam) */
  invoiceDurationSeconds?: number
  /** Callback URL untuk webhook Xendit */
  successRedirectUrl?: string
  failureRedirectUrl?: string
}

export interface XenditInvoiceResult {
  invoiceId: string
  invoiceUrl: string
  externalId: string
  amount: number
  expiryDate: string | Date
}

/**
 * Buat Xendit Invoice untuk pembayaran DP atau pelunasan.
 * external_id format: "framic_order_{orderId}_{dp|settle}"
 */
export async function createXenditInvoice(
  params: CreateInvoiceParams,
): Promise<XenditInvoiceResult> {
  const { Invoice } = xenditClient

  const invoice = await Invoice.createInvoice({
    data: {
      externalId: params.externalId,
      amount: params.amount,
      payerEmail: params.payerEmail,
      description: params.description,
      invoiceDuration: params.invoiceDurationSeconds ?? 86400, // 24 jam default
      successRedirectUrl: params.successRedirectUrl,
      failureRedirectUrl: params.failureRedirectUrl,
    },
  })

  return {
    invoiceId: invoice.id ?? "",
    invoiceUrl: invoice.invoiceUrl ?? "",
    externalId: invoice.externalId,
    amount: invoice.amount,
    expiryDate: invoice.expiryDate ?? "",
  }
}

// ---------------------------------------------------------------------------
// Webhook validation
// ---------------------------------------------------------------------------

/**
 * Validasi webhook token dari Xendit.
 * Cek header 'x-callback-token' vs XENDIT_WEBHOOK_TOKEN di env.
 */
export function validateXenditWebhookToken(token: string): boolean {
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN
  if (!expectedToken) return false
  return token === expectedToken
}

// ---------------------------------------------------------------------------
// External ID helpers
// ---------------------------------------------------------------------------

/**
 * Generate external ID untuk Xendit invoice.
 * Format: "framic_order_{orderId}_{dp|settle}"
 */
export function buildExternalId(
  orderId: string,
  type: "dp" | "settle",
): string {
  return `framic_order_${orderId}_${type}`
}

/**
 * Parse external ID dari Xendit webhook untuk mendapatkan orderId dan type.
 * @returns null jika format tidak valid
 */
export function parseExternalId(
  externalId: string,
): { orderId: string; type: "dp" | "settle" } | null {
  const match = externalId.match(/^framic_order_(.+)_(dp|settle)$/)
  if (!match) return null
  return { orderId: match[1], type: match[2] as "dp" | "settle" }
}
