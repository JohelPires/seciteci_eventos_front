import { use, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import type { Categoria, Event } from '@/app/page'
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from '@/data/data'
import { CardSkeleton } from './CardSkeleton'
import { useAuth } from '@/context/AuthContext'

interface AdminCategoriasProps {
   // categorias: Categoria[]
   events: Event[]
   // onUpdateCategorias: (categorias: Categoria[]) => void
}

export function AdminCategorias({ events }: AdminCategoriasProps) {
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
   const [nome, setNome] = useState('')
   const [cor, setCor] = useState('bg-blue-600')

   const { token } = useAuth()

   const queryClient = useQueryClient()

   const { data: categorias, isLoading } = useQuery({
      queryKey: ['categorias'],
      queryFn: getCategorias,
   })

   const createMutation = useMutation({
      mutationFn: (categoria: { nome: string; cor: string }) => createCategoria(categoria, token),

      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['categorias'] })
         toast.success('Categoria criada com sucesso!')
      },
   })

   const updateMutation = useMutation({
      mutationFn: (categoria: Categoria) => updateCategoria(categoria, token),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['categorias'] })
         toast.success('Categoria atualizada com sucesso!')
      },
   })

   const deleteMutation = useMutation({
      mutationFn: (id: string) => deleteCategoria(id, token),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['categorias'] })
         toast.success('Categoria excluída com sucesso!')
      },
   })

   if (isLoading) {
      return <CardSkeleton />
   }

   const cores = [
      { value: 'bg-blue-600', label: 'Azul' },
      { value: 'bg-slate-700', label: 'Cinza' },
      { value: 'bg-indigo-600', label: 'Índigo' },
      { value: 'bg-purple-600', label: 'Roxo' },
      { value: 'bg-orange-600', label: 'Laranja' },
      { value: 'bg-teal-600', label: 'Azul-verde' },
      { value: 'bg-green-600', label: 'Verde' },
      { value: 'bg-red-600', label: 'Vermelho' },
      { value: 'bg-pink-600', label: 'Rosa' },
      { value: 'bg-yellow-600', label: 'Amarelo' },
   ]

   const handleOpenDialog = (categoria?: Categoria) => {
      if (categoria) {
         setEditingCategoria(categoria)
         setNome(categoria.nome)
         setCor(categoria.cor)
      } else {
         setEditingCategoria(null)
         setNome('')
         setCor('bg-blue-600')
      }
      setIsDialogOpen(true)
   }

   const handleSave = () => {
      if (!nome.trim()) {
         toast.error('O nome da categoria é obrigatório')
         return
      }

      if (editingCategoria) {
         updateMutation.mutate({ ...editingCategoria, nome, cor })
      } else {
         createMutation.mutate({ nome, cor })
      }

      setIsDialogOpen(false)
   }

   const handleDelete = (id: number) => {
      const eventsWithCategory = events.filter((e) => e.categoriaId === id)

      if (eventsWithCategory.length > 0) {
         toast.error(`Não é possível excluir. Existem ${eventsWithCategory.length} evento(s) usando esta categoria.`)
         return
      }

      if (confirm('Tem certeza que deseja excluir esta categoria?')) {
         deleteMutation.mutate(String(id))
      }
   }

   const getEventCount = (categoriaId: number) => {
      return events.filter((e) => e.categoriaId === categoriaId).length
   }

   return (
      <div className="min-h-screen">
         <Card>
            <CardHeader>
               <div className="flex items-center justify-between">
                  <div>
                     <CardTitle>Gerenciar Categorias</CardTitle>
                     <CardDescription>Adicione, edite ou remova categorias de eventos</CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                     <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="gap-2">
                           <Plus className="w-4 h-4" />
                           Nova Categoria
                        </Button>
                     </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                           <DialogTitle>{editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                           <DialogDescription>Preencha os dados da categoria</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                           <div className="space-y-2">
                              <Label htmlFor="nome">Nome da Categoria*</Label>
                              <Input
                                 id="nome"
                                 placeholder="Ex: Tecnologia"
                                 value={nome}
                                 onChange={(e) => setNome(e.target.value)}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label htmlFor="cor">Cor</Label>
                              <Select value={cor} onValueChange={setCor}>
                                 <SelectTrigger id="cor">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {cores.map((c) => (
                                       <SelectItem key={c.value} value={c.value}>
                                          <div className="flex items-center gap-2">
                                             <div className={`w-4 h-4 rounded-full ${c.value}`} />
                                             {c.label}
                                          </div>
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="flex gap-2 pt-4">
                              <Button onClick={handleSave} className="flex-1">
                                 {editingCategoria ? 'Atualizar' : 'Criar'}
                              </Button>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                 Cancelar
                              </Button>
                           </div>
                        </div>
                     </DialogContent>
                  </Dialog>
               </div>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorias.map((categoria: Categoria) => (
                     <Card key={categoria.id} className="relative">
                        <CardContent className="p-4">
                           <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-lg ${categoria.cor} flex-shrink-0`} />
                                 <div>
                                    <h4 className="font-medium">{categoria.nome}</h4>
                                    <p className="text-sm text-muted-foreground">
                                       {getEventCount(categoria.id)} eventos
                                    </p>
                                 </div>
                              </div>
                              <div className="flex gap-1">
                                 <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(categoria)}>
                                    <Edit className="w-4 h-4" />
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(categoria.id)}
                                    className="text-destructive hover:text-destructive"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>
   )
}
