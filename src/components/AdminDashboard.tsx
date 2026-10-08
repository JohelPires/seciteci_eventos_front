'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, Calendar, MapPin, Tag, Users, Settings, LogOut, ExternalLink, Activity, TrendingUp, Map } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { AdminEventos } from './AdminEventos'
import { AdminCategorias } from './AdminCategorias'
// import { AdminLocais } from './AdminLocais'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { Event, Categoria, Local } from '@/app/page'
import { useAuth } from '@/context/AuthContext'
import { Footer } from './Footer'
import { AdminUsuarios } from './AdminUsuarios'
import { MapView } from './MapView'
import { UserBadge } from './UserBadge'
import { CalendarView } from './CalendarView'
import { EventDetails } from './EventDetails'

// ponto colorido por status/tipo — mesma linguagem de "Eventos por Categoria"
const STATUS_DOTS: Record<Event['status'], string> = {
   publicado: 'bg-green-600',
   rascunho: 'bg-amber-500',
   cancelado: 'bg-red-600',
}

const TIPO_DOTS: Record<Event['tipoEvento'], string> = {
   presencial: 'bg-primary',
   online: 'bg-violet-500',
   hibrido: 'bg-teal-500',
}

interface AdminDashboardProps {
   events: Event[]
   categorias: Categoria[]
   // locais: Local[]
   onLogout: () => void
   onUpdateEvents: (events: Event[]) => void
   onUpdateCategorias: (categorias: Categoria[]) => void
   // onUpdateLocais: (locais: Local[]) => void
   onNewEvent: () => void
   onEditEvent: (event: Event) => void
   onDeleteEvent: (id: string) => void
   onPublicarEvent: (id: string) => void
   onCancelarEvent: (id: string) => void
}

