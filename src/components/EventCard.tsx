import { Calendar, MapPin, Video, Globe, Clock, Users, Trash2, Edit } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { motion } from 'framer-motion'
import type { Event, Categoria, Local } from '@/app/page'
import { useAuth } from '@/context/AuthContext'

interface EventCardProps {
   event: Event
   categoria?: Categoria | null
   local?: Local | null
   onDelete: (id: string) => void
   onEdit: (event: Event) => void
   onClick: (event: Event) => void
   onPublicar?: (id: string) => void
   index: number
   isAdmin?: boolean
}

export function EventCard({
   event,
   categoria,
   local,
   onDelete,
   onEdit,
   onClick,
   onPublicar,
   index,
   isAdmin,
}: EventCardProps) {
   const { isAuthenticated, user, logout } = useAuth()
   const categoryStyle = event.categoria?.cor || 'bg-slate-600'

   const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
         day: 'numeric',
         month: 'short',
         year: 'numeric',
      })
   }

   const formatTime = (timeString: string) => {
      return timeString.substring(11, 16) // HH:MM
   }

   const getStatusBadge = (status: string) => {
      const styles = {
         publicado: 'bg-green-600',
         rascunho: 'bg-yellow-600',
         cancelado: 'bg-red-600',
      }
      return styles[status as keyof typeof styles] || 'bg-gray-600'
   }

   const getTipoEventoIcon = (tipo: string) => {
      switch (tipo) {
         case 'online':
            return <Video className="w-4 h-4" />
         case 'hibrido':
            return <Globe className="w-4 h-4" />
         default:
            return <MapPin className="w-4 h-4" />
      }
   }

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
               {event.imagemCapa ? (
                  <>
                     <motion.img
                        src={event.imagemCapa}
                        alt={event.titulo}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </>
               ) : (
                  <div className={`w-full h-full flex items-center justify-center ${categoryStyle}`}>
                     <Calendar className="w-16 h-16 text-white/40" />
                  </div>
               )}

               {/* Category and Status Badges */}
               <div className="absolute top-3 right-3 flex flex-col gap-2">
                  {event.categoria && (
                     <Badge className={`${categoryStyle} text-white border-0 shadow-md`}>{event.categoria.nome}</Badge>
                  )}
                  {user?.tipoUsuario === 'admin' && (
                     <Badge className={`${getStatusBadge(event.status)} text-white border-0 shadow-md`}>
                        {event.status}
                     </Badge>
                  )}
               </div>

               {/* Date Badge */}
               <div className="absolute top-3 left-3 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 shadow-md">
                  <div className="text-center">
                     <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        {new Date(event.dataInicio).toLocaleDateString('pt-BR', { month: 'short' })}
                     </div>
                     <div className="mt-0.5">
                        {new Date(event.dataInicio).toLocaleDateString('pt-BR', { day: 'numeric' })}
                     </div>
                  </div>
               </div>
            </div>

            <CardContent className="flex-1 flex flex-col">
               <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{event.titulo}</h3>
               <p className="text-muted-foreground mb-6 line-clamp-2 flex-1 text-sm">{event.descricao}</p>

               {/* Info Section */}
               <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                     <div className="p-2 rounded-md bg-muted">
                        <Clock className="w-4 h-4 text-foreground/70" />
                     </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Horário</p>
                        <p className="text-foreground">
                           {formatTime(event.horarioAbertura)} - {formatTime(event.horarioEncerramento)}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                     <div className="p-2 rounded-md bg-muted">
                        <Users className="w-4 h-4 text-foreground/70" />
                     </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Capacidade</p>
                        <p className="text-foreground">{event.capacidadeMaxima} pessoas</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                     <div className="p-2 rounded-md bg-muted">{getTipoEventoIcon(event.tipoEvento)}</div>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Local</p>
                        <p className="text-foreground truncate">
                           {event.local
                              ? `${event.local.nome} - ${event.local.cidade}, ${event.local.estado}`
                              : 'Local não especificado'}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onClick(event)}>
                     <Edit className="w-4 h-4 mr-2" />
                     Ver detalhes
                  </Button>
               </div>
               {isAdmin && (
                  <div className="flex gap-2 mt-3">
                     <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                           if (onPublicar) onPublicar(event.id)
                        }}
                     >
                        <Edit className="w-4 h-4 mr-2" />
                        Aprovar
                     </Button>
                     <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                           onEdit(event)
                        }}
                     >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                     </Button>
                     <Button
                        variant="destructive"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(event.id)}
                     >
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
               )}
            </CardContent>
         </Card>
      </motion.div>
   )
}
