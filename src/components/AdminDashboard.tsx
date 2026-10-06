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
import { motion } from 'framer-motion'
import type { Event, Categoria, Local } from '@/app/page'
import { useAuth } from '@/context/AuthContext'
import { Footer } from './Footer'
import { AdminUsuarios } from './AdminUsuarios'
import { MapView } from './MapView'
import { UserBadge } from './UserBadge'

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

   const { user } = useAuth()

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

   // Recent events (last 5), do mais recentemente criado para o mais antigo
   const recentEvents = [...events]
      .sort(
         (a, b) => (new Date(b.dataCriacao ?? 0).getTime() || 0) - (new Date(a.dataCriacao ?? 0).getTime() || 0),
      )
      .slice(0, 4)

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
                     <UserBadge nome={user.nome} fotoPerfil={user.fotoPerfil} papel={user.tipoUsuario} />
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
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                     <Card>
                        <CardHeader className="pb-3">
                           <CardDescription>Total de Eventos</CardDescription>
                           <CardTitle className="text-3xl">{totalEvents}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>Todos os status</span>
                           </div>
                        </CardContent>
                     </Card>

                     <Card>
                        <CardHeader className="pb-3">
                           <CardDescription>Eventos Publicados</CardDescription>
                           <CardTitle className="text-3xl text-green-600">{publishedEvents}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TrendingUp className="w-4 h-4" />
                              <span>
                                 {totalEvents > 0 ? Math.round((publishedEvents / totalEvents) * 100) : 0}% do total
                              </span>
                           </div>
                        </CardContent>
                     </Card>

                     <Card>
                        <CardHeader className="pb-3">
                           <CardDescription>Vagas Totais</CardDescription>
                           <CardTitle className="text-3xl">{totalCapacity.toLocaleString()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>Média: {averageCapacity} pessoas</span>
                           </div>
                        </CardContent>
                     </Card>

                     <Card>
                        <CardHeader className="pb-3">
                           <CardDescription>Categorias Ativas</CardDescription>
                           <CardTitle className="text-3xl">{categorias.length}</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Tag className="w-4 h-4" />
                              {/* <span>{locais.length} locais cadastrados</span> */}
                           </div>
                        </CardContent>
                     </Card>
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Events by Status */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                     >
                        <Card>
                           <CardHeader>
                              <CardTitle>Eventos por Status</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-sky-950/30 rounded-lg">
                                 <span className="text-sm">Publicados</span>
                                 <span className="font-semibold">{publishedEvents}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-yellow-950/30 rounded-lg">
                                 <span className="text-sm">Pendentes</span>
                                 <span className="font-semibold">{draftEvents}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-red-950/30 rounded-lg">
                                 <span className="text-sm">Cancelados</span>
                                 <span className="font-semibold">{cancelledEvents}</span>
                              </div>
                           </CardContent>
                        </Card>
                     </motion.div>

                     {/* Events by Type */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                     >
                        <Card>
                           <CardHeader>
                              <CardTitle>Eventos por Tipo</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                                 <span className="text-sm">Presencial</span>
                                 <span className="font-semibold">{eventsByType.presencial}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-purple-950/30 rounded-lg">
                                 <span className="text-sm">Online</span>
                                 <span className="font-semibold">{eventsByType.online}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-teal-950/30 rounded-lg">
                                 <span className="text-sm">Híbrido</span>
                                 <span className="font-semibold">{eventsByType.hibrido}</span>
                              </div>
                           </CardContent>
                        </Card>
                     </motion.div>

                     {/* Events by Category */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                     >
                        <Card>
                           <CardHeader>
                              <CardTitle>Eventos por Categoria</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-2">
                              {eventsByCategory.map((item, index) => (
                                 <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                                 >
                                    <div className="flex items-center gap-2">
                                       <div className={`w-3 h-3 rounded-full ${item.cor}`} />
                                       <span className="text-sm">{item.categoria}</span>
                                    </div>
                                    <span className="font-semibold">{item.count}</span>
                                 </div>
                              ))}
                           </CardContent>
                        </Card>
                     </motion.div>

                     {/* Recent Events */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                     >
                        <Card>
                           <CardHeader>
                              <CardTitle>Eventos Recentes</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-3">
                              {recentEvents.length > 0 ? (
                                 recentEvents.map((event) => (
                                    <div key={event.id} className="p-1 border-b">
                                       <p className="font-medium text-sm">{event.titulo}</p>
                                       <p className="text-xs text-muted-foreground mt-1">
                                          {new Date(event.dataInicio).toLocaleDateString('pt-BR')}
                                       </p>
                                    </div>
                                 ))
                              ) : (
                                 <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhum evento cadastrado
                                 </p>
                              )}
                           </CardContent>
                        </Card>
                     </motion.div>
                  </div>
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

         <Footer />
      </div>
   )
}
