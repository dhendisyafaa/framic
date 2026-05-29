import { createClerkClient } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { orders, photographerProfiles, packages, events } from "@/db/schema"
import { sendEmail } from "./resend"
import { captureError } from "./sentry"

// Initialize Clerk
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Premium email layout styled with Framic's brand colors (Ink Black, Canvas Cream, Signal Orange)
function getEmailLayout(
  title: string,
  greeting: string,
  contentHtml: string,
  ctaText?: string,
  ctaUrl?: string
) {
  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F3F0EE; padding: 40px 20px; color: #141413;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FCFBFA; border: 1px solid #D1CDC7; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.05em; color: #141413;">
            <span style="color: #F37338;">f</span>ramic
          </span>
        </div>

        <!-- Title -->
        <h2 style="font-size: 22px; font-weight: 700; color: #141413; margin-top: 0; margin-bottom: 20px; text-align: center; letter-spacing: -0.02em;">
          ${title}
        </h2>

        <!-- Greeting -->
        <p style="font-size: 16px; line-height: 1.6; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #141413;">
          Halo ${greeting},
        </p>

        <!-- Main Content -->
        <div style="font-size: 15px; line-height: 1.6; color: #696969; margin-bottom: 32px;">
          ${contentHtml}
        </div>

        <!-- CTA Button -->
        ${
          ctaText && ctaUrl
            ? `
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${ctaUrl}" style="display: inline-block; background-color: #141413; color: #F3F0EE; padding: 14px 28px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 15px;">
              ${ctaText}
            </a>
          </div>
        `
            : ""
        }

        <hr style="border: 0; border-top: 1px solid #D1CDC7; margin: 32px 0;" />

        <!-- Footer -->
        <div style="text-align: center; font-size: 12px; color: #9E9E9E; line-height: 1.5;">
          <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Framic. All rights reserved.</p>
          <p style="margin: 0;">Email ini dikirimkan secara otomatis oleh sistem. Harap tidak membalas email ini secara langsung.</p>
        </div>

      </div>
    </div>
  `
}

// Helper to fetch details needed for email
async function getOrderDetails(orderId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      customerClerkId: orders.customerClerkId,
      orderType: orders.orderType,
      lokasi: orders.lokasi,
      tanggalPotret: orders.tanggalPotret,
      totalHarga: orders.totalHarga,
      catatan: orders.catatan,
      paketId: orders.paketId,
      eventId: orders.eventId,
      photographerClerkId: photographerProfiles.clerkId,
    })
    .from(orders)
    .innerJoin(photographerProfiles, eq(orders.photographerId, photographerProfiles.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) return null

  let detailName = "Pesanan Direct"
  if (order.paketId) {
    const [paket] = await db
      .select({ nama: packages.namaPaket })
      .from(packages)
      .where(eq(packages.id, order.paketId))
      .limit(1)
    if (paket) detailName = `Paket: ${paket.nama}`
  } else if (order.eventId) {
    const [event] = await db
      .select({ namaEvent: events.namaEvent })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1)
    if (event) detailName = `Event: ${event.namaEvent}`
  }

  return {
    ...order,
    detailName,
  }
}

// Fetch user detail from Clerk with fallback
async function getClerkUserDetail(clerkId: string) {
  try {
    const u = await clerk.users.getUser(clerkId)
    const email = u.emailAddresses?.[0]?.emailAddress
    const name = u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User"
    return { email, name }
  } catch (err) {
    console.error(`Failed to fetch Clerk user ${clerkId}:`, err)
    return null
  }
}

function formatDetailsTable(details: {
  "Tipe Pesanan": string
  "Tanggal Pemotretan": string
  "Lokasi": string
  "Total Biaya": string
  "Catatan"?: string
}) {
  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; font-size: 14px; text-align: left;">
      <tbody>
        ${Object.entries(details)
          .map(([key, val]) => {
            if (!val) return ""
            return `
            <tr style="border-bottom: 1px solid #E8E2DA;">
              <td style="padding: 10px 0; font-weight: 600; color: #141413; width: 40%;">${key}</td>
              <td style="padding: 10px 0; color: #696969;">${val}</td>
            </tr>
          `
          })
          .join("")}
      </tbody>
    </table>
  `
}

