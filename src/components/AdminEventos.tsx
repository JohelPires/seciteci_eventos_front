import { useState } from 'react'
import { Edit, Trash2, Eye, Search, Globe, CircleX, Plus, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { TableSkeleton } from './TableSkeleton'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import {
   Pagination,
   PaginationContent,
   PaginationEllipsis,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from './ui/pagination'
import { EventDetails } from './EventDetails'
import type { Event, Categoria } from '@/app/page'
import { useAuth } from '@/context/AuthContext'

interface AdminEventosProps {
   /** Página já fatiada pelo servidor. */
   events: Event[]
   totalPages: number
   total: number
   /** 1º load: exibe skeleton de tabela. */
   carregando: boolean
   /** Refetch em curso: mantém a página anterior com escurecimento. */
   atualizando: boolean
   busca: string
   onBuscaChange: (v: string) => void
   filtroStatus: 'all' | 'rascunho' | 'publicado' | 'cancelado'
   onFiltroStatusChange: (v: 'all' | 'rascunho' | 'publicado' | 'cancelado') => void
   pagina: number
   onPaginaChange: (p: number) => void
   categorias: Categoria[]
   // locais: Local[]
   onNewEvent: () => void
   onEditEvent: (event: Event) => void
   onDeleteEvent: (id: string) => void
   onPublicarEvent: (id: string) => void
   onCancelarEvent: (id: string) => void
   onReativarEvent: (id: string) => void
}

export function AdminEventos({
   events,
   totalPages,
   total,
   carregando,
   atualizando,
   busca,
   onBuscaChange,
   filtroStatus,
   onFiltroStatusChange,
   pagina,
   onPaginaChange,
   categorias,
   // locais,
   onNewEvent,
   onEditEvent,
   onDeleteEvent,
   onPublicarEvent,
   onCancelarEvent,
   onReativarEvent,
}: AdminEventosProps) {
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

   const getCategoria = (id: number) => categorias.find((c) => c.id === id)

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'publicado':
            return 'bg-green-600'
         case 'rascunho':
            return 'bg-yellow-600'
         case 'cancelado':
            return 'bg-red-600'
         default:
            return 'bg-gray-600'
      }
   }

   const handleViewEvent = (event: Event) => {
      setSelectedEvent(event)
   }

   const handleCloseEventDetails = () => {
      setSelectedEvent(null)
   }

   return (
      <>
         <Card>
            <CardHeader>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                     <CardTitle>Gerenciar Eventos</CardTitle>
                     <CardDescription>Visualize e gerencie todos os eventos da plataforma</CardDescription>
                  </div>
                  <Button onClick={onNewEvent} className="gap-2 shrink-0">
                     <Plus className="w-4 h-4" />
                     Novo Evento
                  </Button>
               </div>
            </CardHeader>
            <CardContent>
               {/* Filters */}
               <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                        placeholder="Buscar eventos..."
                        value={busca}
                        onChange={(e) => onBuscaChange(e.target.value)}
                        className="pl-10"
                        aria-label="Buscar eventos por título ou descrição"
                     />
                  </div>
                  <Select value={filtroStatus} onValueChange={(v) => onFiltroStatusChange(v as AdminEventosProps['filtroStatus'])}>
                     <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por status">
                        <SelectValue placeholder="Filtrar por status" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="publicado">Publicado</SelectItem>
                        <SelectItem value="rascunho">Pendente</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               {/* Table */}
               <div
                  className={`border rounded-lg transition-opacity ${atualizando && !carregando ? 'opacity-60' : ''}`}
                  aria-busy={atualizando}
               >
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Título</TableHead>
                           <TableHead>Data</TableHead>
                           <TableHead>Local</TableHead>
                           <TableHead>Categoria</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead>Tipo</TableHead>
                           <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                     </TableHeader>
                     {carregando ? (
                        <TableSkeleton linhas={5} colunas={7} />
                     ) : (
                        <TableBody>
                           {events.length === 0 ? (
                              <TableRow>
                                 <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Nenhum evento encontrado
                                 </TableCell>
                              </TableRow>
                           ) : (
                              events.map((event) => {
                              const categoria = getCategoria(event.categoriaId)
                              // const local = getLocal(event.localId)

                              return (
                                 <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.titulo}</TableCell>
                                    <TableCell>
                                       {new Date(event.dataInicio).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                       })}
                                    </TableCell>
                                    <TableCell>local</TableCell>
                                    <TableCell>
                                       {categoria && (
                                          <div className="flex items-center gap-2">
                                             <div className={`w-2 h-2 rounded-full ${categoria.cor}`} />
                                             <span className="text-sm">{categoria.nome}</span>
                                          </div>
                                       )}
                                    </TableCell>
                                    <TableCell>
                                       <Badge className={`${getStatusColor(event.status)} text-white border-0`}>
                                          {event.status === 'rascunho' ? 'pendente' : event.status}
                                       </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{event.tipoEvento}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                           {event.status === 'rascunho' && (
                                              <Button
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => onPublicarEvent(event.id)}
                                              >
                                                 <Globe className="w-4 h-4" /> Publicar
                                              </Button>
                                           )}
                                           {event.status === 'publicado' && (
                                              <Button
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => onCancelarEvent(event.id)}
                                              >
                                                 <CircleX className="w-4 h-4" /> Cancelar
                                              </Button>
                                           )}
                                           {event.status === 'cancelado' && (
                                              <Button
                                                 variant="outline"
                                                 size="sm"
                                                 onClick={() => onReativarEvent(event.id)}
                                              >
                                                 <RotateCcw className="w-4 h-4" /> Reativar
                                              </Button>
                                           )}
                                           <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleViewEvent(event)}
                                              title="Visualizar detalhes do evento"
                                           >
                                              <Eye className="w-4 h-4" />
                                           </Button>
                                           <Button variant="ghost" size="sm" onClick={() => onEditEvent(event)}>
                                              <Edit className="w-4 h-4" />
                                           </Button>
                                           <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onDeleteEvent(event.id)}
                                              className="text-destructive hover:text-destructive"
                                           >
                                              <Trash2 className="w-4 h-4" />
                                           </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                               )
                            })
                         )}
                        </TableBody>
                     )}
                  </Table>
               </div>

               <div className="mt-4 text-sm text-muted-foreground">
                  Mostrando {events.length} de {total} eventos
               </div>

                {/* Pagination */}
                {totalPages > 1 && (
                   <div className="flex justify-center mt-6">
                      <Pagination>
                         <PaginationContent>
                            <PaginationItem>
                               <PaginationPrevious
                                  onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
                                  className={pagina === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                               />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                               const showPage =
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= pagina - 1 && page <= pagina + 1)

                               const showEllipsisBefore = page === pagina - 2 && pagina > 3
                               const showEllipsisAfter = page === pagina + 2 && pagina < totalPages - 2

                              if (showEllipsisBefore || showEllipsisAfter) {
                                 return (
                                    <PaginationItem key={page}>
                                       <PaginationEllipsis />
                                    </PaginationItem>
                                 )
                              }

                              if (!showPage) return null

                              return (
                                 <PaginationItem key={page}>
                                    <PaginationLink
                                       onClick={() => onPaginaChange(page)}
                                       isActive={pagina === page}
                                       className="cursor-pointer"
                                    >
                                       {page}
                                    </PaginationLink>
                                 </PaginationItem>
                              )
                           })}

                           <PaginationItem>
                              <PaginationNext
                                 onClick={() => onPaginaChange(Math.min(totalPages, pagina + 1))}
                                 className={
                                    pagina === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                 }
                              />
                           </PaginationItem>
                        </PaginationContent>
                     </Pagination>
                  </div>
               )}
            </CardContent>
         </Card>

         {/* Modal de detalhes do evento */}
         {selectedEvent && (
            <EventDetails
               event={selectedEvent}
               categoria={getCategoria(selectedEvent.categoriaId)}
               onClose={handleCloseEventDetails}
               onEdit={onEditEvent}
               onDelete={onDeleteEvent}
            />
         )}
      </>
   )
}
