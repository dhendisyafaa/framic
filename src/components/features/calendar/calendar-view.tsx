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
    <div className="flex flex-col gap-4 p-3 sm:p-6 bg-card border border-border/50 rounded-2xl shadow-md text-foreground w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 justify-center sm:justify-start">
          <CalendarIcon className="w-4 h-4 text-accent" />
          Jadwal Ketersediaan
        </h3>
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} disabled={isLoading} className="h-8 w-8 cursor-pointer disabled:cursor-not-allowed text-foreground hover:bg-muted/50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs sm:text-sm font-bold min-w-[100px] sm:min-w-[120px] text-center capitalize text-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth} disabled={isLoading} className="h-8 w-8 cursor-pointer disabled:cursor-not-allowed text-foreground hover:bg-muted/50">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider pb-1">
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
                "aspect-square flex items-center justify-center rounded-lg text-xs sm:text-sm transition-all relative overflow-hidden",
                past ? "text-muted-foreground/30 cursor-not-allowed bg-muted/5" : 
                blocked ? "bg-red-500/10 text-red-500 font-bold border border-red-500/20" : 
                isSameDay(day, selectedDate || new Date(0)) ? "bg-accent text-white font-bold shadow-lg" :
                "bg-accent/10 text-accent font-semibold hover:bg-accent/20 cursor-pointer border border-accent/20"
              )}
            >
              {format(day, "d")}
              {blocked && !past && (
                <div className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-1 pt-3 border-t border-muted/50 justify-center sm:justify-start">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent/20 border border-accent/40" />
          <span className="text-[10px] sm:text-xs text-muted-foreground">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
          <span className="text-[10px] sm:text-xs text-muted-foreground">Penuh / Blokir</span>
        </div>
      </div>
    </div>
  )
}
