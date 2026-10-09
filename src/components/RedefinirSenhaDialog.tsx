'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp'
import { Eye, EyeOff, KeyRound, Lock, Mail, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError, esqueciSenha, redefinirSenha } from '@/data/data'

interface RedefinirSenhaDialogProps {
   open: boolean
   onOpenChange: (open: boolean) => void
   /** E-mail vindo do login (quando o usuário já digitou algo). */
   emailInicial?: string
   /** Chamado com o e-mail quando a senha é redefinida com sucesso. */
   onConcluido?: (email: string) => void
}

/** Regras da API: código de 6 dígitos, válido por 15 min, máx. 5 tentativas. */
const CODIGO_MINUTOS_VALIDOS = 15
const COOLDOWN_REENVIO = 60

type Etapa = 'email' | 'codigo'

const CAMPO_VAZIO = { codigo: '', novaSenha: '', confirmar: '' }

export function RedefinirSenhaDialog({ open, onOpenChange, emailInicial, onConcluido }: RedefinirSenhaDialogProps) {
   const [etapa, setEtapa] = useState<Etapa>('email')
   const [email, setEmail] = useState(emailInicial ?? '')
   const [campos, setCampos] = useState(CAMPO_VAZIO)
   const [senhasVisiveis, setSenhasVisiveis] = useState({ nova: false, confirmar: false })
   const [enviandoCodigo, setEnviandoCodigo] = useState(false)
   const [redefinindo, setRedefinindo] = useState(false)
   const [reenviando, setReenviando] = useState(false)
   const [erroCodigo, setErroCodigo] = useState<string | null>(null)
   const [cooldown, setCooldown] = useState(0)

   const inputCodigoRef = useRef<HTMLInputElement>(null)

   const codigoCompleto = campos.codigo.length === 6
   const senhaValida = campos.novaSenha.length >= 6
   const confirmacaoConfere = campos.confirmar.length > 0 && campos.confirmar === campos.novaSenha
   const requisitosAtendidos = [senhaValida, confirmacaoConfere]
   const requisitosTitulos = ['Mínimo de 6 caracteres', 'Confirmação confere'] as const
   const etapa2Valida = codigoCompleto && senhaValida && confirmacaoConfere

   const setEmailCampo = (valor: string) => setEmail(valor)

   const setCampo = (campo: keyof typeof CAMPO_VAZIO, valor: string) => {
      setCampos((prev) => ({ ...prev, [campo]: valor }))
      if (campo === 'codigo') setErroCodigo(null)
   }

   const alternarVisibilidade = (campo: keyof typeof senhasVisiveis) =>
      setSenhasVisiveis((prev) => ({ ...prev, [campo]: !prev[campo] }))

   // Cooldown de reenvio: intervalo limpo ao zerar/desmontar
   useEffect(() => {
      if (cooldown <= 0) return
      const id = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000)
      return () => clearInterval(id)
   }, [cooldown])

   // Volta à etapa inicial (com o e-mail de partida) cada vez que o diálogo abre
   useEffect(() => {
      if (open) {
         setEtapa('email')
         setEmail(emailInicial ?? '')
         setCampos(CAMPO_VAZIO)
         setSenhasVisiveis({ nova: false, confirmar: false })
         setErroCodigo(null)
         setCooldown(0)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open])

   const handleClose = (novoAberto: boolean) => {
      if (!novoAberto && !enviandoCodigo && !redefinindo) {
         onOpenChange(false)
      }
   }

   const solicitarCodigo = async () => {
      setEnviandoCodigo(true)
      try {
         await esqueciSenha(email)
         setEtapa('codigo')
         setCooldown(COOLDOWN_REENVIO)
         toast.info(`Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos. Vale ${CODIGO_MINUTOS_VALIDOS} minutos.`)
      } catch (error) {
         if (error instanceof ApiError) {
            toast.error(error.message)
         } else {
            toast.error('Erro de conexão. Tente novamente.')
         }
      } finally {
         setEnviandoCodigo(false)
      }
   }

   const handleEnviarEmail = async (e: React.FormEvent) => {
      e.preventDefault()
      await solicitarCodigo()
   }

   const handleReenviar = async () => {
      setReenviando(true)
      try {
         await solicitarCodigo()
      } finally {
         setReenviando(false)
      }
   }

   const handleRedefinir = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!etapa2Valida) {
         toast.error('Informe o código de 6 dígitos e cumpra os requisitos da nova senha.')
         return
      }
      setRedefinindo(true)
      try {
         await redefinirSenha({ email, codigo: campos.codigo, novaSenha: campos.novaSenha })
         toast.success('Senha redefinida! Agora faça login com a nova senha.')
         onConcluido?.(email)
         onOpenChange(false)
      } catch (error) {
         if (error instanceof ApiError) {
            setErroCodigo(error.message)
            toast.error(error.message)
            focusCodigo()
         } else {
            toast.error('Erro de conexão. Tente novamente.')
         }
      } finally {
         setRedefinindo(false)
      }
   }

   // Foco volta para o OTP quando um erro de código acontece (React.Aria-friendly)
   function focusCodigo() {
      inputCodigoRef.current?.focus()
   }

   const voltarParaEmail = () => {
      setEtapa('email')
      setCampos(CAMPO_VAZIO)
      setErroCodigo(null)
      setCooldown(0)
   }

   return (
      <Dialog open={open} onOpenChange={handleClose}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                  <KeyRound className="size-5 text-primary" aria-hidden="true" />
                  Redefinir senha
               </DialogTitle>
               <DialogDescription>
                  {etapa === 'email'
                     ? 'Informe seu e-mail para receber um código de recuperação.'
                     : `Enviamos um código para ${email ?? 'seu e-mail'}. Ele vale ${CODIGO_MINUTOS_VALIDOS} minutos.`}
               </DialogDescription>
               <TrilhaEtapa etapa={etapa} />
            </DialogHeader>

            {etapa === 'email' ? (
               <form onSubmit={handleEnviarEmail} className="space-y-4" noValidate>
                  <div className="space-y-2">
                     <Label htmlFor="redefinir-email">E-mail</Label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                           id="redefinir-email"
                           type="email"
                           placeholder="seu@email.com"
                           className="pl-10"
                           autoComplete="email"
                           autoFocus
                           value={email}
                           onChange={(e) => setEmailCampo(e.target.value)}
                           required
                        />
                     </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={enviandoCodigo}>
                        Cancelar
                     </Button>
                     <Button type="submit" disabled={enviandoCodigo || email.trim().length === 0}>
                        {enviandoCodigo ? 'Enviando...' : 'Enviar código'}
                     </Button>
                  </div>
               </form>
            ) : (
               <form onSubmit={handleRedefinir} className="space-y-4" noValidate>
                  <div className="space-y-2">
                     <Label htmlFor="redefinir-codigo">Código de 6 dígitos</Label>
                     <InputOTP
                        id="redefinir-codigo"
                        ref={inputCodigoRef}
                        inputMode="numeric"
                        maxLength={6}
                        pattern="^[0-9]*$"
                        aria-invalid={!!erroCodigo}
                        aria-describedby={erroCodigo ? 'erro-codigo' : undefined}
                        value={campos.codigo}
                        onChange={(valor) => setCampo('codigo', valor.replace(/\D/g, '').slice(0, 6))}
                        className="w-full"
                     >
                        <InputOTPGroup className="w-full grid grid-cols-6">
                           {[0, 1, 2, 3, 4, 5].map((indice) => (
                              <InputOTPSlot key={indice} index={indice} className="h-11 w-full text-base font-medium" />
                           ))}
                        </InputOTPGroup>
                     </InputOTP>
                     {erroCodigo ? (
                        <p id="erro-codigo" className="text-xs text-destructive">
                           {erroCodigo}
                        </p>
                     ) : (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                           <Timer className="size-3.5" aria-hidden="true" />
                           Vale {CODIGO_MINUTOS_VALIDOS} minutos · máx. 5 tentativas
                        </p>
                     )}
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="redefinir-nova-senha">Nova senha</Label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                           id="redefinir-nova-senha"
                           type={senhasVisiveis.nova ? 'text' : 'password'}
                           autoComplete="new-password"
                           className="pl-10 pr-10"
                           aria-describedby="requisitos-nova-senha"
                           minLength={6}
                           value={campos.novaSenha}
                           onChange={(e) => setCampo('novaSenha', e.target.value)}
                           required
                        />
                        <BotaoVisibilidade
                           visivel={senhasVisiveis.nova}
                           onToggle={() => alternarVisibilidade('nova')}
                           rotulo="nova senha"
                        />
                     </div>

                     <ul id="requisitos-nova-senha" className="space-y-1 pt-1">
                        {requisitosTitulos.map((titulo, indice) => {
                           const atendido = requisitosAtendidos[indice]
                           return (
                              <li
                                 key={titulo}
                                 className={`flex items-center gap-2 text-xs transition-colors ${
                                    atendido ? 'text-emerald-600' : 'text-muted-foreground'
                                 }`}
                              >
                                 <span
                                    className={`size-1.5 rounded-full shrink-0 transition-colors ${
                                       atendido ? 'bg-emerald-600' : 'bg-muted-foreground/40'
                                    }`}
                                    aria-hidden="true"
                                 />
                                 <span className={atendido ? 'line-through' : undefined}>{titulo}</span>
                              </li>
                           )
                        })}
                     </ul>
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="redefinir-confirmar">Confirmar nova senha</Label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                           id="redefinir-confirmar"
                           type={senhasVisiveis.confirmar ? 'text' : 'password'}
                           autoComplete="new-password"
                           className="pl-10 pr-10"
                           minLength={6}
                           value={campos.confirmar}
                           onChange={(e) => setCampo('confirmar', e.target.value)}
                           required
                        />
                        <BotaoVisibilidade
                           visivel={senhasVisiveis.confirmar}
                           onToggle={() => alternarVisibilidade('confirmar')}
                           rotulo="confirmação da nova senha"
                        />
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                     <Button type="submit" disabled={redefinindo || !etapa2Valida}>
                        {redefinindo ? 'Redefinindo...' : 'Redefinir senha'}
                     </Button>
                     <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <Button
                           type="button"
                           variant="ghost"
                           className="h-auto px-2 py-1 text-xs text-muted-foreground"
                           onClick={voltarParaEmail}
                           disabled={reenviando || redefinindo}
                        >
                           Usar outro e-mail
                        </Button>
                        <Button
                           type="button"
                           variant="ghost"
                           className="h-auto px-2 py-1 text-xs text-muted-foreground"
                           onClick={handleReenviar}
                           disabled={reenviando || redefinindo || cooldown > 0}
                        >
                           {cooldown > 0 ? `Reenviar em 0:${cooldown.toString().padStart(2, '0')}` : reenviando ? 'Reenviando...' : 'Reenviar código'}
                        </Button>
                     </div>
                  </div>
               </form>
            )}
         </DialogContent>
      </Dialog>
   )
}

/** Trilha de 2 etapas: a sequência é real, então a progressão codifica informação. */
function TrilhaEtapa({ etapa }: { etapa: Etapa }) {
   const segundaAtiva = etapa === 'codigo'
   return (
      <div className="flex items-center gap-2" aria-hidden="true">
         <span className={`h-1.5 flex-1 rounded-full transition-colors ${segundaAtiva ? 'bg-primary' : 'bg-primary/50'}`} />
         <span className={`h-1.5 flex-1 rounded-full transition-colors ${segundaAtiva ? 'bg-primary' : 'bg-muted'}`} />
      </div>
   )
}

function BotaoVisibilidade({ visivel, onToggle, rotulo }: { visivel: boolean; onToggle: () => void; rotulo: string }) {
   return (
      <button
         type="button"
         onClick={onToggle}
         className="absolute right-1 top-1/2 -translate-y-1/2 rounded-sm p-2 text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
         aria-pressed={visivel}
      >
         {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
         <span className="sr-only">{visivel ? `Ocultar ${rotulo}` : `Mostrar ${rotulo}`}</span>
      </button>
   )
}
