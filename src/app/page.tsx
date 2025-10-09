'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Calendar, BarChart3, Users, Tag, Grid3x3, CalendarDays } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { EventCard } from '@/components/EventCard'
import { EventForm } from '@/components/EventForm'
import { CalendarView } from '@/components/CalendarView'
import { EventDetails } from '@/components/EventDetails'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { motion } from 'framer-motion'
import { getEventos } from '@/data/data'

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

const initialEvents: Event[] = [
   {
      id: '1',
      title: 'Tech Summit 2025',
      description: 'O maior evento de tecnologia do ano com palestras sobre IA, Web3 e inovação.',
      date: '2025-10-15',
      time: '09:00',
      location: 'Centro de Convenções - São Paulo, SP',
      category: 'Tecnologia',
      capacity: 500,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwZXZlbnR8ZW58MXx8fHwxNzU5MzE5Nzk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
   },
   {
      id: '2',
      title: 'Workshop de Desenvolvimento Web',
      description: 'Aprenda as melhores práticas de desenvolvimento frontend com React e TypeScript.',
      date: '2025-10-20',
      time: '14:00',
      location: 'Espaço Inovação - Rio de Janeiro, RJ',
      category: 'Educação',
      capacity: 50,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwd29ya3Nob3B8ZW58MXx8fHwxNzU5MzYxNDk3fDA&ixlib=rb-4.1.0&q=80&w=1080',
   },
   {
      id: '3',
      title: 'Networking Empresarial',
      description: 'Conecte-se com líderes e empreendedores em um ambiente de negócios dinâmico.',
      date: '2025-11-05',
      time: '18:00',
      location: 'Hotel Business Plaza - Brasília, DF',
      category: 'Negócios',
      capacity: 150,
      image: 'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmd8ZW58MXx8fHwxNzU5MjgxNDU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
   },
]

export default function App() {
   const [events, setEvents] = useState<Event[]>(initialEvents)
   const [showForm, setShowForm] = useState(false)
   const [editingEvent, setEditingEvent] = useState<Event | null>(null)
   const [searchTerm, setSearchTerm] = useState('')
   const [categoryFilter, setCategoryFilter] = useState('all')
   const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

   useEffect(() => {
      async function fetchData() {
         try {
            const response = await getEventos()
            console.log(response)
         } catch (error) {
            console.log(error)
         }
         console.log('teste')
      }

      fetchData()
   }, [])

   const handleCreateEvent = (eventData: Omit<Event, 'id'>) => {
      if (editingEvent) {
         setEvents(events.map((e) => (e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e)))
         toast.success('Evento atualizado com sucesso!')
         setEditingEvent(null)
      } else {
         const newEvent: Event = {
            ...eventData,
            id: Date.now().toString(),
         }
         setEvents([newEvent, ...events])
         toast.success('Evento criado com sucesso!')
      }
      setShowForm(false)
   }

   const handleDeleteEvent = (id: string) => {
      setEvents(events.filter((e) => e.id !== id))
      toast.success('Evento excluído com sucesso!')
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
         event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         event.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter
      return matchesSearch && matchesCategory
   })

   const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0)
   const categories = [...new Set(events.map((e) => e.category))]

   return (
      <div className="min-h-screen bg-background">
         <Toaster />

         {/* Navigation Bar */}
         <Navbar />

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
                        <p className="text-muted-foreground">Eventos da Seciteci no Estado do Mato Grosso</p>
                     </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                     <Button onClick={() => setShowForm(true)} size="lg" className="gap-2 shadow-sm">
                        <Plus className="w-5 h-5" />
                        Novo Evento
                     </Button>
                  </motion.div>
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
                        <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                           <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm text-muted-foreground mb-1">Capacidade Total</p>
                           <p className="text-foreground text-3xl font-semibold">{totalCapacity.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                           <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm text-muted-foreground mb-1">Categorias Ativas</p>
                           <p className="text-foreground text-3xl font-semibold">{categories.length}</p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                           <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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

                     <div className="flex gap-2 bg-muted rounded-lg p-1">
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
                     </div>
                  </div>

                  {viewMode === 'grid' && (
                     <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto bg-muted">
                           <TabsTrigger value="all">Todas</TabsTrigger>
                           <TabsTrigger value="Tecnologia">Tecnologia</TabsTrigger>
                           <TabsTrigger value="Negócios">Negócios</TabsTrigger>
                           <TabsTrigger value="Educação">Educação</TabsTrigger>
                           <TabsTrigger value="Entretenimento">Entretenimento</TabsTrigger>
                           <TabsTrigger value="Esportes">Esportes</TabsTrigger>
                           <TabsTrigger value="Cultura">Cultura</TabsTrigger>
                           <TabsTrigger value="Saúde">Saúde</TabsTrigger>
                        </TabsList>
                     </Tabs>
                  )}
               </motion.div>
            </div>
         </header>

         {/* Main Content */}
         <main className="container mx-auto px-4 py-10">
            {viewMode === 'calendar' ? (
               <CalendarView events={events} onEventClick={handleEventClick} />
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
                                 : 'Comece criando seu primeiro evento'}
                           </p>
                           {!searchTerm && categoryFilter === 'all' && (
                              <Button onClick={() => setShowForm(true)} className="gap-2" size="lg">
                                 <Plus className="w-4 h-4" />
                                 Criar Primeiro Evento
                              </Button>
                           )}
                        </div>
                     </motion.div>
                  ) : (
                     <>
                        <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="flex items-center justify-between mb-6"
                        >
                           <p className="text-muted-foreground">
                              {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
                           </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredEvents.map((event, index) => (
                              <EventCard
                                 key={event.id}
                                 event={event}
                                 onDelete={handleDeleteEvent}
                                 onEdit={handleEditEvent}
                                 index={index}
                              />
                           ))}
                        </div>
                     </>
                  )}
               </>
            )}
         </main>

         {/* Event Form Modal */}
         {showForm && <EventForm onSubmit={handleCreateEvent} onClose={handleCloseForm} editingEvent={editingEvent} />}

         {/* Event Details Modal */}
         {selectedEvent && (
            <EventDetails
               event={selectedEvent}
               onClose={handleCloseEventDetails}
               onEdit={handleEditEvent}
               onDelete={handleDeleteEvent}
            />
         )}
      </div>
   )
}
