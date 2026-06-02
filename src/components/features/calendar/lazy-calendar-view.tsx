"use client"

import nextDynamic from "next/dynamic"

export const LazyCalendarView = nextDynamic(
  () => import("./calendar-view").then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    ),
  }
)
