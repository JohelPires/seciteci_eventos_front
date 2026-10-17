import { AlertCircle, HandCoins, Plus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import type { Financiador } from '@/app/page'

export const MAX_FINANCIADORES = 20
export const MAX_NOME_FINANCIADOR_CHARS = 150

/** Valor sentinela do Select para financiador sem tipo (a API aceita tipo opcional). */
const VALOR_SEM_TIPO = 'sem-tipo'

const TIPOS_FINANCIADOR = [
   { valor: 'publico', rotulo: 'Público' },
   { valor: 'privado', rotulo: 'Privado' },
   { valor: 'hibrido', rotulo: 'Híbrido' },
] as const

interface FinanciadoresFieldProps {
   value: Financiador[]
   onChange: (financiadores: Financiador[]) => void
   error?: string
}

function ErroFinanciadores({ mensagem }: { mensagem?: string }) {
   if (!mensagem) return null
   return (
      <motion.p
         initial={{ opacity: 0, y: -4 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-1 text-xs text-red-500 mt-1"
      >
         <AlertCircle className="w-3 h-3 shrink-0" />
         {mensagem}
      </motion.p>
   )
}

export function FinanciadoresField({ value, onChange, error }: FinanciadoresFieldProps) {
   const limiteAtingido = value.length >= MAX_FINANCIADORES

   const adicionar = () => onChange([...value, { nome: '', tipo: undefined }])

   const remover = (indice: number) => onChange(value.filter((_, i) => i !== indice))

   const alterarNome = (indice: number, nome: string) =>
      onChange(value.map((f, i) => (i === indice ? { ...f, nome } : f)))

   const alterarTipo = (indice: number, tipo: string) =>
      onChange(
         value.map((f, i) =>
            i === indice
               ? { ...f, tipo: tipo === VALOR_SEM_TIPO ? undefined : (tipo as Financiador['tipo']) }
               : f,
         ),
      )

   return (
      <div className="space-y-2">
         <Label>
            Financiadores (opcional)
            <span className="text-xs text-muted-foreground ml-2">
               ({value.length}/{MAX_FINANCIADORES})
            </span>
         </Label>

         {value.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
               <div className="p-2.5 rounded-lg bg-muted">
                  <HandCoins className="w-5 h-5 text-foreground/70" />
               </div>
               <p className="text-sm text-muted-foreground">Nenhum financiador adicionado</p>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionar}
                  className="flex items-center gap-1.5"
               >
                  <Plus className="w-4 h-4" />
                  Adicionar financiador
               </Button>
            </div>
         ) : (
            <>
               <div className="space-y-3">
                  {value.map((financiador, indice) => (
                     <div key={indice} className="rounded-lg border border-border p-3">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_11rem_auto] items-start gap-3">
                           <div className="space-y-1.5">
                              <Label htmlFor={`financiador-nome-${indice}`} className="sr-only">
                                 Nome do financiador {indice + 1}
                              </Label>
                              <Input
                                 id={`financiador-nome-${indice}`}
                                 placeholder="Ex: Governo do Estado de Mato Grosso"
                                 maxLength={MAX_NOME_FINANCIADOR_CHARS}
                                 value={financiador.nome}
                                 onChange={(e) => alterarNome(indice, e.target.value)}
                                 aria-label={`Nome do financiador ${indice + 1}`}
                              />
                           </div>

                           <Select
                              value={financiador.tipo ?? VALOR_SEM_TIPO}
                              onValueChange={(valor) => alterarTipo(indice, valor)}
                           >
                              <SelectTrigger
                                 id={`financiador-tipo-${indice}`}
                                 aria-label={`Tipo do financiador ${indice + 1}`}
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value={VALOR_SEM_TIPO}>Não informado</SelectItem>
                                 {TIPOS_FINANCIADOR.map((tipo) => (
                                    <SelectItem key={tipo.valor} value={tipo.valor}>
                                       {tipo.rotulo}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>

                           <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remover(indice)}
                              aria-label={`Remover financiador ${indice + 1}`}
                              className="text-muted-foreground hover:text-destructive"
                           >
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>

               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionar}
                  disabled={limiteAtingido}
                  className="flex items-center gap-1.5"
               >
                  <Plus className="w-4 h-4" />
                  {limiteAtingido ? 'Limite de financiadores atingido' : 'Adicionar financiador'}
               </Button>
            </>
         )}

         <ErroFinanciadores mensagem={error} />
      </div>
   )
}