/**
 * 1. Kirim Email Notifikasi Order Baru
 */
export async function sendNewOrderEmails(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId)
    if (!order) return

    const customer = await getClerkUserDetail(order.customerClerkId)
    const photographer = await getClerkUserDetail(order.photographerClerkId)

    const formattedDate = new Date(order.tanggalPotret).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const detailsTable = formatDetailsTable({
      "Tipe Pesanan": order.detailName,
      "Tanggal Pemotretan": formattedDate,
      "Lokasi": order.lokasi,
      "Total Biaya": `Rp ${order.totalHarga.toLocaleString("id-ID")}`,
      "Catatan": order.catatan || "-",
    })

    // Email untuk Customer
    if (customer?.email) {
      const html = getEmailLayout(
        "Booking Berhasil Diajukan",
        customer.name,
        `Booking Anda telah berhasil diajukan dan sedang menunggu konfirmasi dari fotografer. Kami akan segera memberi tahu Anda ketika pesanan telah dikonfirmasi.<br/>
        ${detailsTable}`,
        "Lihat Detail Pesanan",
        `${APP_URL}/dashboard/orders/${orderId}`
      )
      await sendEmail({
        to: customer.email,
        subject: "Booking Baru Berhasil Diajukan",
        html,
      })
    }

    // Email untuk Photographer
    if (photographer?.email) {
      const html = getEmailLayout(
        "Ada Pesanan Baru Masuk!",
        photographer.name,
        `Anda telah menerima pengajuan booking baru dari <strong>${
          customer?.name || "Pelanggan"
        }</strong>. Silakan konfirmasi pesanan ini sebelum jadwal terisi.<br/>
        ${detailsTable}`,
        "Kelola Pesanan",
        `${APP_URL}/dashboard`
      )
      await sendEmail({
        to: photographer.email,
        subject: "Pesanan Baru Menunggu Konfirmasi Anda",
        html,
      })
    }
  } catch (err) {
    captureError(err, { context: "sendNewOrderEmails", orderId })
  }
}

/**
 * 2. Kirim Email Notifikasi Order Dikonfirmasi
 */
export async function sendOrderConfirmedEmail(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId)
    if (!order) return

    const customer = await getClerkUserDetail(order.customerClerkId)

    if (customer?.email) {
      const formattedDate = new Date(order.tanggalPotret).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      const detailsTable = formatDetailsTable({
        "Tipe Pesanan": order.detailName,
        "Tanggal Pemotretan": formattedDate,
        "Lokasi": order.lokasi,
        "Total Biaya": `Rp ${order.totalHarga.toLocaleString("id-ID")}`,
      })

      const html = getEmailLayout(
        "Pesanan Anda Telah Dikonfirmasi!",
        customer.name,
        `Kabar baik! Fotografer telah mengonfirmasi pesanan Anda. Silakan segera lakukan pembayaran Down Payment (DP) 50% untuk mengamankan tanggal dan jadwal pemotretan Anda.<br/>
        ${detailsTable}`,
        "Bayar DP Sekarang",
        `${APP_URL}/dashboard/orders/${orderId}`
      )

      await sendEmail({
        to: customer.email,
        subject: "Pesanan Dikonfirmasi — Silakan Lakukan Pembayaran DP",
        html,
      })
    }
  } catch (err) {
    captureError(err, { context: "sendOrderConfirmedEmail", orderId })
  }
}

/**
 * 3. Kirim Email Notifikasi Order Ditolak
 */
