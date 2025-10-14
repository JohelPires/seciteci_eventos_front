import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { motion } from 'framer-motion'
import type { Event, Categoria, Local } from '@/app/page'

interface CalendarViewProps {
   events: Event[]
   categorias: Categoria[]
   locais: Local[]
   onEventClick: (event: Event) => void
}

export function CalendarView({ events, categorias, locais, onEventClick }: CalendarViewProps) {
   const [currentDate, setCurrentDate] = useState(new Date())

   // const getCategoria = (id: number) => categorias.find((c) => c.id === id)

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
      const targetDate = new Date(year, month, day)
      const dateString = targetDate.toISOString().split('T')[0]

      return events.filter((event) => {
         const eventDate = new Date(event.dataInicio).toISOString().split('T')[0]
         return eventDate === dateString
      })
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
         <Card className="p-6">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
               {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm text-muted-foreground p-2">
                     {day}
                  </div>
               ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
               {/* Empty cells before first day of month */}
               {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="" />
               ))}

               {/* Days of the month */}
               {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1
                  const dayEvents = getEventsForDay(day)
                  const isToday = isCurrentMonth && day === today.getDate()

                  return (
                     <motion.div
                        key={day}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`
                  h-26 p-2 border border-border
                  ${isToday ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}
                  transition-colors cursor-pointer
                `}
                     >
                        <div className="h-full flex flex-col">
                           <span className={`text-sm mb-2 ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</span>
                           <div className="flex-1 space-y-1 overflow-hidden">
                              {dayEvents.slice(0, 3).map((event) => {
                                 const categoria = event.categoria
                                 const categoryStyle = categoria?.cor || 'bg-slate-600'

                                 return (
                                    <motion.div
                                       key={event.id}
                                       whileHover={{ scale: 1.05 }}
                                       onClick={() => onEventClick(event)}
                                    >
                                       <Badge
                                          className={`${categoryStyle} text-white border-0 text-xs w-full justify-start truncate cursor-pointer`}
                                       >
                                          {event.titulo}
                                       </Badge>
                                    </motion.div>
                                 )
                              })}
                              {dayEvents.length > 3 && (
                                 <p className="text-xs text-muted-foreground">+{dayEvents.length - 3} mais</p>
                              )}
                           </div>
                        </div>
                     </motion.div>
                  )
               })}
            </div>
         </Card>

         {/* Event Count Summary */}
         <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>
               {
                  events.filter((e) => {
                     const eventDate = new Date(e.dataInicio)
                     return eventDate.getMonth() === month && eventDate.getFullYear() === year
                  }).length
               }{' '}
               eventos em {monthName}
            </span>
         </div>
      </div>
   )
}
