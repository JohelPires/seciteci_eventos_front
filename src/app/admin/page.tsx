'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Calendar, BarChart3, Users, Tag, CalendarDays, Map, Edit } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { EventCard } from '@/components/EventCard'
import { EventForm } from '@/components/EventForm'
import { CalendarView } from '@/components/CalendarView'
import { EventDetails } from '@/components/EventDetails'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
   PaginationEllipsis,
} from '@/components/ui/pagination'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { motion } from 'framer-motion'
import {
   createEvento,
   deleteEvento,
   editEvento,
   getCategorias,
   getEventos,
   getEventosAdmin,
   getLocais,
} from '@/data/data'
import { AuthDialog } from '@/components/AuthDialog'
import { MapView } from '@/components/MapView'
import { useAuth } from '@/context/AuthContext'
import { Alert } from '@/components/ui/alert'
import {
   AlertDialog,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogOverlay,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { set } from 'react-hook-form'
import { AdminDashboard } from '@/components/AdminDashboard'

import { Event } from '@/app/page'
import { Categoria } from '@/app/page'
// import { Local } from '@/app/page'

// const categorias: Categoria[] = await getCategorias()
// console.log(categorias)

// const locais: Local[] = await getLocais()
// console.log(locais)

const ITEMS_PER_PAGE = 20

export default function App() {
   const [events, setEvents] = useState<Event[]>([])
   const [showForm, setShowForm] = useState(false)
   const [editingEvent, setEditingEvent] = useState<Event | null>(null)
   const [searchTerm, setSearchTerm] = useState('')
   const [categoryFilter, setCategoryFilter] = useState('all')
   const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
   const [currentPage, setCurrentPage] = useState(1)
   const [authDialogOpen, setAuthDialogOpen] = useState(false)

   const [categorias, setCategorias] = useState<Categoria[]>([])
   // const [locais, setLocais] = useState<Local[]>([])

   const [alertMessage, setAlertMessage] = useState('')
   const [alertDialogOpen, setAlertDialogOpen] = useState(false)
   const [reload, setReload] = useState(false)

   const { token, isAuthenticated, user, logout } = useAuth()

   // Helper functions
   // const getCategoria = (id: number) => categorias.find((c) => c.id === id)
   // const getLocal = (id: number) => locais.find((l) => l.id === id)

   useEffect(() => {
      async function fetchData() {
         try {
            const response = await getEventosAdmin(token)

            setEvents(response.eventos)
         } catch (error) {
            console.log(error)
         }
      }

      fetchData()
   }, [reload])

   useEffect(() => {
      async function fetchData() {
         try {
            const response = await getCategorias()

            setCategorias(response)
         } catch (error) {
            console.log(error)
         }
      }

      fetchData()
   }, [reload])

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
         // setEvents(events.map((e) => (e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e)))
         const data = await editEvento(editingEvent.id, eventData, token)

         toast.success('Evento atualizado com sucesso!')
         setEditingEvent(null)
      } else {
         const horarioAbertura = eventData.horarioAbertura ?? ''
         const horarioEncerramento = eventData.horarioEncerramento ?? ''
         const newEvent: Event = {
            ...eventData,
            status: 'rascunho',
            horarioAbertura,
            horarioEncerramento,
            id: Date.now().toString(),
         }
         // setEvents([newEvent, ...events])
         try {
            const data = await createEvento(newEvent, token)

            toast.success('Evento solicitado.')
            setAlertMessage('Evento solicitado. Aguarde a aprovação do administrador.')
            setAlertDialogOpen(true)
         } catch (error) {
            console.log(error)
         }
      }
      setShowForm(false)
   }

   const handleDeleteEvent = async (id: string) => {
      // setEvents(events.filter((e) => e.id !== id))
      try {
         const data = await deleteEvento(id, token)
         setReload(!reload)
      } catch (error) {
         if (error instanceof Error) {
            toast.error(error.message)
         }
      }
      toast.success('Evento excluído com sucesso!')
   }

   const handleEditEvent = (event: Event) => {
      if (!event.horarioAbertura) {
         // handle the case where horarioAbertura is undefined
         // for example, you could set it to an empty string
         event.horarioAbertura = ''
      }
      setEditingEvent(event)
      setShowForm(true)
   }

   const handlePublicarEvent = async (id: string) => {
      //   setEvents(events.map((e) => (e.id === id ? { ...e, status: 'publicado' } : e)))
      const data = await editEvento(id, { status: 'publicado' }, token)

      setReload(!reload)
      toast.success('Evento aprovado com sucesso!')
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

   const filteredEvents = events.filter((event) => {
      const matchesSearch =
         event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
         event.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || event.categoria?.nome === categoryFilter
      return matchesSearch && matchesCategory
   })

   // Pagination calculations
   const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
   const endIndex = startIndex + ITEMS_PER_PAGE
   const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

   // Reset to page 1 when filters change
   useEffect(() => {
      setCurrentPage(1)
   }, [searchTerm, categoryFilter])

   const totalCapacity = events.reduce((sum, event) => sum + event.capacidadeMaxima, 0)
   const activeCategories = [...new Set(events.map((e) => e.categoriaId))].length

   return (
      <>
         <Toaster />
         <AdminDashboard
            events={events}
            categorias={categorias}
            onLogout={logout}
            onUpdateEvents={setEvents}
            onUpdateCategorias={setCategorias}
            // onUpdateLocais={setLocais}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onPublicarEvent={handlePublicarEvent}
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
