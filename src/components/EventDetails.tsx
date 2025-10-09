import { X, Calendar, MapPin, Clock, Users, Edit, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

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

interface EventDetailsProps {
   event: Event
   onClose: () => void
   onEdit: (event: Event) => void
   onDelete: (id: string) => void
}

export function EventDetails({ event, onClose, onEdit, onDelete }: EventDetailsProps) {
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

   const handleDelete = () => {
      onDelete(event.id)
      onClose()
   }

   const handleEdit = () => {
      onEdit(event)
      onClose()
   }

   return (
      <AnimatePresence>
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               transition={{ duration: 0.2, ease: 'easeOut' }}
               className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border"
            >
               {/* Header with Image */}
               <div className="relative h-64 overflow-hidden bg-muted">
                  {event.image ? (
                     <>
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     </>
                  ) : (
                     <div className={`w-full h-full flex items-center justify-center ${style}`}>
                        <Calendar className="w-20 h-20 text-white/40" />
                     </div>
                  )}

                  {/* Close Button */}
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={onClose}
                     className="absolute top-4 right-4 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800"
                  >
                     <X className="w-5 h-5" />
                  </Button>

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                     <Badge className={`${style} text-white border-0 shadow-md`}>{event.category}</Badge>
                  </div>
               </div>

               {/* Content */}
               <div className="p-6 overflow-y-auto max-h-[calc(90vh-256px)]">
                  <h2 className="mb-4">{event.title}</h2>

                  <p className="text-muted-foreground mb-6">{event.description}</p>

                  {/* Event Details */}
                  <div className="space-y-4 mb-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">
                           <Calendar className="w-5 h-5 text-foreground/70" />
                        </div>
                        <div>
                           <p className="text-sm text-muted-foreground">Data</p>
                           <p className="text-foreground">
                              {new Date(event.date).toLocaleDateString('pt-BR', {
                                 day: 'numeric',
                                 month: 'long',
                                 year: 'numeric',
                              })}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">
                           <Clock className="w-5 h-5 text-foreground/70" />
                        </div>
                        <div>
                           <p className="text-sm text-muted-foreground">Horário</p>
                           <p className="text-foreground">{event.time}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">
                           <MapPin className="w-5 h-5 text-foreground/70" />
                        </div>
                        <div>
                           <p className="text-sm text-muted-foreground">Local</p>
                           <p className="text-foreground">{event.location}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">
                           <Users className="w-5 h-5 text-foreground/70" />
                        </div>
                        <div>
                           <p className="text-sm text-muted-foreground">Capacidade</p>
                           <p className="text-foreground">{event.capacity} pessoas</p>
                        </div>
                     </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                     <Button variant="outline" className="flex-1" onClick={handleEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Evento
                     </Button>
                     <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                     </Button>
                  </div>
               </div>
            </motion.div>
         </div>
      </AnimatePresence>
   )
}
