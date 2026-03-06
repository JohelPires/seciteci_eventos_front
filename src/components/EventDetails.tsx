import {
   X,
   Calendar,
   MapPin,
   FileText,
   Target,
   Video,
   Globe,
   Clock,
   Users,
   Edit,
   Trash2,
   Link,
   ExternalLink,
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import type { Event, Categoria } from '@/app/page'
import { useAuth } from '@/context/AuthContext'

interface EventDetailsProps {
   event: Event
   categoria?: Categoria | null
   // local?: Local | null
   onClose: () => void
   onEdit: (event: Event) => void
   onDelete: (id: string) => void
}

export function EventDetails({ event, categoria, onClose, onEdit, onDelete }: EventDetailsProps) {
   const { isAuthenticated, user, logout } = useAuth()
   const categoryStyle = categoria?.cor || 'bg-slate-600'

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
            return <Video className="w-5 h-5" />
         case 'hibrido':
            return <Globe className="w-5 h-5" />
         default:
            return <MapPin className="w-5 h-5" />
      }
   }

   const formatTime = (timeString: string | undefined) => {
      if (!timeString) {
         return ''
      }
      return timeString.substring(11, 16) // HH:MM
   }

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
         <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
         >
            <motion.div
               onClick={(e) => e.stopPropagation()}
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               transition={{ duration: 0.2, ease: 'easeOut' }}
               className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-border"
            >
               {/* Header with Image */}
               <div className="relative h-64 overflow-hidden bg-muted">
                  {event.imagemCapa ? (
                     <>
                        <img src={event.imagemCapa} alt={event.titulo} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     </>
                  ) : (
                     <div className={`w-full h-full flex items-center justify-center ${categoryStyle}`}>
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

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                     {categoria && (
                        <Badge className={`${categoryStyle} text-white border-0 shadow-md`}>{categoria.nome}</Badge>
                     )}
                     {user?.tipoUsuario === 'admin' && (
                        <Badge className={`${getStatusBadge(event.status)} text-white border-0 shadow-md`}>
                           {event.status}
                        </Badge>
                     )}
                  </div>
               </div>

               {/* Content */}
               <div className="p-6 overflow-y-auto max-h-[calc(90vh-256px)]">
                  <h2 className="mb-4">{event.titulo}</h2>

                  <p className="text-muted-foreground mb-6">{event.descricao}</p>

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">
                           <Calendar className="w-5 h-5 text-foreground/70" />
                        </div>
                        <div>
                           <p className="text-sm text-muted-foreground">Data do Evento</p>
                           <p className="text-foreground">
                              {new Date(event.dataInicio).toLocaleDateString('pt-BR', {
                                 day: 'numeric',
                                 month: 'long',
                                 year: 'numeric',
                              })}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">
                           <Clock className="w-5 h-5 text-foreground/70" />
                        </div>
                        <div>
                           <p className="text-sm text-muted-foreground">Horário do Evento</p>
                           <p className="text-foreground">
                              {formatTime(event.horarioAbertura)} - {formatTime(event.horarioEncerramento)}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">{getTipoEventoIcon(event.tipoEvento)}</div>
                        <div>
                           <p className="text-sm text-muted-foreground">Tipo de Evento</p>
                           <p className="text-foreground capitalize">{event.tipoEvento}</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-muted">
                           <Users className="w-5 h-5 text-foreground/70" />
                        </div>
                        <div>
                           <p className="text-sm text-muted-foreground">Vagas</p>
                           <p className="text-foreground">{event.capacidadeMaxima} pessoas</p>
                        </div>
                     </div>

                     {event && (
                        <div className="flex items-start gap-3 md:col-span-2">
                           <div className="p-2.5 rounded-lg bg-muted">
                              <MapPin className="w-5 h-5 text-foreground/70" />
                           </div>
                           <div>
                              <p className="text-sm text-muted-foreground">Local</p>
                              <p className="text-foreground">{event.LocalNome}</p>
                              <p className="text-sm text-muted-foreground">
                                 {event.LocalEndereco}, {event.LocalNumero} - {event.LocalBairro}, {event.LocalCidade}/
                                 {event.LocalEstado}
                              </p>
                              {event.LocalLinkGoogleMaps && (
                                 <a
                                    href={event.LocalLinkGoogleMaps}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-1.5 text-sm text-primary hover:underline"
                                 >
                                    <MapPin className="w-3.5 h-3.5" />
                                    Ver no Google Maps
                                    <ExternalLink className="w-3 h-3" />
                                 </a>
                              )}
                           </div>
                        </div>
                     )}

                     {event.linkPaginaEvento && (
                        <div className="flex items-start gap-3">
                           <div className="p-2.5 rounded-lg bg-muted">
                              <Link className="w-5 h-5 text-foreground/70" />
                           </div>
                           <div>
                              <p className="text-sm text-muted-foreground">Link da página</p>
                              <a
                                 href={event.linkPaginaEvento}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-1.5 text-primary hover:underline truncate"
                              >
                                 {event.linkPaginaEvento}
                                 <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </a>
                           </div>
                        </div>
                     )}

                     {event.linkOnline && (
                        <div className="flex items-start gap-3 md:col-span-2">
                           <div className="p-2.5 rounded-lg bg-muted">
                              <Video className="w-5 h-5 text-foreground/70" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm text-muted-foreground">Link Online</p>
                              <a
                                 href={event.linkOnline}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-1.5 text-primary hover:underline truncate"
                              >
                                 {event.linkOnline}
                                 <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </a>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Additional Information */}
                  {(event.publicoAlvo || event.requisitos) && (
                     <div className="space-y-4 mb-6 pt-4 border-t border-border">
                        {event.publicoAlvo && (
                           <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-lg bg-muted">
                                 <Target className="w-5 h-5 text-foreground/70" />
                              </div>
                              <div>
                                 <p className="text-sm text-muted-foreground">Público Alvo</p>
                                 <p className="text-foreground">{event.publicoAlvo}</p>
                              </div>
                           </div>
                        )}

                        {event.requisitos && (
                           <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-lg bg-muted">
                                 <FileText className="w-5 h-5 text-foreground/70" />
                              </div>
                              <div>
                                 <p className="text-sm text-muted-foreground">Requisitos</p>
                                 <p className="text-foreground">{event.requisitos}</p>
                              </div>
                           </div>
                        )}
                     </div>
                  )}

                  {/* Action Buttons */}
                  {user?.tipoUsuario === 'admin' && (
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
                  )}
               </div>
            </motion.div>
         </div>
      </AnimatePresence>
   )
}