export function AdminDashboard({
   events,
   categorias,
   // locais,
   onLogout,
   onUpdateEvents,
   onUpdateCategorias,
   // onUpdateLocais,
   onNewEvent,
   onEditEvent,
   onDeleteEvent,
   onPublicarEvent,
   onCancelarEvent,
}: AdminDashboardProps) {
   const [activeTab, setActiveTab] = useState('overview')
   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
   const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const { user, userRole } = useAuth()

   const shouldReduceMotion = useReducedMotion()
   const container: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: 0.06 } },
   }
   const item: Variants = {
      hidden: shouldReduceMotion ? {} : { opacity: 0, y: 20 },
      show: shouldReduceMotion ? {} : { opacity: 1, y: 0 },
   }

   if (!user) {
      return <div>Não autenticado</div>
   }

   // Statistics
   const totalEvents = events.length
   const publishedEvents = events.filter((e) => e.status === 'publicado').length
   const draftEvents = events.filter((e) => e.status === 'rascunho').length
   const cancelledEvents = events.filter((e) => e.status === 'cancelado').length
   const totalCapacity = events.reduce((sum, e) => sum + e.capacidadeMaxima, 0)
   const averageCapacity = totalEvents > 0 ? Math.round(totalCapacity / totalEvents) : 0
   const categoriasComEventos = categorias.filter((cat) =>
      events.some((e) => e.categoriaId === cat.id),
   ).length

   // Events by category
   const eventsByCategory = categorias.map((cat) => ({
      categoria: cat.nome,
      cor: cat.cor,
      count: events.filter((e) => e.categoriaId === cat.id).length,
   }))

   // Events by type
   const eventsByType = {
      presencial: events.filter((e) => e.tipoEvento === 'presencial').length,
      online: events.filter((e) => e.tipoEvento === 'online').length,
      hibrido: events.filter((e) => e.tipoEvento === 'hibrido').length,
   }

   const handleEventClick = (event: Event) => {
      setSelectedEvent(event)
   }


   return (
      <div className="min-h-screen bg-background">
         {/* Admin Header */}
         <header className="border-b border-border shadow-sm bg-primary">
            <div className="container mx-auto px-4 py-4">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Settings className="w-6 h-6 text-primary-foreground" />
                     </div>
                     <div>
                        <h1 className="text-xl text-white">
                           {' '}
                           <span className="font-bold"> CONECTE-SE</span> | Painel Administrativo
                        </h1>
                        <p className="text-sm text-white/50">Gerenciamento da Plataforma</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                     {/* Crachá de identidade: mostra quem opera o painel antes das saídas */}
                     <UserBadge nome={user.nome} fotoPerfil={user.fotoPerfil} papel={userRole ?? user.tipoUsuario} />
                     <div className="hidden sm:block h-8 w-px bg-white/20" aria-hidden="true" />
                     {/* Saída que preserva a sessão: nomeada pelo destino */}
                     <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href="/">
                           <ExternalLink className="w-4 h-4" />
                           Ver o site
                        </Link>
                     </Button>
                     {/* Saída que encerra a sessão */}
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLogout}
                        className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
                     >
                        <LogOut className="w-4 h-4" />
                        Sair
                     </Button>
                  </div>
               </div>
            </div>
         </header>

         <div className="container mx-auto px-4 py-8 min-h-screen">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
               <TabsList className="mb-8 bg-primary w-full">
                  <TabsTrigger
                     value="overview"
                     className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                     <Activity className="w-4 h-4" />
                     Visão Geral
                  </TabsTrigger>
                  <TabsTrigger
                     value="events"
                     className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                     <Calendar className="w-4 h-4" />
                     Eventos
                  </TabsTrigger>
                  <TabsTrigger
                     value="locations"
                     className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                     <Users className="w-4 h-4" />
                     Usuários
                  </TabsTrigger>
                  <TabsTrigger
                     value="categories"
                     className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                     <Tag className="w-4 h-4" />
                     Categorias
                  </TabsTrigger>
               </TabsList>

               {/* Overview Tab */}
               <TabsContent value="overview" className="space-y-6">
                   <motion.div
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                   >
                      <motion.div variants={item} className="h-full">
                         <Card className="h-full">
                            <CardHeader className="pb-3">
                               <div className="flex items-start justify-between gap-3">
                                  <div>
                                     <CardDescription>Total de Eventos</CardDescription>
                                     <CardTitle className="text-3xl">{totalEvents}</CardTitle>
                                  </div>
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                     <Calendar className="w-5 h-5 text-muted-foreground" />
                                  </div>
                               </div>
                            </CardHeader>
                            <CardContent>
                               <p className="text-sm text-muted-foreground">Todos os status</p>
                            </CardContent>
                         </Card>
                      </motion.div>

                      <motion.div variants={item} className="h-full">
                         <Card className="h-full">
                            <CardHeader className="pb-3">
                               <div className="flex items-start justify-between gap-3">
                                  <div>
                                     <CardDescription>Eventos Publicados</CardDescription>
                                     <CardTitle className="text-3xl text-green-600">{publishedEvents}</CardTitle>
                                  </div>
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                     <TrendingUp className="w-5 h-5 text-muted-foreground" />
                                  </div>
                               </div>
                            </CardHeader>
                            <CardContent>
                               <p className="text-sm text-muted-foreground">
                                  {totalEvents > 0 ? Math.round((publishedEvents / totalEvents) * 100) : 0}% do total
                               </p>
                            </CardContent>
                         </Card>
                      </motion.div>

                      <motion.div variants={item} className="h-full">
                         <Card className="h-full">
                            <CardHeader className="pb-3">
                               <div className="flex items-start justify-between gap-3">
                                  <div>
                                     <CardDescription>Vagas Totais</CardDescription>
                                     <CardTitle className="text-3xl">{totalCapacity.toLocaleString()}</CardTitle>
                                  </div>
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                     <Users className="w-5 h-5 text-muted-foreground" />
                                  </div>
                               </div>
                            </CardHeader>
                            <CardContent>
                               <p className="text-sm text-muted-foreground">Média: {averageCapacity} pessoas</p>
                            </CardContent>
                         </Card>
                      </motion.div>

                      <motion.div variants={item} className="h-full">
                         <Card className="h-full">
                            <CardHeader className="pb-3">
                               <div className="flex items-start justify-between gap-3">
                                  <div>
                                     <CardDescription>Categorias Ativas</CardDescription>
                                     <CardTitle className="text-3xl">{categorias.length}</CardTitle>
                                  </div>
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                     <Tag className="w-5 h-5 text-muted-foreground" />
                                  </div>
                               </div>
                            </CardHeader>
                            <CardContent>
                               <p className="text-sm text-muted-foreground">
                                  {categoriasComEventos} com eventos
                               </p>
                            </CardContent>
                         </Card>
                      </motion.div>
                   </motion.div>

                  <motion.div
                     variants={container}
                     initial="hidden"
                     animate="show"
                     className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                     {/* Events by Status */}
                     <motion.div variants={item} className="h-full">
                        <Card className="h-full">
                           <CardHeader>
                              <CardTitle>Eventos por Status</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                 <span className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS.publicado}`} />
                                    Publicados
                                 </span>
                                 <span className="font-semibold">{publishedEvents}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                 <span className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS.rascunho}`} />
                                    Pendentes
                                 </span>
                                 <span className="font-semibold">{draftEvents}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                 <span className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS.cancelado}`} />
                                    Cancelados
                                 </span>
                                 <span className="font-semibold">{cancelledEvents}</span>
                              </div>
                           </CardContent>
                        </Card>
                     </motion.div>

                     {/* Events by Type */}
                     <motion.div variants={item} className="h-full">
                        <Card className="h-full">
                           <CardHeader>
                              <CardTitle>Eventos por Tipo</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                 <span className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${TIPO_DOTS.presencial}`} />
                                    Presencial
                                 </span>
                                 <span className="font-semibold">{eventsByType.presencial}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                 <span className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${TIPO_DOTS.online}`} />
                                    Online
                                 </span>
                                 <span className="font-semibold">{eventsByType.online}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                 <span className="flex items-center gap-2 text-sm">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${TIPO_DOTS.hibrido}`} />
                                    Híbrido
                                 </span>
                                 <span className="font-semibold">{eventsByType.hibrido}</span>
                              </div>
                           </CardContent>
                        </Card>
                     </motion.div>

                     {/* Events by Category */}
                     <motion.div variants={item} className="h-full">
                        <Card className="h-full">
                           <CardHeader>
                              <CardTitle>Eventos por Categoria</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-1">
                              {eventsByCategory.map((itemCategoria) => {
                                 const maxCount = Math.max(
                                    ...eventsByCategory.map((i) => i.count),
                                    1,
                                 )
                                 return (
                                    <div
                                       key={itemCategoria.categoria}
                                       className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50"
                                    >
                                       <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <div className={`w-3 h-3 rounded-full shrink-0 ${itemCategoria.cor}`} />
                                          <span className="text-sm truncate">{itemCategoria.categoria}</span>
                                       </div>
                                       <div className="flex items-center gap-2 w-24 shrink-0">
                                          <div className="h-1.5 rounded-full bg-muted flex-1 overflow-hidden">
                                             <div
                                                className={`h-full rounded-full ${itemCategoria.cor}`}
                                                style={{
                                                   width: `${
                                                      itemCategoria.count === 0
                                                         ? 0
                                                         : Math.max(100 * (itemCategoria.count / maxCount), 2)
                                                   }%`,
                                                }}
                                             />
                                          </div>
                                          <span className="text-xs font-semibold w-5 text-right">
                                             {itemCategoria.count}
                                          </span>
                                       </div>
                                    </div>
                                 )
                              })}
                           </CardContent>
                        </Card>
                     </motion.div>

                     {/* Calendário de Eventos */}
                     <motion.div variants={item} className="h-full">
                        <Card className="h-full">
                           <CardHeader>
                              <CardTitle as="h2">Calendário de Eventos</CardTitle>
                              <CardDescription>Selecione um dia para ver os eventos</CardDescription>
                           </CardHeader>
                           <CardContent>
                              <CalendarView
                                 layout="stack"
                                 events={events}
                                 selectedDate={selectedDate}
                                 onSelectDate={setSelectedDate}
                                 onEventClick={handleEventClick}
                              />
                           </CardContent>
                         </Card>
                      </motion.div>
                  </motion.div>
               </TabsContent>

               {/* Events Tab */}
               <TabsContent value="events">
                  <AdminEventos
                     events={events}
                     categorias={categorias}
                     // locais={locais}
                     onNewEvent={onNewEvent}
                     onEditEvent={onEditEvent}
                     onDeleteEvent={onDeleteEvent}
                     onPublicarEvent={onPublicarEvent}
                     onCancelarEvent={onCancelarEvent}
                  />
               </TabsContent>

               {/* Usuários Tab */}
               <TabsContent value="locations">
                  {/* <AdminLocais locais={locais} onUpdateLocais={onUpdateLocais} events={events} /> */}
                  <AdminUsuarios
                     // usuarios={[
                     //    {
                     //       id: '1',
                     //       nome: 'Teste',
                     //       email: 'teste@email.com',
                     //       tipo: 'admin',
                     //       status: 'ativo',
                     //       dataCadastro: 'string',
                     //       ultimoAcesso: 'strin',
                     //    },
                     // ]}
                     onEditUsuario={() => {}}
                     onDeleteUsuario={() => {}}
                     onToggleStatus={() => {}}
                  />
               </TabsContent>

               {/* Categories Tab */}
               <TabsContent value="categories">
                  <AdminCategorias events={events} />
               </TabsContent>
            </Tabs>
         </div>

         <section className="container mx-auto px-4 mb-12">
            <div className="h-0.5 mt-5 mb-5 bg-gray-200 rounded-2xl"></div>
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
            <MapView events={events} categorias={categorias} onEventClick={handleEventClick} />
         </section>

         {/* Modal de detalhes do evento (aberto pelo calendário ou pelo mapa) */}
         {selectedEvent && (
            <EventDetails
               event={selectedEvent}
               categoria={categorias.find((c) => c.id === selectedEvent.categoriaId) ?? null}
               onClose={() => setSelectedEvent(null)}
               onEdit={onEditEvent}
               onDelete={onDeleteEvent}
            />
         )}

         <Footer />
      </div>
   )
}
