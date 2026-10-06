import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
   AlertCircle,
   Loader2,
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
   /** Impede o fechamento do modal ao clicar fora (usado no fluxo de solicitação) */
   closeOnOutsideClick?: boolean
}

// ─── Tipos de erro por step ───────────────────────────────────────────────────
type Step1Errors = {
   titulo?: string
   descricao?: string
   categoriaId?: string
}

type Step2Errors = {
   dataInicio?: string
   dataFim?: string
   horarioAbertura?: string
   horarioEncerramento?: string
   publicoAlvo?: string
   requisitos?: string
}

type Step4Errors = {
   LocalLatitude?: string
   LocalLongitude?: string
   imagemCapa?: string
}

// ─── Estado inicial extraído para evitar duplicação ──────────────────────────
const INITIAL_FORM_DATA = {
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
}

const MAX_DESCRICAO_CHARS = 500
const MAX_PUBLICO_ALVO_CHARS = 150
const MAX_REQUISITOS_CHARS = 150

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCep = (value: string) => {
   const digits = value.replace(/\D/g, '').slice(0, 8)
   if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`
   return digits
}

const isValidImageUrl = (url: string) => {
   try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
   } catch {
      return false
   }
}

// ─── Componente de campo com erro ─────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
   if (!message) return null
   return (
      <motion.p
         initial={{ opacity: 0, y: -4 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-1 text-xs text-red-500 mt-1"
      >
         <AlertCircle className="w-3 h-3 shrink-0" />
         {message}
      </motion.p>
   )
}

export function EventForm({ onSubmit, onClose, editingEvent, categorias, closeOnOutsideClick = true }: EventFormProps) {
   const [currentStep, setCurrentStep] = useState(1)
   const totalSteps = 4

   const [formData, setFormData] = useState(INITIAL_FORM_DATA)

   // Erros por step
   const [errors1, setErrors1] = useState<Step1Errors>({})
   const [errors2, setErrors2] = useState<Step2Errors>({})
   const [errors4, setErrors4] = useState<Step4Errors>({})

   // Preview de imagem
   const [imageError, setImageError] = useState(false)

   // Estado de geocodificação
   const [isGeocoding, setIsGeocoding] = useState(false)
   const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'success' | 'error'>('idle')

   // ─── Refs ──────────────────────────────────────────────────────────────
   const cepAbortRef = useRef<AbortController | null>(null)
   const geocodeAbortRef = useRef<AbortController | null>(null)
   const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

   // ─── Deriva o estado inicial do editingEvent de forma estável ─────────
   const prevEventIdRef = useRef<string | undefined>(undefined)

   useEffect(() => {
      const currentId = editingEvent?.id
      if (currentId !== prevEventIdRef.current) {
         if (!editingEvent) {
            setFormData(INITIAL_FORM_DATA)
            setGeocodeStatus('idle')
         } else {
            setFormData({
               titulo: editingEvent.titulo,
               descricao: editingEvent.descricao,
               categoriaId: editingEvent.categoriaId?.toString() || editingEvent.categoria?.id?.toString() || '',
               organizadorId: editingEvent.organizadorId?.toString() || '',
               dataInicio: editingEvent.dataInicio.substring(0, 10),
               dataFim: editingEvent.dataFim.substring(0, 10),
               horarioAbertura: editingEvent.horarioAbertura
                  ? new Date(editingEvent.horarioAbertura).toISOString().slice(11, 16)
                  : '',
               horarioEncerramento: editingEvent.horarioEncerramento
                  ? new Date(editingEvent.horarioEncerramento).toISOString().slice(11, 16)
                  : '',
               capacidadeMaxima: editingEvent.capacidadeMaxima?.toString() || '',
               vagasDisponiveis:
                  editingEvent.vagasDisponiveis?.toString() || editingEvent.capacidadeMaxima?.toString() || '',
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
            // Se já tem coords ao editar, marca como sucesso
            if (editingEvent.LocalLatitude && editingEvent.LocalLongitude) {
               setGeocodeStatus('success')
            }
         }
         prevEventIdRef.current = currentId
      }
   }, [editingEvent])

   const set = useCallback(
      (field: keyof typeof INITIAL_FORM_DATA, value: string) => {
         setFormData((prev) => {
            if (editingEvent && field === 'categoriaId' && value === '') {
               return prev
            }
            return { ...prev, [field]: value }
         })
      },
      [editingEvent],
   )

   // ─── Geocodificação via Nominatim ─────────────────────────────────────
   const geocodeAddress = useCallback(async (data: typeof INITIAL_FORM_DATA) => {
      const parts = [
         data.LocalEndereco,
         data.LocalNumero,
         data.LocalBairro,
         data.LocalCidade,
         data.LocalEstado,
         data.LocalPais,
      ].filter(Boolean)

      // Precisa ao menos de cidade para geocodificar
      if (!data.LocalCidade && !data.LocalEndereco) return

      geocodeAbortRef.current?.abort()
      geocodeAbortRef.current = new AbortController()

      setIsGeocoding(true)
      setGeocodeStatus('idle')

      try {
         const query = parts.join(', ')
         const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
            {
               headers: { 'Accept-Language': 'pt-BR' },
               signal: geocodeAbortRef.current.signal,
            },
         )
         const result = await res.json()

         if (result.length > 0) {
            const { lat, lon } = result[0]
            const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`
            setFormData((prev) => ({
               ...prev,
               LocalLatitude: lat,
               LocalLongitude: lon,
               LocalLinkGoogleMaps: mapsLink,
            }))
            setGeocodeStatus('success')
         } else {
            setGeocodeStatus('error')
         }
      } catch (err: unknown) {
         if (err instanceof Error && err.name !== 'AbortError') {
            console.error('Erro ao geocodificar endereço:', err)
            setGeocodeStatus('error')
         }
      } finally {
         setIsGeocoding(false)
      }
   }, [])

   // ─── Debounce: dispara geocodificação quando endereço muda ───────────
   useEffect(() => {
      if (!formData.LocalCidade && !formData.LocalEndereco) return

      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)

      geocodeTimerRef.current = setTimeout(() => {
         geocodeAddress(formData)
      }, 1000)

      return () => {
         if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
      }
   }, [
      formData.LocalEndereco,
      formData.LocalNumero,
      formData.LocalBairro,
      formData.LocalCidade,
      formData.LocalEstado,
      formData.LocalPais,
      geocodeAddress,
   ])

   const handleCoordinateChange = useCallback((field: 'LocalLatitude' | 'LocalLongitude', value: string) => {
      const cleaned = value.replace(/[^\d.-]/g, '')
      setFormData((prev) => ({ ...prev, [field]: cleaned }))
      // Ao editar manualmente, atualiza o link do Maps
      setFormData((prev) => {
         const lat = field === 'LocalLatitude' ? cleaned : prev.LocalLatitude
         const lon = field === 'LocalLongitude' ? cleaned : prev.LocalLongitude
         const mapsLink =
            lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))
               ? `https://www.google.com/maps?q=${lat},${lon}`
               : prev.LocalLinkGoogleMaps
         return { ...prev, [field]: cleaned, LocalLinkGoogleMaps: mapsLink }
      })

      const num = parseFloat(cleaned)
      if (cleaned && !isNaN(num)) {
         const isLat = field === 'LocalLatitude'
         const outOfRange = isLat ? num < -90 || num > 90 : num < -180 || num > 180
         setErrors4((prev) => ({
            ...prev,
               [field]: outOfRange
                  ? isLat
                     ? 'A latitude deve estar entre -90 e 90'
                     : 'A longitude deve estar entre -180 e 180'
                  : undefined,
         }))
      } else {
         setErrors4((prev) => ({ ...prev, [field]: undefined }))
      }
   }, [])

   const handleCepChange = useCallback(async (raw: string) => {
      const formatted = formatCep(raw)
      setFormData((prev) => ({ ...prev, LocalCep: formatted }))

      const digits = formatted.replace(/\D/g, '')
      if (digits.length === 8) {
         cepAbortRef.current?.abort()
         cepAbortRef.current = new AbortController()

         try {
            const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
               signal: cepAbortRef.current.signal,
            })
            const data = await response.json()
            if (!data.erro) {
               setFormData((prev) => ({
                  ...prev,
                  LocalCep: formatted,
                  LocalEndereco: data.logradouro || prev.LocalEndereco,
                  LocalBairro: data.bairro || prev.LocalBairro,
                  LocalCidade: data.localidade || prev.LocalCidade,
                  LocalEstado: data.uf || prev.LocalEstado,
                  LocalPais: 'Brasil',
               }))
               // A geocodificação será disparada automaticamente pelo useEffect de debounce
            }
         } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
               console.error('Erro ao buscar CEP:', err)
            }
         }
      }
   }, [])

   // ─── Validações por step ───────────────────────────────────────────────
   const validateStep1 = useCallback((): boolean => {
      const errs: Step1Errors = {}
      if (!formData.titulo.trim()) errs.titulo = 'Informe o nome do evento'
      if (!formData.descricao.trim()) errs.descricao = 'Informe a descrição do evento'
      else if (formData.descricao.length > MAX_DESCRICAO_CHARS)
         errs.descricao = `A descrição deve ter no máximo ${MAX_DESCRICAO_CHARS} caracteres`
      if (!formData.categoriaId) errs.categoriaId = 'Selecione a categoria do evento'
      setErrors1(errs)
      return Object.keys(errs).length === 0
   }, [formData.titulo, formData.descricao, formData.categoriaId])

   const validateStep2 = useCallback((): boolean => {
      const errs: Step2Errors = {}
      if (!formData.dataInicio) errs.dataInicio = 'Informe a data de início'
      if (!formData.dataFim) errs.dataFim = 'Informe a data de encerramento'
      else if (formData.dataInicio && formData.dataFim < formData.dataInicio) {
         errs.dataFim = 'A data de encerramento não pode ser anterior à data de início'
      }
      if (!formData.horarioAbertura) errs.horarioAbertura = 'Informe o horário de início'
      if (!formData.horarioEncerramento) errs.horarioEncerramento = 'Informe o horário de encerramento'
      if (
         formData.horarioAbertura &&
         formData.horarioEncerramento &&
         formData.dataInicio === formData.dataFim &&
         formData.horarioEncerramento <= formData.horarioAbertura
      ) {
         errs.horarioEncerramento = 'O horário de encerramento deve ser posterior ao horário de início'
      }
      if (formData.publicoAlvo.length > MAX_PUBLICO_ALVO_CHARS)
         errs.publicoAlvo = `O público-alvo deve ter no máximo ${MAX_PUBLICO_ALVO_CHARS} caracteres`
      if (formData.requisitos.length > MAX_REQUISITOS_CHARS)
         errs.requisitos = `Os requisitos devem ter no máximo ${MAX_REQUISITOS_CHARS} caracteres`
      setErrors2(errs)
      return Object.keys(errs).length === 0
   }, [
      formData.dataInicio,
      formData.dataFim,
      formData.horarioAbertura,
      formData.horarioEncerramento,
      formData.publicoAlvo,
      formData.requisitos,
   ])

   const validateStep4 = useCallback((): boolean => {
      const errs: Step4Errors = {}
      if (formData.imagemCapa && !isValidImageUrl(formData.imagemCapa)) {
         errs.imagemCapa = 'URL inválida. Use uma URL pública que comece com http:// ou https://'
      }
      const lat = parseFloat(formData.LocalLatitude)
      const lng = parseFloat(formData.LocalLongitude)
      if (formData.LocalLatitude && (isNaN(lat) || lat < -90 || lat > 90))
         errs.LocalLatitude = 'A latitude deve estar entre -90 e 90'
      if (formData.LocalLongitude && (isNaN(lng) || lng < -180 || lng > 180))
         errs.LocalLongitude = 'A longitude deve estar entre -180 e 180'
      setErrors4(errs)
      return Object.keys(errs).length === 0
   }, [formData.imagemCapa, formData.LocalLatitude, formData.LocalLongitude])

   // ─── Navegação ────────────────────────────────────────────────────────
   const nextStep = useCallback(() => {
      const valid = currentStep === 1 ? validateStep1() : currentStep === 2 ? validateStep2() : true
      if (valid && currentStep < totalSteps) setCurrentStep((s) => s + 1)
   }, [currentStep, totalSteps, validateStep1, validateStep2])

   const prevStep = useCallback(() => {
      if (currentStep > 1) setCurrentStep((s) => s - 1)
   }, [currentStep])

   // ─── Submit ───────────────────────────────────────────────────────────
   const handleSubmit = useCallback(
      (e: React.FormEvent) => {
         e.preventDefault()
         if (!validateStep4()) return

         const toDate = (dateStr: string) => {
            const [y, m, d] = dateStr.split('-').map(Number)
            return new Date(y, m - 1, d).toISOString()
         }

         onSubmit({
            titulo: formData.titulo,
            descricao: formData.descricao,
            categoriaId: parseInt(formData.categoriaId),
            organizadorId: formData.organizadorId ? parseInt(formData.organizadorId) : undefined,
            dataInicio: toDate(formData.dataInicio),
            dataFim: toDate(formData.dataFim),
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

         setFormData(INITIAL_FORM_DATA)
         setGeocodeStatus('idle')
      },
      [formData, onSubmit, validateStep4],
   )

   // ─── Steps config ─────────────────────────────────────────────────────
   const steps = [
      { number: 1, title: 'Informações Principais', icon: FileText },
      { number: 2, title: 'Detalhes do Evento', icon: CalendarIcon },
      { number: 3, title: 'Local do Evento', icon: MapPin },
      { number: 4, title: 'Imagem e Links', icon: ImageIcon },
   ]

   // ─── Valores derivados para o resumo ──────────────────────────────────
   const categoriaNome = useMemo(
      () => categorias.find((c) => c.id.toString() === formData.categoriaId)?.nome || '-',
      [categorias, formData.categoriaId],
   )

   const resumoPeriodo = useMemo(() => {
      if (!formData.dataInicio || !formData.dataFim) return '-'
      const fmt = (s: string) => {
         const [y, m, d] = s.split('-')
         return `${d}/${m}/${y}`
      }
      return `${fmt(formData.dataInicio)} → ${fmt(formData.dataFim)}`
   }, [formData.dataInicio, formData.dataFim])

   const resumoHorario = useMemo(
      () =>
         formData.horarioAbertura && formData.horarioEncerramento
            ? `${formData.horarioAbertura} às ${formData.horarioEncerramento}`
            : '-',
      [formData.horarioAbertura, formData.horarioEncerramento],
   )

   const resumoLocal = useMemo(
      () =>
         [formData.LocalNome, formData.LocalCidade, formData.LocalEstado].filter(Boolean).join(', ') || 'Não informado',
      [formData.LocalNome, formData.LocalCidade, formData.LocalEstado],
   )

   return (
      <AnimatePresence>
         <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeOnOutsideClick ? onClose : undefined}
         >
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               transition={{ duration: 0.2, ease: 'easeOut' }}
               className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border"
               onClick={(e) => e.stopPropagation()}
            >
               {/* Header */}
               <div className="px-6 py-5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-primary">
                           <CalendarIcon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                           <h2>{editingEvent ? 'Editar Evento' : 'Solicitar Cadastro de Evento'}</h2>
                           <p className="text-sm text-muted-foreground">
                              Etapa {currentStep} de {totalSteps}: {steps[currentStep - 1].title}
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
                                          style={{
                                             width: isCompleted ? '100%' : '0%',
                                          }}
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
                     {/* ── Step 1: Informações Básicas ─────────────── */}
                     {currentStep === 1 && (
                        <motion.div
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                           className="space-y-6"
                        >
                           <div>
                              <h3 className="mb-1">Informações Principais do Evento</h3>
                              <p className="text-sm text-muted-foreground">
                                 Informe os dados principais do evento
                              </p>
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {/* Título */}
                              <div className="space-y-2">
                                 <Label htmlFor="titulo">Nome do Evento*</Label>
                                 <Input
                                    id="titulo"
                                    placeholder="Ex: Seminário de Tecnologia e Inovação"
                                    value={formData.titulo}
                                    onChange={(e) => {
                                       set('titulo', e.target.value)
                                       if (errors1.titulo)
                                          setErrors1((p) => ({
                                             ...p,
                                             titulo: undefined,
                                          }))
                                    }}
                                    className={errors1.titulo ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                 />
                                 <FieldError message={errors1.titulo} />
                              </div>

                              {/* Descrição */}
                              <div className="space-y-2">
                                 <Label htmlFor="descricao">
                                    Descrição*
                                    <span className="text-xs text-muted-foreground ml-2">
                                       ({formData.descricao.length}/{MAX_DESCRICAO_CHARS})
                                    </span>
                                 </Label>
                                 <Textarea
                                    id="descricao"
                                    placeholder="Faça um resumo do que será o evento..."
                                    value={formData.descricao}
                                    onChange={(e) => {
                                       set('descricao', e.target.value)
                                       if (errors1.descricao)
                                          setErrors1((p) => ({
                                             ...p,
                                             descricao: undefined,
                                          }))
                                    }}
                                    rows={4}
                                    className={`resize-none ${
                                       errors1.descricao ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }`}
                                 />
                                 <FieldError message={errors1.descricao} />
                              </div>

                              {/* Categoria */}
                              <div className="space-y-2">
                                 <Label htmlFor="categoriaId">Categoria do Evento*</Label>
                                 <Select
                                    key={categorias.length}
                                    value={formData.categoriaId}
                                    onValueChange={(value) => {
                                       set('categoriaId', value)
                                       if (errors1.categoriaId)
                                          setErrors1((p) => ({
                                             ...p,
                                             categoriaId: undefined,
                                          }))
                                    }}
                                 >
                                    <SelectTrigger
                                       id="categoriaId"
                                       className={errors1.categoriaId ? 'border-red-500 focus:ring-red-500' : ''}
                                    >
                                       <SelectValue placeholder="Selecione a categoria do evento" />
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
                                 <FieldError message={errors1.categoriaId} />
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* ── Step 2: Detalhes do Evento ──────────────── */}
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
                                 Informe quando o evento acontece e para quem é destinado
                              </p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Data de Início */}
                              <div className="space-y-2">
                                 <Label htmlFor="dataInicio">Data de Início*</Label>
                                 <Input
                                    id="dataInicio"
                                    type="date"
                                    value={formData.dataInicio}
                                    onChange={(e) => {
                                       set('dataInicio', e.target.value)
                                       if (errors2.dataInicio)
                                          setErrors2((p) => ({
                                             ...p,
                                             dataInicio: undefined,
                                          }))
                                    }}
                                    className={errors2.dataInicio ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                 />
                                 <FieldError message={errors2.dataInicio} />
                              </div>

                              {/* Data de Encerramento */}
                              <div className="space-y-2">
                                  <Label htmlFor="dataFim">Data de Encerramento*</Label>
                                 <Input
                                    id="dataFim"
                                    type="date"
                                    value={formData.dataFim}
                                    min={formData.dataInicio || undefined}
                                    onChange={(e) => {
                                       set('dataFim', e.target.value)
                                       if (errors2.dataFim)
                                          setErrors2((p) => ({
                                             ...p,
                                             dataFim: undefined,
                                          }))
                                    }}
                                    className={errors2.dataFim ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                 />
                                 <FieldError message={errors2.dataFim} />
                              </div>

                               {/* Horário de Início */}
                              <div className="space-y-2">
                                  <Label htmlFor="horarioAbertura">Horário de Início*</Label>
                                 <Input
                                    id="horarioAbertura"
                                    type="time"
                                    value={formData.horarioAbertura}
                                    onChange={(e) => {
                                       set('horarioAbertura', e.target.value)
                                       if (errors2.horarioAbertura)
                                          setErrors2((p) => ({
                                             ...p,
                                             horarioAbertura: undefined,
                                          }))
                                    }}
                                    className={
                                       errors2.horarioAbertura ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }
                                 />
                                 <FieldError message={errors2.horarioAbertura} />
                              </div>

                              {/* Horário de Encerramento */}
                              <div className="space-y-2">
                                 <Label htmlFor="horarioEncerramento">Horário de Encerramento*</Label>
                                 <Input
                                    id="horarioEncerramento"
                                    type="time"
                                    value={formData.horarioEncerramento}
                                    onChange={(e) => {
                                       set('horarioEncerramento', e.target.value)
                                       if (errors2.horarioEncerramento)
                                          setErrors2((p) => ({
                                             ...p,
                                             horarioEncerramento: undefined,
                                          }))
                                    }}
                                    className={
                                       errors2.horarioEncerramento ? 'border-red-500 focus-visible:ring-red-500' : ''
                                    }
                                 />
                                 <FieldError message={errors2.horarioEncerramento} />
                              </div>

                               {/* Público-Alvo */}
                              <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="publicoAlvo">
                                     Público-Alvo
                                    <span className="text-xs text-muted-foreground ml-2">
                                       ({formData.publicoAlvo.length}/{MAX_PUBLICO_ALVO_CHARS})
                                    </span>
                                 </Label>
                                 <Input
                                    id="publicoAlvo"
                                     placeholder="Ex: Estudantes e profissionais interessados no tema"
                                    value={formData.publicoAlvo}
                                    onChange={(e) => {
                                       set('publicoAlvo', e.target.value)
                                       if (errors2.publicoAlvo)
                                          setErrors2((p) => ({
                                             ...p,
                                             publicoAlvo: undefined,
                                          }))
                                    }}
                                    className={errors2.publicoAlvo ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                 />
                                 <FieldError message={errors2.publicoAlvo} />
                              </div>

                              {/* Requisitos */}
                              <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor="requisitos">
                                     Requisitos para Participação
                                    <span className="text-xs text-muted-foreground ml-2">
                                       ({formData.requisitos.length}/{MAX_REQUISITOS_CHARS})
                                    </span>
                                 </Label>
                                 <Input
                                    id="requisitos"
                                     placeholder="Ex: Trazer computador próprio"
                                    value={formData.requisitos}
                                    onChange={(e) => {
                                       set('requisitos', e.target.value)
                                       if (errors2.requisitos)
                                          setErrors2((p) => ({
                                             ...p,
                                             requisitos: undefined,
                                          }))
                                    }}
                                    className={errors2.requisitos ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                 />
                                 <FieldError message={errors2.requisitos} />
                              </div>
                           </div>
                        </motion.div>
                     )}

                     {/* ── Step 3: Informações do Local ────────────── */}
                     {currentStep === 3 && (
                        <motion.div
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                           className="space-y-6"
                        >
                           <div>
                              <h3 className="mb-1">Local do Evento</h3>
                              <p className="text-sm text-muted-foreground">
                                 {formData.tipoEvento === 'online'
                                    ? 'Este é um evento online. Os campos abaixo são opcionais.'
                                    : 'Informe o endereço onde o evento acontecerá. O link do Google Maps será gerado automaticamente.'}
                              </p>
                           </div>

                           {/* Indicador de geocodificação */}
                           <AnimatePresence>
                              {isGeocoding && (
                                 <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border border-border"
                                 >
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                     Buscando o endereço informado...
                                 </motion.div>
                              )}
                              {!isGeocoding && geocodeStatus === 'success' && (
                                 <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 text-sm text-green-700 p-3 bg-green-50 rounded-lg border border-green-200"
                                 >
                                    <Check className="w-4 h-4 shrink-0" />
                                     Endereço localizado! O link do Google Maps foi gerado automaticamente.
                                 </motion.div>
                              )}
                              {!isGeocoding && geocodeStatus === 'error' && (
                                 <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 text-sm text-amber-700 p-3 bg-amber-50 rounded-lg border border-amber-200"
                                 >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                     Não foi possível localizar este endereço. Você poderá informá-lo manualmente
                                     na próxima etapa.
                                 </motion.div>
                              )}
                           </AnimatePresence>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2 md:col-span-2">
                                 <Label htmlFor="LocalNome">Nome do Local</Label>
                                 <Input
                                    id="LocalNome"
                                    placeholder="Ex: Auditório Central"
                                    value={formData.LocalNome}
                                    onChange={(e) => set('LocalNome', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalCep">CEP</Label>
                                 <Input
                                    id="LocalCep"
                                    placeholder="12345-678"
                                    value={formData.LocalCep}
                                    onChange={(e) => handleCepChange(e.target.value)}
                                    maxLength={9}
                                 />
                                 <p className="text-xs text-muted-foreground">
                                     Informe o CEP para preencher o endereço automaticamente
                                 </p>
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalEndereco">Endereço</Label>
                                 <Input
                                    id="LocalEndereco"
                                    placeholder="Ex: Rua das Flores"
                                    value={formData.LocalEndereco}
                                    onChange={(e) => set('LocalEndereco', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalNumero">Número</Label>
                                 <Input
                                    id="LocalNumero"
                                    placeholder="Ex: 123"
                                    value={formData.LocalNumero}
                                    onChange={(e) => set('LocalNumero', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalComplemento">Complemento</Label>
                                 <Input
                                    id="LocalComplemento"
                                    placeholder="Ex: Bloco A, Sala 101"
                                    value={formData.LocalComplemento}
                                    onChange={(e) => set('LocalComplemento', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalBairro">Bairro</Label>
                                 <Input
                                    id="LocalBairro"
                                    placeholder="Ex: Jardim"
                                    value={formData.LocalBairro}
                                    onChange={(e) => set('LocalBairro', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalCidade">Cidade</Label>
                                 <Input
                                    id="LocalCidade"
                                    placeholder="Ex: Cuiabá"
                                    value={formData.LocalCidade}
                                    onChange={(e) => set('LocalCidade', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalEstado">Estado</Label>
                                 <Input
                                    id="LocalEstado"
                                    placeholder="Ex: MT"
                                    value={formData.LocalEstado}
                                    onChange={(e) => set('LocalEstado', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label htmlFor="LocalPais">País</Label>
                                 <Input
                                    id="LocalPais"
                                    placeholder="Ex: Brasil"
                                    value={formData.LocalPais}
                                    onChange={(e) => set('LocalPais', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2">
                                  <Label htmlFor="LocalCapacidade">Capacidade do Local (pessoas)</Label>
                                 <Input
                                    id="LocalCapacidade"
                                    type="number"
                                    min="1"
                                    placeholder="Ex: 100"
                                    value={formData.LocalCapacidade}
                                    onChange={(e) => set('LocalCapacidade', e.target.value)}
                                 />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                 <Label htmlFor="LocalObservacoes">Observações sobre o Local</Label>
                                 <Textarea
                                    id="LocalObservacoes"
                                    placeholder="Ex: Estacionamento disponível, acesso para pessoas com deficiência"
                                    value={formData.LocalObservacoes}
                                    onChange={(e) => set('LocalObservacoes', e.target.value)}
                                    rows={3}
                                    className="resize-none"
                                 />
                              </div>
                           </div>
                        </motion.div>
                     )}

                      {/* ── Step 4: Imagem e Links ───────────────────── */}
                     {currentStep === 4 && (
                        <motion.div
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.2 }}
                           className="space-y-6"
                        >
                           <div>
                              <h3 className="mb-1">Imagem e Links</h3>
                              <p className="text-sm text-muted-foreground">
                                 Informe a imagem de capa e os links relacionados ao evento
                              </p>
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {/* Imagem de Capa */}
                              <div className="space-y-2">
                                 <Label htmlFor="imagemCapa" className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                     Endereço (link) da Imagem de Capa
                                 </Label>
                                 <Input
                                    id="imagemCapa"
                                    type="url"
                                    placeholder="https://exemplo.com/imagem-evento"
                                    value={formData.imagemCapa}
                                    onChange={(e) => {
                                       set('imagemCapa', e.target.value)
                                       setImageError(false)
                                       if (errors4.imagemCapa)
                                          setErrors4((p) => ({
                                             ...p,
                                             imagemCapa: undefined,
                                          }))
                                    }}
                                    className={errors4.imagemCapa ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                 />
                                 <FieldError message={errors4.imagemCapa} />

                                 {formData.imagemCapa && !errors4.imagemCapa && (
                                    <motion.div
                                       initial={{ opacity: 0, height: 0 }}
                                       animate={{ opacity: 1, height: 'auto' }}
                                       className="relative rounded-lg overflow-hidden border border-border mt-3"
                                    >
                                       {imageError ? (
                                          <div className="h-32 flex flex-col items-center justify-center bg-muted gap-2 text-muted-foreground text-sm">
                                             <ImageIcon className="w-6 h-6" />
                                             <span>Não foi possível carregar a imagem</span>
                                          </div>
                                       ) : (
                                          <img
                                             src={formData.imagemCapa}
                                             alt="Preview da capa"
                                             className="w-full h-48 object-cover"
                                             onError={() => setImageError(true)}
                                          />
                                       )}
                                    </motion.div>
                                 )}
                              </div>

                              {/* Link da Página */}
                              <div className="space-y-2">
                                 <Label htmlFor="linkPaginaEvento">Link da Página do Evento</Label>
                                 <Input
                                    id="linkPaginaEvento"
                                    type="url"
                                    placeholder="https://exemplo.com/evento"
                                    value={formData.linkPaginaEvento}
                                    onChange={(e) => set('linkPaginaEvento', e.target.value)}
                                 />
                              </div>

                              {/* Google Maps — gerado automaticamente */}
                              <div className="space-y-2">
                                 <Label className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" />
                                    Link do Google Maps
                                 </Label>
                                 {formData.LocalLinkGoogleMaps ? (
                                    <div className="flex items-center gap-2">
                                       <Input
                                          readOnly
                                          value={formData.LocalLinkGoogleMaps}
                                          className="bg-muted text-muted-foreground cursor-default"
                                       />
                                       <a
                                          href={formData.LocalLinkGoogleMaps}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="shrink-0"
                                       >
                                          <Button type="button" variant="outline" size="sm">
                                             Abrir
                                          </Button>
                                       </a>
                                    </div>
                                 ) : (
                                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed border-border">
                                       {isGeocoding ? (
                                          <>
                                             <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                                              <p className="text-sm text-muted-foreground">Buscando endereço...</p>
                                          </>
                                       ) : (
                                           <p className="text-sm text-muted-foreground italic">
                                              Será gerado automaticamente após informar o endereço na etapa anterior.
                                           </p>
                                       )}
                                    </div>
                                 )}
                              </div>

                              {/* Coordenadas — preenchidas automaticamente, editáveis manualmente */}
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                     <Label htmlFor="LocalLatitude" className="flex items-center gap-1.5">
                                        Latitude (localização)
                                       {isGeocoding && (
                                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                       )}
                                       {!isGeocoding && geocodeStatus === 'success' && formData.LocalLatitude && (
                                          <Check className="w-3 h-3 text-green-600" />
                                       )}
                                    </Label>
                                    <Input
                                       id="LocalLatitude"
                                       placeholder="Ex: -23.550520"
                                       value={formData.LocalLatitude}
                                       onChange={(e) => handleCoordinateChange('LocalLatitude', e.target.value)}
                                       className={
                                          errors4.LocalLatitude ? 'border-red-500 focus-visible:ring-red-500' : ''
                                       }
                                    />
                                    <FieldError message={errors4.LocalLatitude} />
                                 </div>

                                 <div className="space-y-2">
                                     <Label htmlFor="LocalLongitude" className="flex items-center gap-1.5">
                                        Longitude (localização)
                                       {isGeocoding && (
                                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                       )}
                                       {!isGeocoding && geocodeStatus === 'success' && formData.LocalLongitude && (
                                          <Check className="w-3 h-3 text-green-600" />
                                       )}
                                    </Label>
                                    <Input
                                       id="LocalLongitude"
                                       placeholder="Ex: -46.633309"
                                       value={formData.LocalLongitude}
                                       onChange={(e) => handleCoordinateChange('LocalLongitude', e.target.value)}
                                       className={
                                          errors4.LocalLongitude ? 'border-red-500 focus-visible:ring-red-500' : ''
                                       }
                                    />
                                    <FieldError message={errors4.LocalLongitude} />
                                 </div>
                              </div>

                              {/* Resumo completo */}
                              <div className="mt-2 p-4 bg-muted/50 rounded-lg border border-border">
                                 <h4 className="mb-3">Resumo do Evento</h4>
                                 <div className="space-y-2 text-sm">
                                    {(
                                        [
                                           ['Nome', formData.titulo],
                                           ['Categoria', categoriaNome],
                                           ['Tipo', formData.tipoEvento],
                                           ['Período', resumoPeriodo],
                                           ['Horário', resumoHorario],
                                           [
                                              'Capacidade (pessoas)',
                                              formData.capacidadeMaxima
                                                 ? `${formData.capacidadeMaxima} pessoas`
                                                 : '100 pessoas (padrão)',
                                           ],
                                           ['Local', resumoLocal],
                                           [
                                              'Localização',
                                              formData.LocalLatitude && formData.LocalLongitude
                                                 ? `${formData.LocalLatitude}, ${formData.LocalLongitude}`
                                                 : 'Não informada',
                                           ],
                                           ['Situação', 'Rascunho'],
                                        ] as [string, string][]
                                    ).map(([label, value]) => (
                                       <div key={label} className="flex justify-between gap-4">
                                          <span className="text-muted-foreground shrink-0">{label}:</span>
                                          <span className="text-right truncate">{value || '-'}</span>
                                       </div>
                                    ))}
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
                              Voltar
                           </Button>
                        )}

                        <div className="flex-1" />

                        <Button type="button" variant="outline" onClick={onClose} size="lg">
                           Cancelar
                        </Button>

                        {currentStep < totalSteps && (
                           <Button type="button" onClick={nextStep} size="lg" className="flex items-center gap-2">
                              Continuar
                              <ChevronRight className="w-4 h-4" />
                           </Button>
                        )}

                        {currentStep === totalSteps && (
                           <Button
                              type="submit"
                              size="lg"
                              className="flex items-center gap-2"
                              disabled={!!errors4.LocalLatitude || !!errors4.LocalLongitude}
                           >
                              <Check className="w-4 h-4" />
                              {editingEvent ? 'Salvar Alterações' : 'Enviar Solicitação'}
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