export async function sendOrderRejectedEmail(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId)
    if (!order) return

    const customer = await getClerkUserDetail(order.customerClerkId)

    if (customer?.email) {
      const html = getEmailLayout(
        "Pesanan Anda Ditolak",
        customer.name,
        `Mohon maaf, fotografer belum dapat menerima pesanan Anda untuk tanggal tersebut karena kendala jadwal atau hal operasional lainnya. Saldo atau kuota Anda tidak terpotong untuk transaksi ini. Silakan cari fotografer alternatif lainnya di katalog kami.`,
        "Cari Fotografer Lain",
        `${APP_URL}/photographers`
      )

      await sendEmail({
        to: customer.email,
        subject: "Status Pesanan: Ditolak oleh Fotografer",
        html,
      })
    }
  } catch (err) {
    captureError(err, { context: "sendOrderRejectedEmail", orderId })
  }
}

/**
 * 4. Kirim Email Notifikasi Order Dibatalkan
 */
export async function sendOrderCancelledEmail(
  orderId: string,
  cancelledByClerkId: string
): Promise<void> {
  try {
    const order = await getOrderDetails(orderId)
    if (!order) return

    const customer = await getClerkUserDetail(order.customerClerkId)
    const photographer = await getClerkUserDetail(order.photographerClerkId)

    const cancelledBy = await getClerkUserDetail(cancelledByClerkId)
    const cancellerName = cancelledBy?.name || "salah satu pihak"

    // Kirim notifikasi ke fotografer
    if (photographer?.email && order.customerClerkId === cancelledByClerkId) {
      const html = getEmailLayout(
        "Pesanan Dibatalkan",
        photographer.name,
        `Pemberitahuan bahwa pesanan untuk tanggal pemotretan Anda telah dibatalkan oleh Pelanggan (<strong>${cancellerName}</strong>).`,
        "Lihat Dashboard",
        `${APP_URL}/dashboard`
      )
      await sendEmail({
        to: photographer.email,
        subject: "Pesanan Dibatalkan oleh Pelanggan",
        html,
      })
    }

    // Kirim notifikasi ke customer jika dibatalkan pihak lain (misal fotografer/mitra)
    if (customer?.email && order.customerClerkId !== cancelledByClerkId) {
      const html = getEmailLayout(
        "Pesanan Dibatalkan",
        customer.name,
        `Pemberitahuan bahwa pesanan Anda telah dibatalkan oleh ${
          order.orderType === "event" ? "Mitra" : "Fotografer"
        } (<strong>${cancellerName}</strong>).`,
        "Lihat Dashboard",
        `${APP_URL}/dashboard`
      )
      await sendEmail({
        to: customer.email,
        subject: "Pesanan Anda Telah Dibatalkan",
        html,
      })
    }
  } catch (err) {
    captureError(err, { context: "sendOrderCancelledEmail", orderId })
  }
}

/**
 * 5. Kirim Email Notifikasi DP Berhasil Dibayar
 */
export async function sendDpPaidEmails(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId)
    if (!order) return

    const customer = await getClerkUserDetail(order.customerClerkId)
    const photographer = await getClerkUserDetail(order.photographerClerkId)

    const formattedDate = new Date(order.tanggalPotret).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const detailsTable = formatDetailsTable({
      "Tipe Pesanan": order.detailName,
      "Tanggal Pemotretan": formattedDate,
      "Lokasi": order.lokasi,
      "Total Biaya": `Rp ${order.totalHarga.toLocaleString("id-ID")}`,
    })

    // Ke Customer
    if (customer?.email) {
      const html = getEmailLayout(
        "Pembayaran DP Berhasil!",
        customer.name,
        `Terima kasih! Pembayaran Down Payment (DP) sebesar 50% untuk pesanan Anda telah kami terima. Jadwal pemotretan Anda kini telah resmi terpesan dan terkunci.<br/>
        ${detailsTable}`,
        "Lihat Pesanan",
        `${APP_URL}/dashboard/orders/${orderId}`
      )
      await sendEmail({
        to: customer.email,
        subject: "Pembayaran DP Berhasil — Jadwal Terkunci",
        html,
      })
    }

    // Ke Photographer
    if (photographer?.email) {
      const html = getEmailLayout(
        "Pembayaran DP Diterima — Jadwal Terkunci",
        photographer.name,
        `Kabar baik! Pelanggan (<strong>${
          customer?.name || "Pelanggan"
        }</strong>) telah melunasi pembayaran Down Payment (DP) 50% untuk pesanan mendatang.<br/>
        Jadwal ini sekarang telah ditandai sebagai **Booked** di kalender Anda. Mohon bersiap untuk jadwal pemotretan tersebut.<br/>
        ${detailsTable}`,
        "Lihat Jadwal",
        `${APP_URL}/dashboard`
      )
      await sendEmail({
        to: photographer.email,
        subject: "Pembayaran DP Diterima — Jadwal Pemotretan Terkunci",
        html,
      })
    }
  } catch (err) {
    captureError(err, { context: "sendDpPaidEmails", orderId })
  }
}

