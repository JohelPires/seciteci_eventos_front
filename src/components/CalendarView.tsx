import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { motion } from 'framer-motion'

interface Event {
   id: string
   title: string
   description: string
   date: string
   time: string
   location: string
   category: string
   capacity: number
   image?: string
}

interface CalendarViewProps {
   events: Event[]
   onEventClick: (event: Event) => void
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
   const [currentDate, setCurrentDate] = useState(new Date())

   const categoryStyles: Record<string, string> = {
      Tecnologia: 'bg-blue-600',
      Negócios: 'bg-slate-700',
      Educação: 'bg-indigo-600',
      Entretenimento: 'bg-purple-600',
      Esportes: 'bg-orange-600',
      Cultura: 'bg-teal-600',
      Saúde: 'bg-green-600',
   }

   const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startingDayOfWeek = firstDay.getDay()

      return { daysInMonth, startingDayOfWeek, year, month }
   }

   const getEventsForDay = (day: number) => {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const dateString = new Date(year, month, day).toISOString().split('T')[0]

      return events.filter((event) => event.date === dateString)
   }

   const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentDate((prevDate) => {
         const newDate = new Date(prevDate)
         if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1)
         } else {
            newDate.setMonth(newDate.getMonth() + 1)
         }
         return newDate
      })
   }

   const goToToday = () => {
      setCurrentDate(new Date())
   }

   const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
   const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
   const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

   const today = new Date()
   const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

   return (
      <div className="space-y-6">
         {/* Calendar Header */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <h2 className="capitalize">{monthName}</h2>
               {!isCurrentMonth && (
                  <Button variant="outline" size="sm" onClick={goToToday}>
                     Hoje
                  </Button>
               )}
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>

         {/* Calendar Grid */}
         <Card className="p-4 bg-card border border-border">
            <div className="grid grid-cols-7 gap-2">
               {/* Week Day Headers */}
               {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm text-muted-foreground py-2">
                     {day}
                  </div>
               ))}

               {/* Empty cells for days before month starts */}
               {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[100px] bg-muted/30 rounded-lg" />
               ))}

               {/* Calendar Days */}
               {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1
                  const dayEvents = getEventsForDay(day)
                  const isToday = isCurrentMonth && day === today.getDate()

                  return (
                     <motion.div
                        key={day}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`min-h-[100px] p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors ${
                           isToday ? 'ring-2 ring-primary' : ''
                        }`}
                     >
                        <div className="flex items-start justify-between mb-2">
                           <span
                              className={`text-sm ${
                                 isToday
                                    ? 'w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center'
                                    : 'text-foreground'
                              }`}
                           >
                              {day}
                           </span>
                           {dayEvents.length > 0 && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                 {dayEvents.length}
                              </Badge>
                           )}
                        </div>

                        <div className="space-y-1">
                           {dayEvents.slice(0, 3).map((event) => {
                              const style = categoryStyles[event.category] || 'bg-slate-600'
                              return (
                                 <button
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className={`w-full text-left px-2 py-1 rounded text-xs text-white truncate ${style} hover:opacity-80 transition-opacity`}
                                 >
                                    {event.time} - {event.title}
                                 </button>
                              )
                           })}
                           {dayEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center pt-1">
                                 +{dayEvents.length - 3} mais
                              </div>
                           )}
                        </div>
                     </motion.div>
                  )
               })}
            </div>
         </Card>

         {/* Legend */}
         <div className="flex flex-wrap gap-3 items-center justify-center">
            {Object.entries(categoryStyles).map(([category, style]) => {
               const hasEvents = events.some((e) => e.category === category)
               if (!hasEvents) return null

               return (
                  <div key={category} className="flex items-center gap-2">
                     <div className={`w-3 h-3 rounded-full ${style}`} />
                     <span className="text-sm text-muted-foreground">{category}</span>
                  </div>
               )
            })}
         </div>
      </div>
   )
}
