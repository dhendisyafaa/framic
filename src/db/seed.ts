import { db } from "./index"
import { 
  users, 
  photographerProfiles, 
  packages, 
  mitraProfiles, 
  events, 
  eventPhotographers,
  orders,
  reviews
} from "./schema"
import { subDays, addDays } from "date-fns"

async function seed() {
  console.log("🌱 Seeding database...")

  // 1. Create Users
  const dummyUsers = [
    { clerkId: "user_pg_1", roles: ["customer", "photographer"] },
    { clerkId: "user_pg_2", roles: ["customer", "photographer"] },
    { clerkId: "user_pg_3", roles: ["customer", "photographer"] },
    { clerkId: "user_mitra_1", roles: ["customer", "mitra"] },
    { clerkId: "user_customer_1", roles: ["customer"] },
  ]

  for (const u of dummyUsers) {
    await db.insert(users).values(u).onConflictDoNothing()
  }

  // 2. Create Photographer Profiles
  const pg1 = await db.insert(photographerProfiles).values({
    clerkId: "user_pg_1",
    bio: "Fotografer profesional dengan pengalaman 10 tahun di bidang pernikahan dan portrait. Menyukai pencahayaan alami.",
    kotaDomisili: "Jakarta",
    kategori: ["Wedding", "Portrait"],
    portfolioUrls: [
      "https://images.unsplash.com/photo-1519741497674-611481863552",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc"
    ],
    ratingAverage: 4.9,
    ratingCount: 15,
    verificationStatus: "verified",
    isAvailable: true,
  }).onConflictDoNothing().returning()

  const pg2 = await db.insert(photographerProfiles).values({
    clerkId: "user_pg_2",
    bio: "Spesialis Graduation dan Event. Siap mengabadikan momen bahagia Anda dengan gaya candid.",
    kotaDomisili: "Bandung",
    kategori: ["Graduation", "Event"],
    portfolioUrls: [
      "https://images.unsplash.com/photo-1523050853063-bd4017507c7b",
      "https://images.unsplash.com/photo-1525921429624-479b6a29d810"
    ],
    ratingAverage: 4.7,
    ratingCount: 8,
    verificationStatus: "verified",
    isAvailable: true,
  }).onConflictDoNothing().returning()

  const pg3 = await db.insert(photographerProfiles).values({
    clerkId: "user_pg_3",
    bio: "Product photographer untuk brand lokal. Minimalis dan estetis.",
    kotaDomisili: "Surabaya",
    kategori: ["Product"],
    portfolioUrls: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
    ],
    ratingAverage: 4.5,
    ratingCount: 3,
    verificationStatus: "pending",
    isAvailable: true,
  }).onConflictDoNothing().returning()

  const pgId1 = pg1[0]?.id
  const pgId2 = pg2[0]?.id
  const pgId3 = pg3[0]?.id

  // 3. Create Packages
  if (pgId1) {
    await db.insert(packages).values([
      {
        photographerId: pgId1,
        namaPaket: "Premium Wedding",
        deskripsi: "Liputan seharian penuh, 2 fotografer, flashdisk kayu eksklusif.",
        harga: 5000000,
        durasiJam: 10,
        jumlahFotoMin: 200,
        includesEditing: true,
        kategori: "Wedding"
      },
      {
        photographerId: pgId1,
        namaPaket: "Simple Portrait",
        deskripsi: "Sesi foto outdoor 2 jam, 10 foto edit terbaik.",
        harga: 750000,
        durasiJam: 2,
        jumlahFotoMin: 30,
        includesEditing: true,
        kategori: "Portrait"
      }
    ]).onConflictDoNothing()
  }

  if (pgId2) {
    await db.insert(packages).values([
      {
        photographerId: pgId2,
        namaPaket: "Graduation Fun",
        deskripsi: "Foto wisuda bareng keluarga atau teman, durasi 3 jam.",
        harga: 1200000,
        durasiJam: 3,
        jumlahFotoMin: 50,
        includesEditing: true,
        kategori: "Graduation"
      }
    ]).onConflictDoNothing()
  }

  // 4. Create Mitra Profile
  const mitra = await db.insert(mitraProfiles).values({
    clerkId: "user_mitra_1",
    namaOrganisasi: "Creative Events ID",
    tipeMitra: "event_organizer",
    alamat: "Jl. Sudirman No. 10, Jakarta",
    nomorTelepon: "081234567890",
    verificationStatus: "verified",
  }).onConflictDoNothing().returning()

  const mitraId = mitra[0]?.id

  // 5. Create Events
  if (mitraId) {
    const event1 = await db.insert(events).values({
      mitraId: mitraId,
      namaEvent: "Jakarta Fashion Week 2026",
      deskripsi: "Event fashion tahunan terbesar di Jakarta.",
      tanggalMulai: addDays(new Date(), 30),
      tanggalSelesai: addDays(new Date(), 35),
      lokasi: "Senayan City",
      coverImageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
      isOpenRecruitment: true,
      kuotaPgPerEvent: 5,
      feePgPerEvent: 2000000,
      deadlineRequest: addDays(new Date(), 15),
      isPublished: true,
    }).onConflictDoNothing().returning()

    const event2 = await db.insert(events).values({
      mitraId: mitraId,
      namaEvent: "Workshop Fotografi Analog",
      deskripsi: "Belajar memotret dengan kamera film.",
      tanggalMulai: addDays(new Date(), 10),
      tanggalSelesai: addDays(new Date(), 10),
      lokasi: "Kuningan, Jakarta",
      coverImageUrl: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9",
      isOpenRecruitment: false,
      isPublished: true,
    }).onConflictDoNothing().returning()

    // 6. Assign PG to Event (Calendar blocked testing)
    if (event1[0] && pgId1) {
      await db.insert(eventPhotographers).values({
        eventId: event1[0].id,
        photographerId: pgId1,
        photographerType: "mitra_permanent",
      }).onConflictDoNothing()
    }
  }

  // 7. Dummy Orders for Reviews & Calendar
  if (pgId1) {
    const order1 = await db.insert(orders).values({
      customerClerkId: "user_customer_1",
      photographerId: pgId1,
      orderType: "direct",
      lokasi: "Jakarta Central Park",
      tanggalPotret: subDays(new Date(), 5),
      totalHarga: 750000,
      status: "completed",
    }).onConflictDoNothing().returning()

    if (order1[0]) {
      await db.insert(reviews).values({
        orderId: order1[0].id,
        photographerId: pgId1,
        customerClerkId: "user_customer_1",
        rating: 5,
        komentar: "Sangat puas dengan hasilnya! Fotografer ramah dan on-time.",
      }).onConflictDoNothing()
    }

    // Block a future date via order
    await db.insert(orders).values({
      customerClerkId: "user_customer_1",
      photographerId: pgId1,
      orderType: "direct",
      lokasi: "Cafe Menteng",
      tanggalPotret: addDays(new Date(), 2),
      totalHarga: 500000,
      status: "confirmed",
    }).onConflictDoNothing()
  }

  console.log("✅ Seed completed!")
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