/**
 * 6. Kirim Email Notifikasi Pelunasan Berhasil Dibayar
 */
export async function sendPelunasanPaidEmails(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId)
    if (!order) return

    const customer = await getClerkUserDetail(order.customerClerkId)
    const photographer = await getClerkUserDetail(order.photographerClerkId)

    // Ke Customer
    if (customer?.email) {
      const html = getEmailLayout(
        "Pembayaran Pelunasan Berhasil!",
        customer.name,
        `Terima kasih! Pembayaran pelunasan (50% sisa) untuk pesanan Anda telah berhasil diterima. Pemotretan dan transaksi Anda telah lunas sepenuhnya.`,
        "Buka Pesanan",
        `${APP_URL}/dashboard/orders/${orderId}`
      )
      await sendEmail({
        to: customer.email,
        subject: "Pembayaran Pelunasan Berhasil Diterima",
        html,
      })
    }

    // Ke Photographer
    if (photographer?.email) {
      const html = getEmailLayout(
        "Pembayaran Pelunasan Selesai",
        photographer.name,
        `Pemberitahuan bahwa pelanggan (<strong>${
          customer?.name || "Pelanggan"
        }</strong>) telah melakukan pembayaran pelunasan. Seluruh transaksi pemotretan ini kini telah lunas.`,
        "Buka Pesanan",
        `${APP_URL}/dashboard`
      )
      await sendEmail({
        to: photographer.email,
        subject: "Pelunasan Pembayaran Pesanan Diterima",
        html,
      })
    }
  } catch (err) {
    captureError(err, { context: "sendPelunasanPaidEmails", orderId })
  }
}

/**
 * 7. Kirim Email Notifikasi Order Selesai (Completed)
 */
export async function sendOrderCompletedEmails(orderId: string): Promise<void> {
  try {
    const order = await getOrderDetails(orderId)
    if (!order) return

    const customer = await getClerkUserDetail(order.customerClerkId)
    const photographer = await getClerkUserDetail(order.photographerClerkId)

    // Ke Customer
    if (customer?.email) {
      const html = getEmailLayout(
        "Pesanan Selesai — Terima Kasih!",
        customer.name,
        `Pesanan Anda telah ditandai sebagai **Selesai**. Terima kasih telah menggunakan jasa fotografer Framic! Silakan berikan ulasan & rating bintang untuk membantu fotografer meningkatkan pelayanan mereka.`,
        "Berikan Ulasan & Rating",
        `${APP_URL}/dashboard/orders/${orderId}`
      )
      await sendEmail({
        to: customer.email,
        subject: "Pesanan Selesai — Berikan Ulasan Anda",
        html,
      })
    }

    // Ke Photographer
    if (photographer?.email) {
      const html = getEmailLayout(
        "Pesanan Selesai & Dana Ditambahkan",
        photographer.name,
        `Selamat! Pesanan Anda telah ditandai sebagai **Selesai** oleh pelanggan. Saldo pendapatan Anda dari pesanan ini telah ditambahkan ke **Saldo Tersedia** Anda dan siap untuk ditarik.`,
        "Kelola Saldo Anda",
        `${APP_URL}/dashboard`
      )
      await sendEmail({
        to: photographer.email,
        subject: "Pesanan Selesai — Pendapatan Ditambahkan ke Saldo",
        html,
      })
    }
  } catch (err) {
    captureError(err, { context: "sendOrderCompletedEmails", orderId })
  }
}
