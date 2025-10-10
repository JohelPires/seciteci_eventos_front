import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { motion, AnimatePresence } from 'framer-motion'

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
   lat?: number
   lng?: number
}

interface EventFormProps {
   onSubmit: (event: Omit<Event, 'id'>) => void
   onClose: () => void
   editingEvent?: Event | null
}

export function EventForm({ onSubmit, onClose, editingEvent }: EventFormProps) {
   const [formData, setFormData] = useState({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: '',
      capacity: '',
      image: '',
      lat: '',
      lng: '',
   })

   useEffect(() => {
      if (editingEvent) {
         setFormData({
            title: editingEvent.title,
            description: editingEvent.description,
            date: editingEvent.date,
            time: editingEvent.time,
            location: editingEvent.location,
            category: editingEvent.category,
            capacity: editingEvent.capacity.toString(),
            image: editingEvent.image || '',
            lat: editingEvent.lat?.toString() || '',
            lng: editingEvent.lng?.toString() || '',
         })
      }
   }, [editingEvent])

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit({
         title: formData.title,
         description: formData.description,
         date: formData.date,
         time: formData.time,
         location: formData.location,
         category: formData.category,
         capacity: parseInt(formData.capacity),
         image: formData.image || undefined,
         lat: formData.lat ? parseFloat(formData.lat) : undefined,
         lng: formData.lng ? parseFloat(formData.lng) : undefined,
      })

      setFormData({
         title: '',
         description: '',
         date: '',
         time: '',
         location: '',
         category: '',
         capacity: '',
         image: '',
         lat: '',
         lng: '',
      })
   }

   const categories = [
      { value: 'Tecnologia', color: 'bg-blue-600' },
      { value: 'Negócios', color: 'bg-slate-700' },
      { value: 'Educação', color: 'bg-indigo-600' },
      { value: 'Entretenimento', color: 'bg-purple-600' },
      { value: 'Esportes', color: 'bg-orange-600' },
      { value: 'Cultura', color: 'bg-teal-600' },
      { value: 'Saúde', color: 'bg-green-600' },
   ]

   return (
      <AnimatePresence>
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               transition={{ duration: 0.2, ease: 'easeOut' }}
               className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-border"
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
               <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-90px)]">
                  {/* Image Preview */}
                  {formData.image && (
                     <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="relative rounded-lg overflow-hidden h-48 border border-border"
                     >
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                     </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Title - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="title">Título do Evento*</Label>
                        <Input
                           id="title"
                           placeholder="Ex: Conferência Anual de Tecnologia"
                           value={formData.title}
                           onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                           required
                        />
                     </div>

                     {/* Description - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Descrição*</Label>
                        <Textarea
                           id="description"
                           placeholder="Descreva os principais pontos do evento..."
                           value={formData.description}
                           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                           required
                           rows={4}
                           className="resize-none"
                        />
                     </div>

                     {/* Category */}
                     <div className="space-y-2">
                        <Label htmlFor="category">Categoria*</Label>
                        <Select
                           value={formData.category}
                           onValueChange={(value) => setFormData({ ...formData, category: value })}
                           required
                        >
                           <SelectTrigger id="category">
                              <SelectValue placeholder="Selecione uma categoria" />
                           </SelectTrigger>
                           <SelectContent>
                              {categories.map((cat) => (
                                 <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center gap-2">
                                       <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                                       {cat.value}
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Capacity */}
                     <div className="space-y-2">
                        <Label htmlFor="capacity">Capacidade*</Label>
                        <Input
                           id="capacity"
                           type="number"
                           min="1"
                           placeholder="Ex: 100"
                           value={formData.capacity}
                           onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                           required
                        />
                     </div>

                     {/* Date */}
                     <div className="space-y-2">
                        <Label htmlFor="date">Data*</Label>
                        <Input
                           id="date"
                           type="date"
                           value={formData.date}
                           onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                           required
                        />
                     </div>

                     {/* Time */}
                     <div className="space-y-2">
                        <Label htmlFor="time">Horário*</Label>
                        <Input
                           id="time"
                           type="time"
                           value={formData.time}
                           onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                           required
                        />
                     </div>

                     {/* Location - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="location">Local*</Label>
                        <Input
                           id="location"
                           placeholder="Ex: Centro de Convenções, Av. Paulista, 1000"
                           value={formData.location}
                           onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                           required
                        />
                     </div>

                     {/* Latitude */}
                     <div className="space-y-2">
                        <Label htmlFor="lat">Latitude (opcional)</Label>
                        <Input
                           id="lat"
                           type="number"
                           step="any"
                           placeholder="Ex: -23.5505"
                           value={formData.lat}
                           onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Para visualização no mapa</p>
                     </div>

                     {/* Longitude */}
                     <div className="space-y-2">
                        <Label htmlFor="lng">Longitude (opcional)</Label>
                        <Input
                           id="lng"
                           type="number"
                           step="any"
                           placeholder="Ex: -46.6333"
                           value={formData.lng}
                           onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Para visualização no mapa</p>
                     </div>

                     {/* Image URL - Full Width */}
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="image" className="flex items-center gap-2">
                           <ImageIcon className="w-4 h-4" />
                           URL da Imagem (opcional)
                        </Label>
                        <Input
                           id="image"
                           type="url"
                           placeholder="https://exemplo.com/imagem-evento.jpg"
                           value={formData.image}
                           onChange={(e) => setFormData({ ...formData, image: e.target.value })}
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
