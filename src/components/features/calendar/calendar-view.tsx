"use client"

import { useCalendar } from "@/hooks/use-calendar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfToday } from "date-fns"
import { id } from "date-fns/locale"

interface CalendarViewProps {
  photographerId: string
  selectedDate?: Date
  onSelect?: (date: Date) => void
}

export function CalendarView({ photographerId, selectedDate, onSelect }: CalendarViewProps) {
  const { 
    currentMonth, 
    isDateBlocked, 
    nextMonth, 
    prevMonth, 
    isLoading 
  } = useCalendar(photographerId)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const today = startOfToday()

  // Padding days for grid
  const firstDayOfMonth = monthStart.getDay() // 0 (Sun) to 6 (Sat)
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div className="flex flex-col gap-4 p-6 bg-white border border-border/50 rounded-2xl shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          Jadwal Ketersediaan
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} disabled={isLoading}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold min-w-[120px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth} disabled={isLoading}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-2">
        <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map(i => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const blocked = isDateBlocked(day)
          const past = isBefore(day, today)
          
          return (
            <div 
              key={day.toString()}
              onClick={() => {
                if (!past && !blocked && onSelect) {
                  onSelect(day)
                }
              }}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg text-sm transition-all relative overflow-hidden",
                past ? "text-slate-300 cursor-not-allowed bg-slate-50/50" : 
                blocked ? "bg-red-50 text-red-600 font-bold border border-red-100" : 
                isSameDay(day, selectedDate || new Date(0)) ? "bg-primary text-white font-bold shadow-lg" :
                "bg-emerald-50/30 text-emerald-700 font-medium hover:bg-emerald-100/50 cursor-pointer border border-emerald-100/20"
              )}
            >
              {format(day, "d")}
              {blocked && !past && (
                <div className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full" />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-2 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200" />
          <span className="text-xs text-muted-foreground">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-50 border border-red-200" />
          <span className="text-xs text-muted-foreground">Penuh / Blokir</span>
        </div>
      </div>
    </div>
  )
}
