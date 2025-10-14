import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { motion, AnimatePresence } from 'framer-motion'

import type { Event, Categoria, Local } from '@/app/page'
import { useAuth } from '@/context/AuthContext'

interface EventFormProps {
   onSubmit: (event: Omit<Event, 'id'>) => void
   onClose: () => void
   editingEvent?: Event | null
   categorias: Categoria[]
   locais: Local[]
}

export function EventForm({ onSubmit, onClose, editingEvent, categorias, locais }: EventFormProps) {
   const [formData, setFormData] = useState({
      titulo: '',
      descricao: '',
      categoriaId: '',
      localId: '',
      dataInicio: '',
      dataFim: '',
      horarioAbertura: '',
      horarioEncerramento: '',
      capacidadeMaxima: '',
      tipoEvento: 'presencial' as 'presencial' | 'online' | 'hibrido',
      linkOnline: '',
      imagemCapa: '',
      status: 'rascunho' as 'rascunho' | 'publicado' | 'cancelado',
      publicoAlvo: '',
      requisitos: '',
   })

   const { isAuthenticated, user, logout } = useAuth()

   useEffect(() => {
      if (editingEvent) {
         setFormData({
            titulo: editingEvent.titulo,
            descricao: editingEvent.descricao,
            categoriaId: editingEvent.categoriaId.toString(),
            localId: editingEvent.localId.toString(),
            dataInicio: editingEvent.dataInicio.substring(0, 16), // Format for datetime-local
            dataFim: editingEvent.dataFim.substring(0, 16),
            horarioAbertura: editingEvent.horarioAbertura,
            horarioEncerramento: editingEvent.horarioEncerramento,
            capacidadeMaxima: editingEvent.capacidadeMaxima.toString(),
            tipoEvento: editingEvent.tipoEvento,
            linkOnline: editingEvent.linkOnline || '',
            imagemCapa: editingEvent.imagemCapa || '',
            status: editingEvent.status,
            publicoAlvo: editingEvent.publicoAlvo || '',
            requisitos: editingEvent.requisitos || '',
         })
      }
   }, [editingEvent])

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      const eventData: Omit<Event, 'id'> = {
         titulo: formData.titulo,
         descricao: formData.descricao,
         categoriaId: parseInt(formData.categoriaId),
         localId: parseInt(formData.localId),
         dataInicio: new Date(formData.dataInicio).toISOString(),
         dataFim: new Date(formData.dataFim).toISOString(),
         horarioAbertura: formData.horarioAbertura,
         horarioEncerramento: formData.horarioEncerramento,
         capacidadeMaxima: parseInt(formData.capacidadeMaxima),
         tipoEvento: formData.tipoEvento,
         status: formData.status,
         local: null,
         categoria: null,
         // Os campos abaixo são opcionais na interface 'Event'.
         // A forma mais limpa de lidar com eles é incluir no objeto
         // apenas se tiverem um valor.
         ...(formData.linkOnline && { linkOnline: formData.linkOnline }),
         ...(formData.imagemCapa && { imagemCapa: formData.imagemCapa }),
         ...(formData.publicoAlvo && { publicoAlvo: formData.publicoAlvo }),
         ...(formData.requisitos && { requisitos: formData.requisitos }),
      }

      onSubmit(eventData)

      // Limpar o formulário
      setFormData({
         titulo: '',
         descricao: '',
         categoriaId: '',
         localId: '',
         dataInicio: '',
         dataFim: '',
         horarioAbertura: '',
         horarioEncerramento: '',
         capacidadeMaxima: '',
         tipoEvento: 'presencial',
         linkOnline: '',
         imagemCapa: '',
         status: 'rascunho',
         publicoAlvo: '',
         requisitos: '',
      })
   }

   return (
      <AnimatePresence>
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               transition={{ duration: 0.2, ease: 'easeOut' }}
               className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border"
            >
               {/* Header */}
               <div className="px-6 py-5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-primary">
                           <CalendarIcon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                           <h2>{editingEvent ? 'Editar Evento' : 'Criar Novo Evento'}</h2>
                           <p className="text-sm text-muted-foreground">Preencha os detalhes do evento</p>
                        </div>
                     </div>
                     <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="w-5 h-5" />
                     </Button>
                  </div>
               </div>

               {/* Form Content */}
               <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Image Preview */}
                  {formData.imagemCapa && (
                     <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="relative rounded-lg overflow-hidden h-48 border border-border"
                     >
                        <img src={formData.imagemCapa} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                     </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Title - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="titulo">Título do Evento*</Label>
                        <Input
                           id="titulo"
                           placeholder="Ex: Workshop de Node.js"
                           value={formData.titulo}
                           onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                           required
                        />
                     </div>

                     {/* Description - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="descricao">Descrição*</Label>
                        <Textarea
                           id="descricao"
                           placeholder="Descreva os principais pontos do evento..."
                           value={formData.descricao}
                           onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                           required
                           rows={4}
                           className="resize-none"
                        />
                     </div>

                     {/* Category */}
                     <div className="space-y-2">
                        <Label htmlFor="categoriaId">Categoria*</Label>
                        <Select
                           value={formData.categoriaId}
                           onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
                           required
                        >
                           <SelectTrigger id="categoriaId">
                              <SelectValue placeholder="Selecione uma categoria" />
                           </SelectTrigger>
                           <SelectContent>
                              {categorias.map((cat) => (
                                 <SelectItem key={cat.id} value={cat.id.toString()}>
                                    <div className="flex items-center gap-2">
                                       <div className={`w-3 h-3 rounded-full ${cat.cor}`} />
                                       {cat.nome}
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Local */}
                     <div className="space-y-2">
                        <Label htmlFor="localId">Local*</Label>
                        <Select
                           value={formData.localId}
                           onValueChange={(value) => setFormData({ ...formData, localId: value })}
                           required
                        >
                           <SelectTrigger id="localId">
                              <SelectValue placeholder="Selecione um local" />
                           </SelectTrigger>
                           <SelectContent>
                              {locais.map((local) => (
                                 <SelectItem key={local.id} value={local.id.toString()}>
                                    {local.nome} - {local.cidade}, {local.estado}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Start Date */}
                     <div className="space-y-2">
                        <Label htmlFor="dataInicio">Data de Início*</Label>
                        <Input
                           id="dataInicio"
                           type="date"
                           value={formData.dataInicio}
                           onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                           required
                        />
                     </div>

                     {/* End Date */}
                     <div className="space-y-2">
                        <Label htmlFor="dataFim">Data de Término*</Label>
                        <Input
                           id="dataFim"
                           type="date"
                           value={formData.dataFim}
                           onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                           required
                        />
                     </div>

                     {/* Opening Time */}
                     <div className="space-y-2">
                        <Label htmlFor="horarioAbertura">Horário de Abertura*</Label>
                        <Input
                           id="horarioAbertura"
                           type="time"
                           value={formData.horarioAbertura}
                           onChange={(e) => setFormData({ ...formData, horarioAbertura: e.target.value })}
                           required
                        />
                     </div>

                     {/* Closing Time */}
                     <div className="space-y-2">
                        <Label htmlFor="horarioEncerramento">Horário de Encerramento*</Label>
                        <Input
                           id="horarioEncerramento"
                           type="time"
                           value={formData.horarioEncerramento}
                           onChange={(e) => setFormData({ ...formData, horarioEncerramento: e.target.value })}
                           required
                        />
                     </div>

                     {/* Capacity */}
                     <div className="space-y-2">
                        <Label htmlFor="capacidadeMaxima">Capacidade Máxima*</Label>
                        <Input
                           id="capacidadeMaxima"
                           type="number"
                           min="1"
                           placeholder="Ex: 50"
                           value={formData.capacidadeMaxima}
                           onChange={(e) => setFormData({ ...formData, capacidadeMaxima: e.target.value })}
                           required
                        />
                     </div>

                     {/* Event Type */}
                     <div className="space-y-2">
                        <Label htmlFor="tipoEvento">Tipo de Evento*</Label>
                        <Select
                           value={formData.tipoEvento}
                           onValueChange={(value: 'presencial' | 'online' | 'hibrido') =>
                              setFormData({ ...formData, tipoEvento: value })
                           }
                           required
                        >
                           <SelectTrigger id="tipoEvento">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="presencial">Presencial</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="hibrido">Híbrido</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Status */}
                     {user?.tipoUsuario === 'admin' && (
                        <div className="space-y-2">
                           <Label htmlFor="status">Status*</Label>
                           <Select
                              value={formData.status}
                              onValueChange={(value: 'rascunho' | 'publicado' | 'cancelado') =>
                                 setFormData({ ...formData, status: value })
                              }
                              required
                           >
                              <SelectTrigger id="status">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="rascunho">Rascunho</SelectItem>
                                 <SelectItem value="publicado">Publicado</SelectItem>
                                 <SelectItem value="cancelado">Cancelado</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     )}

                     {/* Online Link - Full Width */}
                     {(formData.tipoEvento === 'online' || formData.tipoEvento === 'hibrido') && (
                        <div className="space-y-2 md:col-span-2">
                           <Label htmlFor="linkOnline">Link Online</Label>
                           <Input
                              id="linkOnline"
                              type="url"
                              placeholder="https://meet.google.com/abc-defg-hij"
                              value={formData.linkOnline}
                              onChange={(e) => setFormData({ ...formData, linkOnline: e.target.value })}
                           />
                        </div>
                     )}

                     {/* Target Audience - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="publicoAlvo">Público Alvo</Label>
                        <Input
                           id="publicoAlvo"
                           placeholder="Ex: Desenvolvedores iniciantes e intermediários"
                           value={formData.publicoAlvo}
                           onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
                        />
                     </div>

                     {/* Requirements - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="requisitos">Requisitos</Label>
                        <Textarea
                           id="requisitos"
                           placeholder="Ex: Notebook próprio e conhecimento básico de JavaScript"
                           value={formData.requisitos}
                           onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                           rows={3}
                           className="resize-none"
                        />
                     </div>

                     {/* Image URL - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="imagemCapa" className="flex items-center gap-2">
                           <ImageIcon className="w-4 h-4" />
                           URL da Imagem de Capa (opcional)
                        </Label>
                        <Input
                           id="imagemCapa"
                           type="url"
                           placeholder="https://exemplo.com/imagem-evento.jpg"
                           value={formData.imagemCapa}
                           onChange={(e) => setFormData({ ...formData, imagemCapa: e.target.value })}
                        />
                     </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                     <Button type="submit" className="flex-1" size="lg">
                        {editingEvent ? 'Atualizar Evento' : 'Criar Evento'}
                     </Button>
                     <Button type="button" variant="outline" onClick={onClose} size="lg">
                        Cancelar
                     </Button>
                  </div>
               </form>
            </motion.div>
         </div>
      </AnimatePresence>
   )
}
