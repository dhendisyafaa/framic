import { QueryClient } from "@tanstack/react-query"

/**
 * Konfigurasi default QueryClient untuk Framic.
 * - staleTime: 1 menit (data jarang berubah seperti profile, package)
 * - gcTime: 5 menit (memori dibersihkan setelah 5 menit tidak digunakan)
 * - retry: 1 (limit retry agar tidak membebani server/payment gateway)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false, // Menghindari refetch berlebih saat pindah tab
    },
    mutations: {
      retry: 1,
    },
  },
})
