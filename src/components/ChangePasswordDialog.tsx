'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { alterarSenha, ApiError } from '@/data/data'

interface ChangePasswordDialogProps {
   open: boolean
   onOpenChange: (open: boolean) => void
}

/** Requisitos reais da API (PATCH /api/auth/senha / erros 400): mín. 6, diferente da atual. */
const TITULOS_REQUISITO = ['Mínimo de 6 caracteres', 'Diferente da senha atual', 'Confirmação confere'] as const

const CAMPO_VAZIO = { senhaAtual: '', novaSenha: '', confirmar: '' }

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
   const { token } = useAuth()
   const [campos, setCampos] = useState(CAMPO_VAZIO)
   const [visiveis, setVisiveis] = useState({ senhaAtual: false, nova: false, confirmar: false })
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [erroSenhaAtual, setErroSenhaAtual] = useState<string | null>(null)

   const cincoOuMais = campos.novaSenha.length >= 6
   const difereDaAtual = campos.novaSenha.length > 0 && campos.novaSenha !== campos.senhaAtual
   const confirmacaoConfere = campos.confirmar.length > 0 && campos.confirmar === campos.novaSenha
   const requisitosAtendidos = [cincoOuMais, difereDaAtual, confirmacaoConfere]

   const setCampo = (campo: keyof typeof CAMPO_VAZIO, valor: string) => {
      setCampos((prev) => ({ ...prev, [campo]: valor }))
      if (campo === 'senhaAtual') setErroSenhaAtual(null)
   }

   const alternarVisibilidade = (campo: keyof typeof visiveis) =>
      setVisiveis((prev) => ({ ...prev, [campo]: !prev[campo] }))

   const handleClose = (novoAberto: boolean) => {
      if (!novoAberto && !isSubmitting) {
         setCampos(CAMPO_VAZIO)
         setVisiveis({ senhaAtual: false, nova: false, confirmar: false })
         setErroSenhaAtual(null)
      }
      onOpenChange(novoAberto)
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setErroSenhaAtual(null)

      if (!cincoOuMais || !difereDaAtual || campos.confirmar !== campos.novaSenha) {
         toast.error('Cumpra os requisitos abaixo antes de salvar.')
         return
      }

      setIsSubmitting(true)
      try {
         await alterarSenha({ senhaAtual: campos.senhaAtual, novaSenha: campos.novaSenha }, token)
         toast.success('Senha alterada.')
         setCampos(CAMPO_VAZIO)
         setVisiveis({ senhaAtual: false, nova: false, confirmar: false })
         onOpenChange(false)
      } catch (error) {
         if (error instanceof ApiError && error.status === 401) {
            // Não autenticado de verdade é tratado no data.ts; aqui 401 é senha atual errada
            setErroSenhaAtual('Senha atual incorreta. Confira e tente de novo.')
         } else if (error instanceof ApiError) {
            toast.error(error.message)
         } else {
            toast.error('Erro de conexão. Tente novamente.')
         }
      } finally {
         setIsSubmitting(false)
      }
   }

   const classeInput = (temErro: boolean) => (temErro ? 'pl-10 border-destructive focus-visible:ring-destructive' : 'pl-10')

   return (
      <Dialog open={open} onOpenChange={handleClose}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                  <KeyRound className="size-5 text-primary" aria-hidden="true" />
                  Alterar senha
               </DialogTitle>
               <DialogDescription>
                  Sua sessão continua ativa; a nova senha vale já no próximo login.
               </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
               <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha atual</Label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                     <Input
                        id="senha-atual"
                        type={visiveis.senhaAtual ? 'text' : 'password'}
                        autoComplete="current-password"
                        className={classeInput(!!erroSenhaAtual)}
                        aria-invalid={!!erroSenhaAtual}
                        aria-describedby={erroSenhaAtual ? 'erro-senha-atual' : undefined}
                        value={campos.senhaAtual}
                        onChange={(e) => setCampo('senhaAtual', e.target.value)}
                        required
                     />
                     <BotaoVisibilidade
                        visivel={visiveis.senhaAtual}
                        onToggle={() => alternarVisibilidade('senhaAtual')}
                        rotulo="senha atual"
                     />
                  </div>
                  {erroSenhaAtual && (
                     <p id="erro-senha-atual" className="text-xs text-destructive">
                        {erroSenhaAtual}
                     </p>
                  )}
               </div>

               <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova senha</Label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                     <Input
                        id="nova-senha"
                        type={visiveis.nova ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="pl-10 pr-10"
                        aria-describedby="requisitos-nova-senha"
                        value={campos.novaSenha}
                        onChange={(e) => setCampo('novaSenha', e.target.value)}
                        required
                     />
                     <BotaoVisibilidade
                        visivel={visiveis.nova}
                        onToggle={() => alternarVisibilidade('nova')}
                        rotulo="nova senha"
                     />
                  </div>

                  <ul id="requisitos-nova-senha" className="space-y-1 pt-1">
                     {TITULOS_REQUISITO.map((titulo, indice) => {
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
                  <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                     <Input
                        id="confirmar-senha"
                        type={visiveis.confirmar ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="pl-10 pr-10"
                        value={campos.confirmar}
                        onChange={(e) => setCampo('confirmar', e.target.value)}
                        required
                     />
                     <BotaoVisibilidade
                        visivel={visiveis.confirmar}
                        onToggle={() => alternarVisibilidade('confirmar')}
                        rotulo="confirmação da nova senha"
                     />
                  </div>
               </div>

               <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
                     Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                     {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>
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
