"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"

export function useCalendar(photographerId: string) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBlockedDates = useCallback(async (date: Date) => {
    setIsLoading(true)
    setError(null)
    
    // Format YYYY-MM LOCAL
    const monthStr = format(date, "yyyy-MM")
    
    try {
      const res = await fetch(`/api/photographers/${photographerId}/calendar?month=${monthStr}`)
      const json = await res.json()
      
      if (json.success) {
        setBlockedDates(json.data.blockedDates || [])
      } else {
        setError(json.error || "Gagal mengambil data kalender")
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi")
    } finally {
      setIsLoading(false)
    }
  }, [photographerId])

  useEffect(() => {
    fetchBlockedDates(currentMonth)
  }, [currentMonth, fetchBlockedDates])

  const nextMonth = () => {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + 1)
    setCurrentMonth(next)
  }

  const prevMonth = () => {
    const prev = new Date(currentMonth)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentMonth(prev)
  }

  const isDateBlocked = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10)
    return blockedDates.includes(dateStr)
  }

  return {
    currentMonth,
    blockedDates,
    isLoading,
    error,
    isDateBlocked,
    nextMonth,
    prevMonth,
    setCurrentMonth,
    refresh: () => fetchBlockedDates(currentMonth)
  }
}
