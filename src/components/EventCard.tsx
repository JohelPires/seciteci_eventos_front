import { Calendar, MapPin, Clock, Users, Trash2, Edit } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
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

interface EventCardProps {
   event: Event
   onDelete: (id: string) => void
   onEdit: (event: Event) => void
   index: number
}

export function EventCard({ event, onDelete, onEdit, index }: EventCardProps) {
   const categoryStyles: Record<string, string> = {
      Tecnologia: 'bg-blue-600',
      Negócios: 'bg-slate-700',
      Educação: 'bg-indigo-600',
      Entretenimento: 'bg-purple-600',
      Esportes: 'bg-orange-600',
      Cultura: 'bg-teal-600',
      Saúde: 'bg-green-600',
   }

   const style = categoryStyles[event.category] || 'bg-slate-600'

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: index * 0.1 }}
         whileHover={{ y: -4 }}
         className="h-full"
      >
         <Card className="group overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl border border-border bg-card">
            {/* Image Section */}
            <div className="relative h-52 overflow-hidden bg-muted">
               {event.image ? (
                  <>
                     <motion.img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </>
               ) : (
                  <div className={`w-full h-full flex items-center justify-center ${style}`}>
                     <Calendar className="w-16 h-16 text-white/40" />
                  </div>
               )}

               {/* Category Badge */}
               <div className="absolute top-3 right-3">
                  <Badge className={`${style} text-white border-0 shadow-md`}>{event.category}</Badge>
               </div>

               {/* Date Badge */}
               <div className="absolute top-3 left-3 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 shadow-md">
                  <div className="text-center">
                     <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}
                     </div>
                     <div className="mt-0.5">
                        {new Date(event.date).toLocaleDateString('pt-BR', { day: 'numeric' })}
                     </div>
                  </div>
               </div>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col">
               <h3 className="mb-2 line-clamp-2">{event.title}</h3>
               <p className="text-muted-foreground mb-6 line-clamp-2 flex-1">{event.description}</p>

               {/* Info Section */}
               <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                     <div className="p-2 rounded-md bg-muted">
                        <Clock className="w-4 h-4 text-foreground/70" />
                     </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Horário</p>
                        <p className="text-foreground">{event.time}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                     <div className="p-2 rounded-md bg-muted">
                        <Users className="w-4 h-4 text-foreground/70" />
                     </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Capacidade</p>
                        <p className="text-foreground">{event.capacity} pessoas</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                     <div className="p-2 rounded-md bg-muted">
                        <MapPin className="w-4 h-4 text-foreground/70" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Local</p>
                        <p className="text-foreground truncate">{event.location}</p>
                     </div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(event)}>
                     <Edit className="w-4 h-4 mr-2" />
                     Editar
                  </Button>
                  <Button
                     variant="ghost"
                     size="sm"
                     className="hover:bg-destructive/10 hover:text-destructive"
                     onClick={() => onDelete(event.id)}
                  >
                     <Trash2 className="w-4 h-4" />
                  </Button>
               </div>
            </CardContent>
         </Card>
      </motion.div>
   )
}
