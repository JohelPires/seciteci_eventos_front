'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, FolderOpen, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { EventCard } from '@/components/EventCard'
import { EventForm } from '@/components/EventForm'
import { EventDetails } from '@/components/EventDetails'
import { CardSkeleton } from '@/components/CardSkeleton'
import { AuthDialog } from '@/components/AuthDialog'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
   PaginationEllipsis,
} from '@/components/ui/pagination'
import {
   AlertDialog,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogOverlay,
   AlertDialogTitle,
   AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/context/AuthContext'
import { ApiError, deleteEvento, editEvento, createEvento, getCategorias, getEventosAdmin, getMeusEventos } from '@/data/data'
import type { Categoria, Event } from '@/app/page'

const ITEMS_PER_PAGE = 6

export default function MeusEventos() {
   const router = useRouter()
   const queryClient = useQueryClient()
   const { token, user, isAuthenticated, loading, tokenId } = useAuth()

   const [currentPage, setCurrentPage] = useState(1)
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
   const [showForm, setShowForm] = useState(false)
   const [editingEvent, setEditingEvent] = useState<Event | null>(null)
   const [authDialogOpen, setAuthDialogOpen] = useState(false)
   const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)

   // Guard client-side: qualquer usuário logado; deslogado volta para a home
   useEffect(() => {
      if (!loading && !isAuthenticated) router.replace('/')
   }, [loading, isAuthenticated, router])

   // Endpoint dedicado: só os eventos do usuário autenticado, paginado no servidor
   const { data, error, isLoading, isFetching, refetch } = useQuery({
      queryKey: ['meus-eventos', tokenId, currentPage],
      queryFn: () => getMeusEventos(token!, { page: currentPage, limit: ITEMS_PER_PAGE }),
      enabled: isAuthenticated && ((tokenId !== null) || !!user),
      placeholderData: keepPreviousData,
   })

   // Categorias para o EventForm
   const { data: categoriasData } = useQuery({
      queryKey: ['categorias'],
      queryFn: getCategorias,
   })

   const lista: Event[] = data?.eventos ?? []
   const totalPages = data?.pagination?.totalPages ?? 0

   useEffect(() => {
      setCurrentPage(1)
   }, [data])

   if (loading || !isAuthenticated) {
      return null
   }

   const handleDeleteEvent = async (id: string) => {
      try {
         await deleteEvento(id, token)
         toast.success('Evento excluído com sucesso!')
         queryClient.invalidateQueries({ queryKey: ['meus-eventos'] })
      } catch (err) {
         if (err instanceof Error) toast.error(err.message)
      }
   }

   const handleCreateEvent = async (eventData: Omit<Event, 'id'>) => {
      if (editingEvent) {
         try {
            await editEvento(editingEvent.id, eventData, token)
            toast.success('Evento atualizado com sucesso!')
            setShowForm(false)
            setEditingEvent(null)
            queryClient.invalidateQueries({ queryKey: ['meus-eventos'] })
         } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Erro de conexão. Tente novamente.')
         }
      } else {
         try {
            await createEvento({ ...eventData, id: Date.now().toString() } as Event, token)
            toast.success('Evento solicitado. Aguarde a aprovação do administrador.')
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['meus-eventos'] })
         } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Erro de conexão. Tente novamente.')
         }
      }
   }

   const handleEditEvent = (event: Event) => {
      setEditingEvent(event)
      setShowForm(true)
      setSelectedEvent(null)
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

   return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
         <Toaster />

         <Navbar onOpenAuth={() => setAuthDialogOpen(true)} />

         <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-8">
               <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4"
               >
                  <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center shadow-md">
                     <FolderOpen className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                     <h1 className="text-2xl font-semibold">Meus eventos</h1>
                     <p className="text-muted-foreground">
                        Eventos criados por você, em qualquer status (rascunho, publicado ou cancelado)
                     </p>
                  </div>
               </motion.div>
            </div>
         </header>

         <main className="container mx-auto px-4 py-10 mb-12 flex-1">
            {error ? (
               <div className="flex flex-col items-center gap-4 py-20 text-center">
                  <p className="text-muted-foreground">
                     Erro ao carregar seus eventos.{' '}
                     {error instanceof ApiError ? error.message : 'Tente novamente.'}
                  </p>
                  <Button variant="outline" onClick={() => refetch()} className="gap-2">
                     <RotateCcw className="w-4 h-4" />
                     Tentar novamente
                  </Button>
               </div>
            ) : isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                     <CardSkeleton key={i} />
                  ))}
               </div>
            ) : lista.length === 0 ? (
               <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
               >
                  <div className="max-w-md mx-auto">
                     <div className="mb-6 w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-muted-foreground" />
                     </div>
                   <h3 className="mb-2">Você ainda não criou eventos</h3>
                   <p className="text-muted-foreground mb-6">
                      Crie seu primeiro evento para vê-lo aqui, em qualquer status.
                   </p>
                  </div>
               </motion.div>
            ) : (
               <>
                  <p aria-live="polite" className="sr-only">
                     {isFetching && !isLoading ? 'Carregando eventos…' : ''}
                  </p>
                  <div
                     className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-opacity ${isFetching && !isLoading ? 'pointer-events-none opacity-60' : ''}`}
                     aria-busy={isFetching}
                  >
                     {lista.map((event, index) => (
                        <EventCard
                           key={event.id}
                           event={event}
                           categoria={event.categoria}
                           onDelete={(id) => {
                              const alvo = lista.find((e) => e.id === id)
                              if (alvo) setDeleteTarget(alvo)
                           }}
                           onEdit={handleEditEvent}
                           onClick={handleEventClick}
                           index={index}
                           isOwner
                        />
                     ))}
                  </div>

                  {totalPages > 1 && (
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                     >
                        <Pagination>
                           <PaginationContent>
                              <PaginationItem>
                                 <PaginationPrevious
                                    href="#"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className={
                                       currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                    }
                                 />
                              </PaginationItem>

                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                 const showPage =
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                 const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
                                 const showEllipsisAfter =
                                    page === currentPage + 2 && currentPage < totalPages - 2

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
                                          onClick={() => setCurrentPage(page)}
                                          isActive={currentPage === page}
                                          className="cursor-pointer"
                                          href="#"
                                       >
                                          {page}
                                       </PaginationLink>
                                    </PaginationItem>
                                 )
                              })}

                              <PaginationItem>
                                 <PaginationNext
                                    href="#"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    className={
                                       currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                    }
                                 />
                              </PaginationItem>
                           </PaginationContent>
                        </Pagination>
                     </motion.div>
                  )}
               </>
            )}
         </main>

         <Footer />

         {/* Form de evento (criar/editar) */}
         {showForm && categoriasData && (
            <EventForm
               key={editingEvent?.id ?? 'new'}
               onSubmit={handleCreateEvent}
               onClose={handleCloseForm}
               editingEvent={editingEvent}
               categorias={categoriasData || []}
            />
         )}

         {/* Detalhes do evento */}
         {selectedEvent && (
            <EventDetails
               event={selectedEvent}
               categoria={selectedEvent.categoria}
               onClose={handleCloseEventDetails}
               onEdit={handleEditEvent}
               onDelete={(id) => {
                  const alvo = lista.find((e) => e.id === id)
                  if (alvo) setDeleteTarget(alvo)
               }}
               isOwner
            />
         )}

         {/* Confirmação de exclusão */}
         <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
               if (!open) setDeleteTarget(null)
            }}
         >
            <AlertDialogOverlay />
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Excluir evento</AlertDialogTitle>
                  <AlertDialogDescription>
                     Tem certeza que deseja excluir “{deleteTarget?.titulo}”? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => {
                        if (deleteTarget) {
                           handleDeleteEvent(deleteTarget.id)
                           setDeleteTarget(null)
                           setSelectedEvent(null)
                        }
                     }}
                  >
                     Excluir
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
      </div>
   )
}
