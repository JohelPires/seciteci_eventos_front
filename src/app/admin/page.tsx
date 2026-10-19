'use client'
import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventForm } from '@/components/EventForm'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { motion } from 'framer-motion'
import { ApiError, cancelarEvento, createEvento, deleteEvento, editEvento, getCategorias, getEventosAdmin } from '@/data/data'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import { useAuth } from '@/context/AuthContext'

import { AdminDashboard } from '@/components/AdminDashboard'

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useDebouncedValue } from '@/hooks/debounce'

import { Event } from '@/app/page'
import { useRouter } from 'next/navigation'

// import { Local } from '@/app/page'

// const categorias: Categoria[] = await getCategorias()
// console.log(categorias)

// const locais: Local[] = await getLocais()
// console.log(locais)

const ITEMS_PER_PAGE = 20

function useAdminGuard() {
   const { isAuthenticated, isAdmin, loading } = useAuth()
   const router = useRouter()

   useEffect(() => {
      if (loading) return // espera resolver o token do localStorage
      if (!isAuthenticated || !isAdmin) {
         router.replace('/')
      }
   }, [isAuthenticated, isAdmin, loading, router])

   return { isAllowed: isAuthenticated && isAdmin, loading }
}

export default function App() {
   const [showForm, setShowForm] = useState(false)
   const [editingEvent, setEditingEvent] = useState<Event | null>(null)
   const [searchTerm, setSearchTerm] = useState('')
   const [statusFilter, setStatusFilter] = useState<'all' | 'rascunho' | 'publicado' | 'cancelado'>('all')
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
   const [currentPage, setCurrentPage] = useState(1)
   const [authDialogOpen, setAuthDialogOpen] = useState(false)

   const [alertMessage, setAlertMessage] = useState('')
   const [alertDialogOpen, setAlertDialogOpen] = useState(false)

   // Confirmações centralizadas (status e exclusão) — abertas a partir de qualquer ação do painel
   const [statusTarget, setStatusTarget] = useState<{ id: string; titulo: string; next: 'publicado' | 'cancelado' } | null>(null)
   const [motivoCancelamento, setMotivoCancelamento] = useState('')
   const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
   const [isSubmitting, setIsSubmitting] = useState(false)

   const { token } = useAuth()
   const { isAllowed, loading } = useAdminGuard()

   const queryClient = useQueryClient()

   const { data: categoriasData } = useQuery({
      queryKey: ['categorias'],
      queryFn: getCategorias,
      enabled: isAllowed,
   })
   const categorias = categoriasData ?? []

   const buscaAdmin = useDebouncedValue(searchTerm)

   // Tabela server-paginada: busca e status no servidor
   const {
      data,
      isError,
      isLoading,
      isFetching,
      refetch: refetchAdminEventos,
   } = useQuery({
      queryKey: ['admin-eventos', { page: currentPage, status: statusFilter, busca: buscaAdmin }],
      queryFn: () =>
         getEventosAdmin(token, {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            status: statusFilter === 'all' ? '' : statusFilter,
            busca: buscaAdmin,
         }),
      enabled: isAllowed && !!token,
      placeholderData: keepPreviousData,
   })

   // Conjunto bounded: alimenta a visão geral (cards/mapa) do AdminDashboard
   const { data: overviewData } = useQuery({
      queryKey: ['admin-eventos-overview'],
      queryFn: () => getEventosAdmin(token, { page: 1, limit: 100, status: '' }),
      enabled: isAllowed && !!token,
      staleTime: 60_000,
      placeholderData: keepPreviousData,
   })

   const eventos = data?.eventos ?? []
   const eventosOverview = overviewData?.eventos ?? []
   const totalPages = data?.pagination?.totalPages ?? 0
   const totalEventos = data?.pagination?.total ?? 0

   // useEffect(() => {
   //    async function fetchData() {
   //       try {
   //          const response = await getLocais()

   //          setLocais(response)
   //       } catch (error) {
   //          console.log(error)
   //       }
   //    }

   //    fetchData()
   // }, [reload])

   const handleCreateEvent = async (eventData: Omit<Event, 'id'>) => {
      if (editingEvent) {
         try {
            await editEvento(editingEvent.id, eventData, token)
            toast.success('Evento atualizado com sucesso!')
            setEditingEvent(null)
            setShowForm(false)
         } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Erro de conexão. Tente novamente.')
         }
      } else {
         const horarioAbertura = eventData.horarioAbertura ?? ''
         const horarioEncerramento = eventData.horarioEncerramento ?? ''
         const newEvent: Event = {
            ...eventData,
            status: 'publicado',
            horarioAbertura,
            horarioEncerramento,
            id: Date.now().toString(),
         }
         try {
            await createEvento(newEvent, token)
            toast.success('Evento cadastrado e publicado com sucesso!')
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['admin-eventos'] })
   queryClient.invalidateQueries({ queryKey: ['admin-eventos-overview'] })
         } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Erro de conexão. Tente novamente.')
         }
      }
   }

   const handleRequestDelete = (id: string) => {
      const alvo = encontrarEvento(id)
      if (alvo) setDeleteTarget(alvo)
   }

   const confirmDelete = async () => {
      if (!deleteTarget) return
      if (!token) {
         toast.error('Você não está autenticado!')
         return
      }
      setIsSubmitting(true)
      try {
         await deleteEvento(deleteTarget.id, token)
         toast.success('Evento excluído com sucesso!')
         setDeleteTarget(null)
         queryClient.invalidateQueries({ queryKey: ['admin-eventos'] })
   queryClient.invalidateQueries({ queryKey: ['admin-eventos-overview'] })
      } catch (error) {
         toast.error(error instanceof Error ? error.message : 'Erro ao excluir evento!')
      } finally {
         setIsSubmitting(false)
      }
   }

   // Toda mudança de estado passa por um modal de confirmação
   const handleRequestStatusChange = (id: string, next: 'publicado' | 'cancelado') => {
      const alvo = encontrarEvento(id)
      if (!alvo) return
      setMotivoCancelamento('')
      setStatusTarget({ id: alvo.id, titulo: alvo.titulo || 'Evento sem título', next })
   }

   const confirmStatusChange = async () => {
      if (!statusTarget) return
      if (!token) {
         toast.error('Você não está autenticado!')
         return
      }
      setIsSubmitting(true)
      try {
         if (statusTarget.next === 'cancelado') {
            await cancelarEvento(statusTarget.id, token, motivoCancelamento)
            toast.success('Evento cancelado com sucesso!')
         } else {
            await editEvento(statusTarget.id, { status: 'publicado' }, token)
            toast.success('Evento publicado com sucesso!')
         }
         setStatusTarget(null)
         setMotivoCancelamento('')
         queryClient.invalidateQueries({ queryKey: ['admin-eventos'] })
   queryClient.invalidateQueries({ queryKey: ['admin-eventos-overview'] })
      } catch (error) {
         toast.error(error instanceof ApiError ? error.message : 'Erro ao atualizar o status do evento!')
      } finally {
         setIsSubmitting(false)
      }
   }

   const handlePublicarEvent = (id: string) => handleRequestStatusChange(id, 'publicado')
   const handleCancelarEvento = (id: string) => handleRequestStatusChange(id, 'cancelado')
   const handleReativarEvent = (id: string) => handleRequestStatusChange(id, 'publicado')

   const handleEditEvent = (event: Event) => {
      // não muta o objeto original; cria cópia já normalizada
      setEditingEvent({ ...event, horarioAbertura: event.horarioAbertura ?? '' })
      setShowForm(true)
   }

   const handleCloseForm = () => {
      setShowForm(false)
      setEditingEvent(null)
   }

   const handleEventClick = (event: Event) => {
      setSelectedEvent(event)
   }

   const handleCloseEventDetails = () => {
      setSelectedEvent(null)
   }

    const encontrarEvento = (id: string) => [...eventos, ...eventosOverview].find((e) => e.id === id)

   if (loading) return null
   if (!isAllowed) return null
   return (
      <>
         <Toaster />
         {isError && (
            <div className="container mx-auto mb-4 flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
               <p className="text-sm text-destructive">
                  Erro ao carregar os eventos. Tente novamente.
               </p>
               <Button variant="outline" onClick={() => refetchAdminEventos()} className="gap-2 shrink-0">
                  <RotateCcw className="w-4 h-4" />
                  Tentar novamente
               </Button>
            </div>
         )}
         <AdminDashboard
             events={eventosOverview}
             totalEventos={overviewData?.pagination?.total ?? 0}
             categorias={categorias}
            onUpdateCategorias={() => queryClient.invalidateQueries({ queryKey: ['categorias'] })}
            // onUpdateLocais={setLocais}
            onNewEvent={() => {
               setEditingEvent(null)
               setShowForm(true)
            }}
             onEditEvent={handleEditEvent}
             onDeleteEvent={handleRequestDelete}
             onPublicarEvent={handlePublicarEvent}
             onCancelarEvent={handleCancelarEvento}
             onReativarEvent={handleReativarEvent}
             eventosTabela={eventos}
             totalPaginas={totalPages}
             carregandoEventos={isLoading}
             atualizandoEventos={isFetching}
             buscaEventos={searchTerm}
             onBuscaEventosChange={setSearchTerm}
             filtroStatus={statusFilter}
             onFiltroStatusChange={setStatusFilter}
             paginaEventos={currentPage}
             onPaginaEventosChange={setCurrentPage}
          />
         {showForm && (
            <EventForm
               onSubmit={handleCreateEvent}
               onClose={handleCloseForm}
               editingEvent={editingEvent}
               categorias={categorias}
               // locais={locais}
            />
         )}

         {/* Confirmação de mudança de status */}
         <AlertDialog
            open={!!statusTarget}
            onOpenChange={(open) => {
               if (!open && !isSubmitting) {
                  setStatusTarget(null)
                  setMotivoCancelamento('')
               }
            }}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>
                     {statusTarget?.next === 'cancelado' ? 'Cancelar evento' : 'Publicar evento'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {statusTarget?.next === 'cancelado'
                        ? `Tem certeza que deseja cancelar “${statusTarget?.titulo}”? O evento deixa de aparecer na programação.`
                        : `Publicar “${statusTarget?.titulo}” novamente? O evento volta a aparecer na programação.`}
                  </AlertDialogDescription>
               </AlertDialogHeader>

               {statusTarget?.next === 'cancelado' && (
                  <div className="space-y-2">
                     <Label htmlFor="motivo-cancelamento">Motivo do cancelamento (opcional)</Label>
                     <Textarea
                        id="motivo-cancelamento"
                        value={motivoCancelamento}
                        onChange={(e) => setMotivoCancelamento(e.target.value)}
                        placeholder="Explique brevemente o motivo, se quiser. Aparece para quem consultar o evento."
                        maxLength={1000}
                        disabled={isSubmitting}
                        className="min-h-24"
                     />
                     <p className="text-xs text-muted-foreground text-right">{motivoCancelamento.length}/1000</p>
                  </div>
               )}

               <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                     disabled={isSubmitting}
                     className={
                        statusTarget?.next === 'cancelado'
                           ? 'bg-destructive text-white hover:bg-destructive/90'
                           : undefined
                     }
                     onClick={(e) => {
                        e.preventDefault()
                        confirmStatusChange()
                     }}
                  >
                     {isSubmitting ? 'Salvando...' : statusTarget?.next === 'cancelado' ? 'Cancelar evento' : 'Publicar evento'}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         {/* Confirmação de exclusão */}
         <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
               if (!open && !isSubmitting) setDeleteTarget(null)
            }}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Excluir evento</AlertDialogTitle>
                  <AlertDialogDescription>
                     Tem certeza que deseja excluir “{deleteTarget?.titulo}”? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     disabled={isSubmitting}
                     className="bg-destructive text-white hover:bg-destructive/90"
                     onClick={(e) => {
                        e.preventDefault()
                        confirmDelete()
                     }}
                  >
                     {isSubmitting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   )

   //    return (
   //       <div className="min-h-screen bg-gray-50">
   //          <Toaster />

   //          {/* Navigation Bar */}
   //          <Navbar onOpenAuth={() => setAuthDialogOpen(true)} />

   //          {/* Header */}
   //          <header className="border-b border-border bg-card">
   //             <div className="container mx-auto px-4 py-6">
   //                {/* Top Section */}
   //                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
   //                   <motion.div
   //                      initial={{ opacity: 0, x: -20 }}
   //                      animate={{ opacity: 1, x: 0 }}
   //                      className="flex items-center gap-4"
   //                   >
   //                      <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center shadow-md">
   //                         <Calendar className="w-7 h-7 text-primary-foreground" />
   //                      </div>
   //                      <div>
   //                         <h1 className="text-2xl font-semibold">Eventos Solicitados</h1>
   //                         <p className="text-muted-foreground">Eventos aguardando revisão do administrador</p>
   //                      </div>
   //                   </motion.div>

   //                   {isAuthenticated && (
   //                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
   //                         <Button onClick={() => setShowForm(true)} size="lg" className="gap-2 shadow-sm">
   //                            <Plus className="w-5 h-5" />
   //                            Novo Evento
   //                         </Button>
   //                      </motion.div>
   //                   )}
   //                </div>

   //                {/* Stats Cards */}
   //                <motion.div
   //                   initial={{ opacity: 0, y: 20 }}
   //                   animate={{ opacity: 1, y: 0 }}
   //                   transition={{ delay: 0.1 }}
   //                   className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
   //                >
   //                   <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
   //                      <div className="flex items-center justify-between">
   //                         <div>
   //                            <p className="text-sm text-muted-foreground mb-1">Total de Eventos</p>
   //                            <p className="text-foreground text-3xl font-semibold">{events.length}</p>
   //                         </div>
   //                         <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
   //                            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
   //                         </div>
   //                      </div>
   //                   </div>

   //                   <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
   //                      <div className="flex items-center justify-between">
   //                         <div>
   //                            <p className="text-sm text-muted-foreground mb-1">Capacidade Total</p>
   //                            <p className="text-foreground text-3xl font-semibold">{totalCapacity.toLocaleString()}</p>
   //                         </div>
   //                         <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
   //                            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
   //                         </div>
   //                      </div>
   //                   </div>

   //                   <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
   //                      <div className="flex items-center justify-between">
   //                         <div>
   //                            <p className="text-sm text-muted-foreground mb-1">Categorias Ativas</p>
   //                            <p className="text-foreground text-3xl font-semibold">{categorias.length}</p>
   //                         </div>
   //                         <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
   //                            <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
   //                         </div>
   //                      </div>
   //                   </div>
   //                </motion.div>

   //                {/* View Mode Toggle and Search */}
   //                <motion.div
   //                   initial={{ opacity: 0, y: 20 }}
   //                   animate={{ opacity: 1, y: 0 }}
   //                   transition={{ delay: 0.2 }}
   //                   className="space-y-4"
   //                >
   //                   <div className="flex flex-col sm:flex-row gap-3">
   //                      <div className="relative flex-1">
   //                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
   //                         <Input
   //                            placeholder="Buscar eventos por título ou descrição..."
   //                            value={searchTerm}
   //                            onChange={(e) => setSearchTerm(e.target.value)}
   //                            className="pl-12 h-12 bg-input-background"
   //                         />
   //                      </div>

   //                      {/* <div className="flex gap-2 bg-muted rounded-lg p-1">
   //                         <Button
   //                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
   //                            size="sm"
   //                            onClick={() => setViewMode('grid')}
   //                            className="gap-2"
   //                         >
   //                            <Grid3x3 className="w-4 h-4" />
   //                            Grade
   //                         </Button>
   //                         <Button
   //                            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
   //                            size="sm"
   //                            onClick={() => setViewMode('calendar')}
   //                            className="gap-2"
   //                         >
   //                            <CalendarDays className="w-4 h-4" />
   //                            Calendário
   //                         </Button>
   //                      </div> */}
   //                   </div>

   //                   {viewMode === 'grid' && (
   //                      <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
   //                         <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto bg-muted">
   //                            <TabsTrigger value="all">Todas</TabsTrigger>
   //                            {categorias &&
   //                               categorias.map((categoria) => (
   //                                  <TabsTrigger key={categoria.id} value={categoria.nome}>
   //                                     {categoria.nome}
   //                                  </TabsTrigger>
   //                               ))}
   //                         </TabsList>
   //                      </Tabs>
   //                   )}
   //                </motion.div>
   //             </div>
   //          </header>

   //          {/* Main Content */}
   //          <main id="main" className="container mx-auto px-4 py-10">
   //             {/* {viewMode === 'calendar' ? ( */}
   //             {/* ) : ( */}
   //             <>
   //                {filteredEvents.length === 0 ? (
   //                   <motion.div
   //                      initial={{ opacity: 0, scale: 0.95 }}
   //                      animate={{ opacity: 1, scale: 1 }}
   //                      className="text-center py-20"
   //                   >
   //                      <div className="max-w-md mx-auto">
   //                         <div className="mb-6 w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
   //                            <Calendar className="w-10 h-10 text-muted-foreground" />
   //                         </div>
   //                         <h3 className="mb-2">Nenhum evento encontrado</h3>
   //                         <p className="text-muted-foreground mb-6">
   //                            {searchTerm || categoryFilter !== 'all'
   //                               ? 'Tente ajustar os filtros de busca'
   //                               : 'Comece criando seu primeiro evento'}
   //                         </p>
   //                         {!searchTerm && categoryFilter === 'all' && (
   //                            <Button onClick={() => setShowForm(true)} className="gap-2" size="lg">
   //                               <Plus className="w-4 h-4" />
   //                               Criar Primeiro Evento
   //                            </Button>
   //                         )}
   //                      </div>
   //                   </motion.div>
   //                ) : (
   //                   <>
   //                      <motion.div
   //                         initial={{ opacity: 0 }}
   //                         animate={{ opacity: 1 }}
   //                         className="flex items-center justify-between mb-6"
   //                      >
   //                         <p className="text-muted-foreground">
   //                            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
   //                            {totalPages > 1 && (
   //                               <span className="ml-2">
   //                                  (Página {currentPage} de {totalPages})
   //                               </span>
   //                            )}
   //                         </p>
   //                      </motion.div>

   //                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
   //                         {paginatedEvents.map((event, index) => (
   //                            <EventCard
   //                               key={event.id}
   //                               event={event}
   //                               categoria={event.categoria}
   //                               local={event.local}
   //                               onDelete={handleDeleteEvent}
   //                               onEdit={handleEditEvent}
   //                               onClick={handleEventClick}
   //                               onPublicar={handlePublicarEvent}
   //                               index={index}
   //                               isAdmin
   //                            />
   //                         ))}
   //                      </div>

   //                      {/* Pagination */}
   //                      {totalPages > 1 && (
   //                         <motion.div
   //                            initial={{ opacity: 0, y: 20 }}
   //                            animate={{ opacity: 1, y: 0 }}
   //                            className="flex justify-center"
   //                         >
   //                            <Pagination>
   //                               <PaginationContent>
   //                                  <PaginationItem>
   //                                     <PaginationPrevious
   //                                        href="#main"
   //                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
   //                                        className={
   //                                           currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
   //                                        }
   //                                     />
   //                                  </PaginationItem>

   //                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
   //                                     // Show first page, last page, current page, and pages around current
   //                                     const showPage =
   //                                        page === 1 ||
   //                                        page === totalPages ||
   //                                        (page >= currentPage - 1 && page <= currentPage + 1)

   //                                     const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
   //                                     const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2

   //                                     if (showEllipsisBefore || showEllipsisAfter) {
   //                                        return (
   //                                           <PaginationItem key={page}>
   //                                              <PaginationEllipsis />
   //                                           </PaginationItem>
   //                                        )
   //                                     }

   //                                     if (!showPage) return null

   //                                     return (
   //                                        <PaginationItem key={page}>
   //                                           <PaginationLink
   //                                              onClick={() => {
   //                                                 setCurrentPage(page)
   //                                              }}
   //                                              isActive={currentPage === page}
   //                                              className="cursor-pointer"
   //                                              href="#main"
   //                                           >
   //                                              {page}
   //                                           </PaginationLink>
   //                                        </PaginationItem>
   //                                     )
   //                                  })}

   //                                  <PaginationItem>
   //                                     <PaginationNext
   //                                        href="#main"
   //                                        onClick={() => {
   //                                           setCurrentPage((prev) => Math.min(totalPages, prev + 1))
   //                                        }}
   //                                        className={
   //                                           currentPage === totalPages
   //                                              ? 'pointer-events-none opacity-50'
   //                                              : 'cursor-pointer'
   //                                        }
   //                                     />
   //                                  </PaginationItem>
   //                               </PaginationContent>
   //                            </Pagination>
   //                         </motion.div>
   //                      )}
   //                   </>
   //                )}
   //             </>
   //             {/* )} */}
   //             <motion.div
   //                initial={{ opacity: 0, x: -20 }}
   //                animate={{ opacity: 1, x: 0 }}
   //                className="flex items-center gap-4 mb-9"
   //             >
   //                <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center shadow-md">
   //                   <CalendarDays className="w-7 h-7 text-primary-foreground" />
   //                </div>
   //                <div>
   //                   <h1 className="text-2xl font-semibold">Calendário dos Eventos</h1>
   //                   <p className="text-muted-foreground">Veja todos os eventos no calendário</p>
   //                </div>
   //             </motion.div>
   //          </main>

   //          {/* Event Form Modal */}
   //          {showForm && (
   //             <EventForm
   //                onSubmit={handleCreateEvent}
   //                onClose={handleCloseForm}
   //                editingEvent={editingEvent}
   //                categorias={categorias}
   //                locais={locais}
   //             />
   //          )}

   //          {/* Event Details Modal */}
   //          {selectedEvent && (
   //             <EventDetails
   //                event={selectedEvent}
   //                categoria={selectedEvent.categoria}
   //                local={selectedEvent.local}
   //                onClose={handleCloseEventDetails}
   //                onEdit={handleEditEvent}
   //                onDelete={handleDeleteEvent}
   //             />
   //          )}
   //          <AuthDialog
   //             open={authDialogOpen}
   //             onClose={() => setAuthDialogOpen(false)}
   //             //   onLogin={handleLogin}
   //             //   onRegister={handleRegister}
   //             // onClose={() => {}}
   //             // onLogin={() => {}}
   //             // onRegister={() => {}}
   //          />
   //       </div>
   //    )
}
