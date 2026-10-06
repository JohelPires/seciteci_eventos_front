'use client'
import { Suspense, use, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Calendar, BarChart3, Users, Tag, Map, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { ApiError, createEvento, deleteEvento, editEvento, getCategorias, getEventos, getLocais } from '@/data/data'
import { AuthDialog } from '@/components/AuthDialog'
import { MapView } from '@/components/MapView'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { CardSkeleton } from '@/components/CardSkeleton'
import { Footer } from '@/components/Footer'
import { useQuery } from '@tanstack/react-query'
import { get } from 'http'
import { Separator } from '@radix-ui/react-select'
import Image from 'next/image'

export interface Local {
   id: number
   nome: string
   endereco: string
   numero: string
   complemento?: string
   bairro: string
   cidade: string
   estado: string
   cep: string
   capacidade: number
   latitude: number
   longitude: number
}

export interface Categoria {
   id: number
   nome: string
   cor: string
}

export interface Event {
   id: string
   titulo: string
   descricao: string
   categoriaId: number
   categoria: Categoria | null
   organizadorId?: number
   dataInicio: string
   dataFim: string
   horarioAbertura?: string | undefined
   horarioEncerramento?: string | undefined
   capacidadeMaxima: number
   vagasDisponiveis?: number
   tipoEvento: 'presencial' | 'online' | 'hibrido'
   linkOnline?: string
   LocalLinkGoogleMaps?: string
   LocalNome?: string
   LocalEndereco?: string
   LocalNumero?: string
   LocalComplemento?: string
   LocalBairro?: string
   LocalCidade?: string
   LocalEstado?: string
   LocalCep?: string
   LocalPais?: string
   LocalCapacidade?: number
   LocalLatitude?: string
   LocalLongitude?: string
   LocalObservacoes?: string
   linkPaginaEvento?: string
   imagemCapa?: string
   status: 'rascunho' | 'publicado' | 'cancelado'
   publicoAlvo?: string
   requisitos?: string
}

   const ITEMS_PER_PAGE = 6

const fimDoDia = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

function AppContent() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const action = searchParams.get('action')

   const [events, setEvents] = useState<Event[]>([])
   const [showForm, setShowForm] = useState(false)
   const [editingEvent, setEditingEvent] = useState<Event | null>(null)
   const [searchTerm, setSearchTerm] = useState('')
   const [categoryFilter, setCategoryFilter] = useState('all')
   const [selectedDate, setSelectedDate] = useState<Date | null>(null)
   const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
   const [currentPage, setCurrentPage] = useState(1)
   const [authDialogOpen, setAuthDialogOpen] = useState(false)

   const [loading, setLoading] = useState<boolean>(true)

   const [reload, setReload] = useState(false)

   const [alertMessage, setAlertMessage] = useState('')
   const [alertDialogOpen, setAlertDialogOpen] = useState(false)

   const { token, isAuthenticated, user, logout } = useAuth()

   // Helper functions
   // const getCategoria = (id: number) => categorias.find((c) => c.id === id)
   // const getLocal = (id: number) => locais.find((l) => l.id === id)

   const { data, error, isLoading } = useQuery({
      queryKey: ['eventos'],
      queryFn: getEventos,
   })
   const { data: categoriasData, isLoading: isLoadingCategorias } = useQuery({
      queryKey: ['categorias'],
      queryFn: getCategorias,
   })
   const { data: locaisData, isLoading: isLoadingLocais } = useQuery({
      queryKey: ['locais'],
      queryFn: getLocais,
   })

   // Menu "Criar evento" navega para /?action=create:
   // logado abre o form; deslogado abre o dialog de autenticação.
   useEffect(() => {
      if (action !== 'create') return
      if (isAuthenticated) {
         setShowForm(true)
      } else {
         setAuthDialogOpen(true)
      }
      router.replace('/', { scroll: false })
   }, [action, isAuthenticated, router])

   useEffect(() => {
      if (data) {
         setEvents(
            data.eventos.sort(
               (a: Event, b: Event) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime(),
            ),
         )
         // setLoading(false)
      }
   }, [data])

   // useEffect(() => {
   //    async function fetchData() {
   //       try {
   //          setLoading(true)
   //          const response = await getEventos()

   //          setEvents(response.eventos)
   //          setLoading(false)
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
            setShowForm(false)
            setEditingEvent(null)
         } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Erro de conexão. Tente novamente.')
         }
      } else {
         const newEvent: Event = {
            ...eventData,
            id: Date.now().toString(),
         }
         try {
            await createEvento(newEvent, token)
            toast.success('Solicitação enviada. Aguarde a análise da equipe responsável.')
            setAlertMessage('Solicitação enviada. Aguarde a análise da equipe responsável.')
            setAlertDialogOpen(true)
            setShowForm(false)
         } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Erro de conexão. Tente novamente.')
         }
      }
   }

   const handleDeleteEvent = async (id: string) => {
      // setEvents(events.filter((e) => e.id !== id))
      try {
         await deleteEvento(id, token)
         toast.success('Evento excluído com sucesso!')
      } catch (error) {
         if (error instanceof Error) {
            toast.error(error.message)
         }
      }
   }

   const handleEditEvent = (event: Event) => {
      setEditingEvent(event)
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

   const filteredEvents = events.filter((event) => {
      const matchesSearch =
         event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
         event.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || event.categoria?.nome === categoryFilter
      const matchesDay =
         !selectedDate ||
         (new Date(event.dataInicio) <= fimDoDia(selectedDate) &&
            new Date(event.dataFim ?? event.dataInicio) >= inicioDoDia(selectedDate))
      return matchesSearch && matchesCategory && matchesDay
   })

   // Pagination calculations
   const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
   const endIndex = startIndex + ITEMS_PER_PAGE
   const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

   // Reset to page 1 when filters change
   useEffect(() => {
      setCurrentPage(1)
   }, [searchTerm, categoryFilter, selectedDate])

   const totalCapacity = events.reduce((sum, event) => sum + event.capacidadeMaxima, 0)
   const activeCategories = [...new Set(events.map((e) => e.categoriaId))].length

   return (
      <div className="min-h-screen bg-gray-50">
         <Toaster />

         {/* Navigation Bar */}
         <Navbar onOpenAuth={() => setAuthDialogOpen(true)} />

         <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-6">
               <div className="flex justify-center mb-4">
                  <Image
                     className="rounded-xl shadow-2xl"
                     src="/conecte-se.webp"
                     alt="Conecte-se"
                     width={2000}
                     height={1000}
                  />
               </div>
               <p className="text-justify text-xl py-3 text-gray-600">
                  O Conecte-se é uma agenda unificada dos eventos da área de Ciência, Tecnologia e Inovação no Estado de
                  Mato Grosso. Existe uma comunidade muito ativa neste segmento, com uma grande produção de eventos como
                  seminários, simpósios, congressos, encontros e outras atividades. Diante disso, a SECITECI conta com
                  uma ferramenta de consulta e divulgação das ações das diversas instituições e atores do ecossistema de
                  ciência, tecnologia e inovação em Mato Grosso.{' '}
               </p>
            </div>
         </header>

         {/* Divider
         <div className="h-0.5 mt-10 mb-5 bg-gray-200 rounded-2xl"></div> */}
         {/* Header */}
         <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-6">
               {/* Top Section */}
               <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
                  <motion.div
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="flex items-center gap-4"
                  >
                     <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center shadow-md">
                        <Calendar className="w-7 h-7 text-primary-foreground" />
                     </div>
                     <div>
                        <h1 className="text-2xl font-semibold">Eventos</h1>
                        <p className="text-muted-foreground">Eventos realizados ou apoiados pela SECITECI</p>
                     </div>
                  </motion.div>

                  {isAuthenticated && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Button onClick={() => setShowForm(true)} size="lg" className="gap-2 shadow-sm">
                           <Plus className="w-5 h-5" />
                           Solicitar Cadastro de Evento
                        </Button>
                     </motion.div>
                  )}
               </div>

               {/* Stats Cards */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
               >
                  <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm text-muted-foreground mb-1">Total de Eventos</p>
                           <p className="text-foreground text-3xl font-semibold">{events.length}</p>
                        </div>
                        <div className="p-3 bg-primary dark:bg-blue-950 rounded-lg">
                           <BarChart3 className="w-5 h-5 text-white dark:text-blue-400" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm text-muted-foreground mb-1">Vagas totais</p>
                           <p className="text-foreground text-3xl font-semibold">{totalCapacity.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-primary dark:bg-green-950 rounded-lg">
                           <Users className="w-5 h-5 text-white dark:text-green-400" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm text-muted-foreground mb-1">Categorias Ativas</p>
                           <p className="text-foreground text-3xl font-semibold">{categoriasData?.length || 0}</p>
                        </div>
                        <div className="p-3 bg-primary dark:bg-purple-950 rounded-lg">
                           <Tag className="w-5 h-5 text-white dark:text-purple-400" />
                        </div>
                     </div>
                  </div>
               </motion.div>

               {/* View Mode Toggle and Search */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
               >
                  <div className="flex flex-col sm:flex-row gap-3">
                     <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                           placeholder="Buscar eventos por título ou descrição..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-12 h-12 bg-input-background"
                        />
                     </div>

                     {/* <div className="flex gap-2 bg-muted rounded-lg p-1">
                        <Button
                           variant={viewMode === 'grid' ? 'default' : 'ghost'}
                           size="sm"
                           onClick={() => setViewMode('grid')}
                           className="gap-2"
                        >
                           <Grid3x3 className="w-4 h-4" />
                           Grade
                        </Button>
                        <Button
                           variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                           size="sm"
                           onClick={() => setViewMode('calendar')}
                           className="gap-2"
                        >
                           <CalendarDays className="w-4 h-4" />
                           Calendário
                        </Button>
                     </div> */}
                  </div>

                  {viewMode === 'grid' && (
                     <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto bg-primary">
                           <TabsTrigger
                              value="all"
                              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                           >
                              Todas as categorias
                           </TabsTrigger>
                           {categoriasData &&
                              categoriasData.map((categoria: Categoria) => (
                                 <TabsTrigger
                                    key={categoria.id}
                                    value={categoria.nome}
                                    className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                                 >
                                    {categoria.nome}
                                 </TabsTrigger>
                              ))}
                        </TabsList>
                     </Tabs>
                  )}

                  {/* Calendário: filtro por dia para os cards abaixo */}
                  <div className="mt-6">
                     <CalendarView
                        events={events}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        showPanel={false}
                     />
                  </div>
               </motion.div>
            </div>
         </header>

         {/* Main Content */}
         <main id="main" className="container mx-auto px-4 py-10 mb-12">
            {/* {viewMode === 'calendar' ? ( */}
            {/* ) : ( */}
            {/* Chip do filtro por dia */}
            {selectedDate && (
               <div className="mb-6 flex justify-center">
                  <Badge className="gap-2 px-3 py-1.5 text-sm">
                     Eventos em{' '}
                     {selectedDate.toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                     })}
                     <button
                        type="button"
                        onClick={() => setSelectedDate(null)}
                        aria-label="Remover filtro de dia"
                        className="hover:opacity-70"
                     >
                        <X className="w-4 h-4" />
                     </button>
                  </Badge>
               </div>
            )}
            {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                     <CardSkeleton key={i} />
                  ))}
               </div>
            ) : (
               <>
                  {filteredEvents.length === 0 ? (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20"
                     >
                        <div className="max-w-md mx-auto">
                           <div className="mb-6 w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                              <Calendar className="w-10 h-10 text-muted-foreground" />
                           </div>
                           <h3 className="mb-2">Nenhum evento encontrado</h3>
                           <p className="text-muted-foreground mb-6">
                              {searchTerm || categoryFilter !== 'all'
                                 ? 'Tente ajustar os filtros de busca'
                                 : selectedDate
                                   ? 'Nenhum evento neste dia. Tente outro dia ou limpe o filtro'
                                   : 'Comece criando seu primeiro evento'}
                           </p>
                           {!searchTerm && categoryFilter === 'all' && (
                              <Button onClick={() => setShowForm(true)} className="gap-2" size="lg">
                                 <Plus className="w-4 h-4" />
                                 Solicite um cadastro de evento
                              </Button>
                           )}
                        </div>
                     </motion.div>
                  ) : (
                     <>
                        {/* <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="flex items-center justify-between mb-6"
                        >
                           <p className="text-muted-foreground">
                              {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
                              {totalPages > 1 && (
                                 <span className="ml-2">
                                    (Página {currentPage} de {totalPages})
                                 </span>
                              )}
                           </p>
                        </motion.div> */}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                           {paginatedEvents.map((event, index) => (
                              <EventCard
                                 key={event.id}
                                 event={event}
                                 categoria={event.categoria}
                                 // local={event.local}
                                 onDelete={handleDeleteEvent}
                                 onEdit={handleEditEvent}
                                 onClick={handleEventClick}
                                 index={index}
                              />
                           ))}
                        </div>

                        {/* Pagination */}
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
                                          href="#main"
                                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                          className={
                                             currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                          }
                                       />
                                    </PaginationItem>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                       // Show first page, last page, current page, and pages around current
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
                                                onClick={() => {
                                                   setCurrentPage(page)
                                                }}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                                href="#main"
                                             >
                                                {page}
                                             </PaginationLink>
                                          </PaginationItem>
                                       )
                                    })}

                                    <PaginationItem>
                                       <PaginationNext
                                          href="#main"
                                          onClick={() => {
                                             setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                          }}
                                          className={
                                             currentPage === totalPages
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                          }
                                       />
                                    </PaginationItem>
                                 </PaginationContent>
                              </Pagination>
                           </motion.div>
                        )}
                     </>
                  )}
               </>
            )}
            {/* )} */}
            {/* Divider */}
            <div className="h-0.5 mt-10 mb-5 bg-gray-200 rounded-2xl"></div>
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-4"
            >
               <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center shadow-md">
                  <Map className="w-7 h-7 text-primary-foreground" />
               </div>
               <div>
                  <h1 className="text-2xl font-semibold">Mapa dos Eventos</h1>
                  <p className="text-muted-foreground">Veja todos os eventos distribuidos no mapa</p>
               </div>
            </motion.div>
            <MapView events={events} categorias={categoriasData || []} onEventClick={handleEventClick} />
         </main>

         <Footer />

         {/* Event Form Modal */}
         {showForm && !isLoadingCategorias && (
            <EventForm
               key={editingEvent?.id ?? 'new'}
               onSubmit={handleCreateEvent}
               onClose={handleCloseForm}
               editingEvent={editingEvent}
               categorias={categoriasData || []}
               closeOnOutsideClick={false}
               // locais={locaisData || []}
            />
         )}

         {/* Event Details Modal */}
         {selectedEvent && (
            <EventDetails
               event={selectedEvent}
               categoria={selectedEvent.categoria}
               // local={selectedEvent.local}
               onClose={handleCloseEventDetails}
               onEdit={handleEditEvent}
               onDelete={handleDeleteEvent}
            />
         )}
         <AuthDialog
            open={authDialogOpen}
            onClose={() => setAuthDialogOpen(false)}
            //   onLogin={handleLogin}
            //   onRegister={handleRegister}
            // onClose={() => {}}
            // onLogin={() => {}}
            // onRegister={() => {}}
         />

         <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
            <AlertDialogOverlay />
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Atenção</AlertDialogTitle>
               </AlertDialogHeader>
               <AlertDialogDescription>{alertMessage && alertMessage}</AlertDialogDescription>
               <AlertDialogFooter>
                  <AlertDialogCancel
                     onClick={() => {
                        setAlertMessage('')
                        setAlertDialogOpen(false)
                     }}
                  >
                     Ok
                  </AlertDialogCancel>
               </AlertDialogFooter>
             </AlertDialogContent>
          </AlertDialog>
       </div>
   )
}

export default function App() {
   return (
      <Suspense>
         <AppContent />
      </Suspense>
   )
}
