import { useState, useEffect } from 'react'
import {
   X,
   Calendar as CalendarIcon,
   Image as ImageIcon,
   MapPin,
   FileText,
   Link as LinkIcon,
   ChevronRight,
   ChevronLeft,
   Check,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import type { Event, Categoria } from '@/app/page'

interface EventFormProps {
   onSubmit: (event: Omit<Event, 'id'>) => void
   onClose: () => void
   editingEvent?: Event | null
   categorias: Categoria[]
}

export function EventForm({ onSubmit, onClose, editingEvent, categorias }: EventFormProps) {
   const MAX_DESCRICAO_CHARS = 250 // Aproximadamente 5 linhas
   const MAX_PUBLICO_ALVO_CHARS = 150 // Aproximadamente 2-3 linhas
   const MAX_REQUISITOS_CHARS = 150 // Aproximadamente 2-3 linhas
   const [currentStep, setCurrentStep] = useState(1)
   const totalSteps = 4

   const [formData, setFormData] = useState({
      titulo: '',
      descricao: '',
      categoriaId: '',
      organizadorId: '',
      dataInicio: '',
      dataFim: '',
      horarioAbertura: '',
      horarioEncerramento: '',
      capacidadeMaxima: '',
      vagasDisponiveis: '',

      tipoEvento: 'presencial' as 'presencial' | 'online' | 'hibrido',
      linkOnline: '',
      LocalLinkGoogleMaps: '',
      LocalNome: '',
      LocalEndereco: '',
      LocalNumero: '',
      LocalComplemento: '',
      LocalBairro: '',
      LocalCidade: '',
      LocalEstado: '',
      LocalCep: '',
      LocalPais: 'Brasil',
      LocalCapacidade: '',
      LocalLatitude: '',
      LocalLongitude: '',
      LocalObservacoes: '',
      linkPaginaEvento: '',
      imagemCapa: '',
      status: 'rascunho' as 'rascunho' | 'publicado' | 'cancelado',
      publicoAlvo: '',
      requisitos: '',
   })

   // Função para extrair coordenadas do link do Google Maps
   const extractCoordinatesFromGoogleMaps = (url: string) => {
      if (!url) return { latitude: '', longitude: '' }

      try {
         // Padrão 1: maps.google.com/?q=lat,lng
         const qParamMatch = url.match(/[?&]q=([-]?\d+\.\d+),([-]?\d+\.\d+)/)
         if (qParamMatch) {
            return {
               latitude: qParamMatch[1],
               longitude: qParamMatch[2],
            }
         }

         // Padrão 2: google.com/maps/place/@lat,lng
         const placeMatch = url.match(/@([-]?\d+\.\d+),([-]?\d+\.\d+)/)
         if (placeMatch) {
            return {
               latitude: placeMatch[1],
               longitude: placeMatch[2],
            }
         }

         // Padrão 3: google.com/maps?ll=lat,lng
         const llParamMatch = url.match(/[?&]ll=([-]?\d+\.\d+),([-]?\d+\.\d+)/)
         if (llParamMatch) {
            return {
               latitude: llParamMatch[1],
               longitude: llParamMatch[2],
            }
         }

         // Padrão 4: maps.app.goo.gl (short URL) - precisamos obter a URL completa
         if (url.includes('maps.app.goo.gl')) {
            // Em uma aplicação real, você pode querer fazer uma requisição para obter a URL completa
            // Por enquanto, vamos apenas retornar vazio
            console.log('URL encurtada detectada. Em produção, considere expandir a URL para extrair coordenadas.')
            return { latitude: '', longitude: '' }
         }

         return { latitude: '', longitude: '' }
      } catch (error) {
         console.error('Erro ao extrair coordenadas do Google Maps:', error)
         return { latitude: '', longitude: '' }
      }
   }

   // Função para lidar com a mudança do link do Google Maps
   const handleGoogleMapsLinkChange = (url: string) => {
      setFormData((prev) => ({ ...prev, LocalLinkGoogleMaps: url }))

      // Extrair coordenadas automaticamente
      const coordinates = extractCoordinatesFromGoogleMaps(url)
      if (coordinates.latitude && coordinates.longitude) {
         setFormData((prev) => ({
            ...prev,
            LocalLinkGoogleMaps: url,
            LocalLatitude: coordinates.latitude,
            LocalLongitude: coordinates.longitude,
         }))
      }
   }

   // Função para validar e formatar coordenadas manualmente
   const handleCoordinateChange = (field: 'LocalLatitude' | 'LocalLongitude', value: string) => {
      // Permitir apenas números, ponto decimal e sinal negativo
      const cleanedValue = value.replace(/[^\d.-]/g, '')

      // Validar formato de coordenada
      const coordinateRegex = /^-?\d+(\.\d+)?$/
      if (cleanedValue === '' || coordinateRegex.test(cleanedValue)) {
         setFormData((prev) => ({ ...prev, [field]: cleanedValue }))
      }
   }

   useEffect(() => {
      if (editingEvent) {
         setFormData({
            titulo: editingEvent.titulo,
            descricao: editingEvent.descricao,
            categoriaId: editingEvent.categoriaId.toString(),
            organizadorId: editingEvent.organizadorId?.toString() || '',
            dataInicio: editingEvent.dataInicio.substring(0, 16),
            dataFim: editingEvent.dataFim.substring(0, 16),
            horarioAbertura: editingEvent.horarioAbertura || '',
            horarioEncerramento: editingEvent.horarioEncerramento || '',
            capacidadeMaxima: editingEvent.capacidadeMaxima.toString(),
            vagasDisponiveis: editingEvent.vagasDisponiveis?.toString() || editingEvent.capacidadeMaxima.toString(),
            tipoEvento: editingEvent.tipoEvento,
            linkOnline: editingEvent.linkOnline || '',
            LocalLinkGoogleMaps: editingEvent.LocalLinkGoogleMaps || '',
            LocalNome: editingEvent.LocalNome || '',
            LocalEndereco: editingEvent.LocalEndereco || '',
            LocalNumero: editingEvent.LocalNumero || '',
            LocalComplemento: editingEvent.LocalComplemento || '',
            LocalBairro: editingEvent.LocalBairro || '',
            LocalCidade: editingEvent.LocalCidade || '',
            LocalEstado: editingEvent.LocalEstado || '',
            LocalCep: editingEvent.LocalCep || '',
            LocalPais: editingEvent.LocalPais || 'Brasil',
            LocalCapacidade: editingEvent.LocalCapacidade?.toString() || '',
            LocalLatitude: editingEvent.LocalLatitude || '',
            LocalLongitude: editingEvent.LocalLongitude || '',
            LocalObservacoes: editingEvent.LocalObservacoes || '',
            linkPaginaEvento: editingEvent.linkPaginaEvento || '',
            imagemCapa: editingEvent.imagemCapa || '',
            status: editingEvent.status,
            publicoAlvo: editingEvent.publicoAlvo || '',
            requisitos: editingEvent.requisitos || '',
         })
      }
   }, [editingEvent])

   useEffect(() => {
      console.log('formData:', formData)
   }, [formData])

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      if (currentStep !== totalSteps) {
         return
      }

      onSubmit({
         titulo: formData.titulo,
         descricao: formData.descricao,
         categoriaId: parseInt(formData.categoriaId),
         organizadorId: formData.organizadorId ? parseInt(formData.organizadorId) : undefined,
         dataInicio: new Date(formData.dataInicio).toISOString(),
         dataFim: new Date(formData.dataFim).toISOString(),
         horarioAbertura: formData.horarioAbertura,
         horarioEncerramento: formData.horarioEncerramento,
         capacidadeMaxima: formData.capacidadeMaxima ? parseInt(formData.capacidadeMaxima) : 100,
         vagasDisponiveis: formData.vagasDisponiveis
            ? parseInt(formData.vagasDisponiveis)
            : formData.capacidadeMaxima
            ? parseInt(formData.capacidadeMaxima)
            : 100,
         tipoEvento: formData.tipoEvento,
         linkOnline: formData.linkOnline || undefined,
         LocalLinkGoogleMaps: formData.LocalLinkGoogleMaps || undefined,
         LocalNome: formData.LocalNome || undefined,
         LocalEndereco: formData.LocalEndereco || undefined,
         LocalNumero: formData.LocalNumero || undefined,
         LocalComplemento: formData.LocalComplemento || undefined,
         LocalBairro: formData.LocalBairro || undefined,
         LocalCidade: formData.LocalCidade || undefined,
         LocalEstado: formData.LocalEstado || undefined,
         LocalCep: formData.LocalCep || undefined,
         LocalPais: formData.LocalPais || undefined,
         LocalCapacidade: formData.LocalCapacidade ? parseInt(formData.LocalCapacidade) : undefined,
         LocalLatitude: formData.LocalLatitude || undefined,
         LocalLongitude: formData.LocalLongitude || undefined,
         LocalObservacoes: formData.LocalObservacoes || undefined,
         linkPaginaEvento: formData.linkPaginaEvento || undefined,
         imagemCapa: formData.imagemCapa || undefined,
         status: 'rascunho',
         publicoAlvo: formData.publicoAlvo || undefined,
         requisitos: formData.requisitos || undefined,
         categoria: null,
      })

      setFormData({
         titulo: '',
         descricao: '',
         categoriaId: '',
         organizadorId: '',
         dataInicio: '',
         dataFim: '',
         horarioAbertura: '',
         horarioEncerramento: '',
         capacidadeMaxima: '',
         vagasDisponiveis: '',
         tipoEvento: 'presencial',
         linkOnline: '',
         LocalLinkGoogleMaps: '',
         LocalNome: '',
         LocalEndereco: '',
         LocalNumero: '',
         LocalComplemento: '',
         LocalBairro: '',
         LocalCidade: '',
         LocalEstado: '',
         LocalCep: '',
         LocalPais: 'Brasil',
         LocalCapacidade: '',
         LocalLatitude: '',
         LocalLongitude: '',
         LocalObservacoes: '',
         linkPaginaEvento: '',
         imagemCapa: '',
         status: 'rascunho',
         publicoAlvo: '',
         requisitos: '',
      })
   }

   const nextStep = () => {
      if (currentStep < totalSteps) {
         setCurrentStep(currentStep + 1)
      }
   }

   const prevStep = () => {
      if (currentStep > 1) {
         setCurrentStep(currentStep - 1)
      }
   }

   const canProceed = () => {
      switch (currentStep) {
         case 1:
            return formData.titulo && formData.descricao && formData.categoriaId
         case 2:
            return formData.dataInicio && formData.dataFim && formData.horarioAbertura && formData.horarioEncerramento
         case 3:
            // Campos de local são opcionais
            return true
         case 4:
            // Campos de mídia são opcionais
            return false
         default:
            return true
      }
   }

   const steps = [
      { number: 1, title: 'Informações Básicas', icon: FileText },
      { number: 2, title: 'Detalhes do Evento', icon: CalendarIcon },
      { number: 3, title: 'Informações do Local', icon: MapPin },
      { number: 4, title: 'Mídia e Links', icon: ImageIcon },
   ]

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
                           <p className="text-sm text-muted-foreground">
                              Passo {currentStep} de {totalSteps}: {steps[currentStep - 1].title}
                           </p>
                        </div>
                     </div>
                     <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="w-5 h-5" />
                     </Button>
                  </div>

                  {/* Steps Indicator */}
                  <div className="mt-6">
                     <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                           const Icon = step.icon
                           const isCompleted = currentStep > step.number
                           const isCurrent = currentStep === step.number

                           return (
                              <div key={step.number} className="flex items-center flex-1">
                                 <div className="flex flex-col items-center gap-2">
                                    <div
                                       className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                          isCompleted
                                             ? 'bg-[#143373] text-white'
                                             : isCurrent
                                             ? 'bg-[#143373] text-white ring-4 ring-[#143373]/20'
                                             : 'bg-muted text-muted-foreground'
                                       }`}
                                    >
                                       {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                    </div>
                                    <span
                                       className={`text-xs hidden md:block ${
                                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                                       }`}
                                    >
                                       {step.title}
                                    </span>
                                 </div>
                                 {index < steps.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-2 bg-border">
                                       <div
                                          className="h-full bg-[#143373] transition-all duration-300"
                                          style={{ width: isCompleted ? '100%' : '0%' }}
                                       />
                                    </div>
                                 )}
                              </div>
                           )
                        })}
                     </div>
                  </div>
               </div>

               {/* Form Content */}
               <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-200px)]">
                  <div className="p-6 space-y-6 overflow-y-auto flex-1">
                     {/* Step 1: Informações Básicas */}
                     {currentStep === 1 && (
                        <motion.div
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                           className="space-y-6"
                        >
                           <div>
                              <h3 className="mb-1">Informações Básicas do Evento</h3>
                              <p className="text-sm text-muted-foreground">
                                 Preencha os dados principais do seu evento
                              </p>
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {/* Title - Full Width */}
                              <div className="space-y-2">
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
                                 <Label htmlFor="descricao">
                                    Descrição*
                                    <span className="text-xs text-muted-foreground ml-2">
                                       ({formData.descricao.length}/{MAX_DESCRICAO_CHARS})
                                    </span>
                                 </Label>
                                 <Textarea
                                    id="descricao"
                                    placeholder="Descreva os principais pontos do evento..."
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    required
                                    rows={4}
                                    className={`resize-none ${
                                       formData.descricao.length > MAX_DESCRICAO_CHARS
                                          ? 'border-red-500 focus-visible:ring-red-500'
                                          : ''
                                    }`}
                                 />
                                 {formData.descricao.length > MAX_DESCRICAO_CHARS && (
                                    <p className="text-xs text-red-500 mt-1">
                                       A descrição excedeu o limite de {MAX_DESCRICAO_CHARS} caracteres
                                    </p>
                                 )}
                              </div>

                              {/* Category - Full Width */}
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
                           </div>
                        </motion.div>
                     )}

                     {/* Step 2: Detalhes do Evento */}
                     {currentStep === 2 && (
                        <motion.div
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                           className="space-y-6"
                        >
                           <div>
                              <h3 className="mb-1">Detalhes do Evento</h3>
                              <p className="text-sm text-muted-foreground">
                                 Configure datas, horários e informações adicionais
                              </p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                              {/* Target Audience - Full Width */}
                              <div className="space-y-2 md:col-span-2">
                                 <Label htmlFor="publicoAlvo">
                                    Público Alvo
                                    <span className="text-xs text-muted-foreground ml-2">
                                       ({formData.publicoAlvo.length}/{MAX_PUBLICO_ALVO_CHARS})
                                    </span>
                                 </Label>
                                 <Input
                                    id="publicoAlvo"
                                    placeholder="Ex: Desenvolvedores iniciantes e intermediários"
                                    value={formData.publicoAlvo}
                                    onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
                                    className={
                                       formData.publicoAlvo.length > MAX_PUBLICO_ALVO_CHARS
                                          ? 'border-red-500 focus-visible:ring-red-500'
                                          : ''
                                    }
                                 />
                                 {formData.publicoAlvo.length > MAX_PUBLICO_ALVO_CHARS && (
                                    <p className="text-xs text-red-500 mt-1">
                                       O público alvo excedeu o limite de {MAX_PUBLICO_ALVO_CHARS} caracteres
                                    </p>
                                 )}
                              </div>

                              {/* Requirements - Full Width */}
                              <div className="space-y-2 md:col-span-2">
                                 <Label htmlFor="requisitos">
                                    Requisitos
                                    <span className="text-xs text-muted-foreground ml-2">
                                       ({formData.requisitos.length}/{MAX_REQUISITOS_CHARS})
                                    </span>
                                 </Label>
                                 <Input
                                    id="requisitos"
                                    placeholder="Ex: Notebook próprio e conhecimento básico de JavaScript"
                                    value={formData.requisitos}
                                    onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                                    className={
                                       formData.requisitos.length > MAX_REQUISITOS_CHARS
                                          ? 'border-red-500 focus-visible:ring-red-500'
                                          : ''
                                    }
                                 />
                                 {formData.requisitos.length > MAX_REQUISITOS_CHARS && (
                                    <p className="text-xs text-red-500 mt-1">
                                       Os requisitos excederam o limite de {MAX_REQUISITOS_CHARS} caracteres
                                    </p>
                                 )}
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* Step 3: Informações do Local */}
                     {currentStep === 3 && (
                        <motion.div
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                           className="space-y-6"
                        >
                           <div>
                              <h3 className="mb-1">Informações do Local</h3>
                              <p className="text-sm text-muted-foreground">
                                 {formData.tipoEvento === 'online'
                                    ? 'Este é um evento online. Os campos abaixo são opcionais.'
                                    : 'Adicione os detalhes do local onde o evento acontecerá'}
                              </p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Local Name */}
                              <div className="space-y-2 md:col-span-2">
                                 <Label htmlFor="LocalNome">Nome do Local</Label>
                                 <Input
                                    id="LocalNome"
                                    placeholder="Ex: Auditório Central"
                                    value={formData.LocalNome}
                                    onChange={(e) => setFormData({ ...formData, LocalNome: e.target.value })}
                                 />
                              </div>

                              {/* Local Address */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalEndereco">Endereço</Label>
                                 <Input
                                    id="LocalEndereco"
                                    placeholder="Ex: Rua das Flores"
                                    value={formData.LocalEndereco}
                                    onChange={(e) => setFormData({ ...formData, LocalEndereco: e.target.value })}
                                 />
                              </div>

                              {/* Local Number */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalNumero">Número</Label>
                                 <Input
                                    id="LocalNumero"
                                    placeholder="Ex: 123"
                                    value={formData.LocalNumero}
                                    onChange={(e) => setFormData({ ...formData, LocalNumero: e.target.value })}
                                 />
                              </div>

                              {/* Local Complement */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalComplemento">Complemento</Label>
                                 <Input
                                    id="LocalComplemento"
                                    placeholder="Ex: Bloco A, Sala 101"
                                    value={formData.LocalComplemento}
                                    onChange={(e) => setFormData({ ...formData, LocalComplemento: e.target.value })}
                                 />
                              </div>

                              {/* Local Neighborhood */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalBairro">Bairro</Label>
                                 <Input
                                    id="LocalBairro"
                                    placeholder="Ex: Jardim"
                                    value={formData.LocalBairro}
                                    onChange={(e) => setFormData({ ...formData, LocalBairro: e.target.value })}
                                 />
                              </div>

                              {/* Local City */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalCidade">Cidade</Label>
                                 <Input
                                    id="LocalCidade"
                                    placeholder="Ex: Cuiabá"
                                    value={formData.LocalCidade}
                                    onChange={(e) => setFormData({ ...formData, LocalCidade: e.target.value })}
                                 />
                              </div>

                              {/* Local State */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalEstado">Estado</Label>
                                 <Input
                                    id="LocalEstado"
                                    placeholder="Ex: MT"
                                    value={formData.LocalEstado}
                                    onChange={(e) => setFormData({ ...formData, LocalEstado: e.target.value })}
                                 />
                              </div>

                              {/* Local Zip Code */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalCep">CEP</Label>
                                 <Input
                                    id="LocalCep"
                                    placeholder="Ex: 12345-678"
                                    value={formData.LocalCep}
                                    onChange={(e) => setFormData({ ...formData, LocalCep: e.target.value })}
                                 />
                              </div>

                              {/* Local Country */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalPais">País</Label>
                                 <Input
                                    id="LocalPais"
                                    placeholder="Ex: Brasil"
                                    value={formData.LocalPais}
                                    onChange={(e) => setFormData({ ...formData, LocalPais: e.target.value })}
                                 />
                              </div>

                              {/* Local Capacity */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalCapacidade">Capacidade do Local</Label>
                                 <Input
                                    id="LocalCapacidade"
                                    type="number"
                                    min="1"
                                    placeholder="Ex: 100"
                                    value={formData.LocalCapacidade}
                                    onChange={(e) => setFormData({ ...formData, LocalCapacidade: e.target.value })}
                                 />
                              </div>

                              {/* Local Observations - Full Width */}
                              <div className="space-y-2 md:col-span-2">
                                 <Label htmlFor="LocalObservacoes">Observações sobre o Local</Label>
                                 <Textarea
                                    id="LocalObservacoes"
                                    placeholder="Ex: Estacionamento disponível, acesso para pessoas com deficiência"
                                    value={formData.LocalObservacoes}
                                    onChange={(e) => setFormData({ ...formData, LocalObservacoes: e.target.value })}
                                    rows={3}
                                    className="resize-none"
                                 />
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* Step 4: Mídia e Links */}
                     {currentStep === 4 && (
                        <motion.div
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                           className="space-y-6"
                        >
                           <div>
                              <h3 className="mb-1">Mídia e Links</h3>
                              <p className="text-sm text-muted-foreground">
                                 Adicione imagens e links relacionados ao evento
                              </p>
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {/* Image URL */}
                              <div className="space-y-2">
                                 <Label htmlFor="imagemCapa" className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    URL da Imagem de Capa
                                 </Label>
                                 <Input
                                    id="imagemCapa"
                                    type="url"
                                    placeholder="https://exemplo.com/imagem-evento.jpg"
                                    value={formData.imagemCapa}
                                    onChange={(e) => setFormData({ ...formData, imagemCapa: e.target.value })}
                                 />
                                 {formData.imagemCapa && (
                                    <motion.div
                                       initial={{ opacity: 0, height: 0 }}
                                       animate={{ opacity: 1, height: 'auto' }}
                                       className="relative rounded-lg overflow-hidden h-48 border border-border mt-3"
                                    >
                                       <img
                                          src={formData.imagemCapa}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                       />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                    </motion.div>
                                 )}
                              </div>

                              {/* Event Page Link */}
                              <div className="space-y-2">
                                 <Label htmlFor="linkPaginaEvento">Link da Página do Evento</Label>
                                 <Input
                                    id="linkPaginaEvento"
                                    type="url"
                                    placeholder="https://exemplo.com/evento"
                                    value={formData.linkPaginaEvento}
                                    onChange={(e) => setFormData({ ...formData, linkPaginaEvento: e.target.value })}
                                 />
                              </div>

                              {/* Google Maps Link */}
                              <div className="space-y-2">
                                 <Label htmlFor="LocalLinkGoogleMaps" className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" />
                                    Link do Google Maps
                                 </Label>
                                 <Input
                                    id="LocalLinkGoogleMaps"
                                    type="url"
                                    placeholder="https://maps.google.com/?q=-23.550520,-46.633309"
                                    value={formData.LocalLinkGoogleMaps}
                                    onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
                                 />
                                 <p className="text-xs text-muted-foreground">
                                    Cole o link compartilhável do Google Maps. As coordenadas serão extraídas
                                    automaticamente.
                                 </p>
                                 {formData.LocalLatitude && formData.LocalLongitude && (
                                    <motion.div
                                       initial={{ opacity: 0, height: 0 }}
                                       animate={{ opacity: 1, height: 'auto' }}
                                       className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md"
                                    >
                                       <p className="text-xs text-green-700">
                                          ✅ Coordenadas extraídas automaticamente!
                                       </p>
                                    </motion.div>
                                 )}
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                 {/* Local Latitude */}
                                 <div className="space-y-2">
                                    <Label htmlFor="LocalLatitude">Latitude</Label>
                                    <Input
                                       id="LocalLatitude"
                                       placeholder="Ex: -23.550520"
                                       value={formData.LocalLatitude}
                                       onChange={(e) => handleCoordinateChange('LocalLatitude', e.target.value)}
                                    />
                                 </div>

                                 {/* Local Longitude */}
                                 <div className="space-y-2">
                                    <Label htmlFor="LocalLongitude">Longitude</Label>
                                    <Input
                                       id="LocalLongitude"
                                       placeholder="Ex: -46.633309"
                                       value={formData.LocalLongitude}
                                       onChange={(e) => handleCoordinateChange('LocalLongitude', e.target.value)}
                                    />
                                 </div>
                              </div>

                              {/* Summary Card */}
                              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                                 <h4 className="mb-3">Resumo do Evento</h4>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Título:</span>
                                       <span>{formData.titulo || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Categoria:</span>
                                       <span>
                                          {formData.categoriaId
                                             ? categorias.find((c) => c.id.toString() === formData.categoriaId)?.nome ||
                                               '-'
                                             : '-'}
                                       </span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Tipo:</span>
                                       <span className="capitalize">{formData.tipoEvento}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Capacidade:</span>
                                       <span>{formData.capacidadeMaxima || '-'} pessoas</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Local:</span>
                                       <span>{formData.LocalNome || 'Não informado'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Coordenadas:</span>
                                       <span>
                                          {formData.LocalLatitude && formData.LocalLongitude
                                             ? `${formData.LocalLatitude}, ${formData.LocalLongitude}`
                                             : 'Não informadas'}
                                       </span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Status:</span>
                                       <span className="capitalize">{formData.status}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="p-6 border-t border-border bg-muted/30">
                     <div className="flex gap-3">
                        {currentStep > 1 && (
                           <Button
                              type="button"
                              variant="outline"
                              onClick={prevStep}
                              size="lg"
                              className="flex items-center gap-2"
                           >
                              <ChevronLeft className="w-4 h-4" />
                              Anterior
                           </Button>
                        )}

                        <div className="flex-1" />

                        <Button type="button" variant="outline" onClick={onClose} size="lg">
                           Cancelar
                        </Button>

                        {currentStep < totalSteps && (
                           <Button
                              type="button"
                              onClick={nextStep}
                              disabled={!canProceed()}
                              size="lg"
                              className="flex items-center gap-2"
                           >
                              Próximo
                              <ChevronRight className="w-4 h-4" />
                           </Button>
                        )}
                        {currentStep === totalSteps && (
                           <Button onClick={(e) => handleSubmit(e)} size="lg" className="flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              {editingEvent ? 'Atualizar Evento' : 'Solicitar Evento'}
                           </Button>
                        )}
                     </div>
                  </div>
               </form>
            </motion.div>
         </div>
      </AnimatePresence>
   )
}
