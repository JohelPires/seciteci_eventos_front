import { useState } from 'react'
import { Edit, Trash2, Eye, Search, Check, Globe, CircleX } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import type { Event, Categoria, Local } from '@/app/page'
import { useAuth } from '@/context/AuthContext'
import { cancelarEvento } from '@/data/data'

interface AdminEventosProps {
   events: Event[]
   categorias: Categoria[]
   // locais: Local[]
   onEditEvent: (event: Event) => void
   onDeleteEvent: (id: string) => void
   onPublicarEvent: (id: string) => void
   onCancelarEvent: (id: string) => void
}

export function AdminEventos({
   events,
   categorias,
   // locais,
   onEditEvent,
   onDeleteEvent,
   onPublicarEvent,
   onCancelarEvent,
}: AdminEventosProps) {
   const [searchTerm, setSearchTerm] = useState('')
   const [statusFilter, setStatusFilter] = useState('all')

   const { user, token } = useAuth()

   const getCategoria = (id: number) => categorias.find((c) => c.id === id)
   // const getLocal = (id: number) => locais.find((l) => l.id === id)

   const filteredEvents = events.filter((event) => {
      const matchesSearch =
         event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
         event.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      return matchesSearch && matchesStatus
   })

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

   return (
      <Card>
         <CardHeader>
            <CardTitle>Gerenciar Eventos</CardTitle>
            <CardDescription>Visualize e gerencie todos os eventos da plataforma</CardDescription>
         </CardHeader>
         <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                     placeholder="Buscar eventos..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10"
                  />
               </div>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
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
            <div className="border rounded-lg">
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
                  <TableBody>
                     {filteredEvents.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhum evento encontrado
                           </TableCell>
                        </TableRow>
                     ) : (
                        filteredEvents.map((event) => {
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
                                       {event.status === 'rascunho' ? (
                                          <Button variant="outline" size="sm" onClick={() => onPublicarEvent(event.id)}>
                                             <Globe className="w-4 h-4" /> Publicar
                                          </Button>
                                       ) : (
                                          <Button variant="outline" size="sm" onClick={() => onCancelarEvent(event.id)}>
                                             <CircleX className="w-4 h-4" /> Cancelar
                                          </Button>
                                       )}
                                       <Button variant="ghost" size="sm" onClick={() => onEditEvent(event)}>
                                          <Edit className="w-4 h-4" />
                                       </Button>
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                             if (confirm('Tem certeza que deseja excluir este evento?')) {
                                                onDeleteEvent(event.id)
                                             }
                                          }}
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
               </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
               Mostrando {filteredEvents.length} de {events.length} eventos
            </div>
         </CardContent>
      </Card>
   )
}
