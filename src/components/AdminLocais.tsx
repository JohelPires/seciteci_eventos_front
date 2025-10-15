import { useState } from 'react'
import { Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { toast } from 'sonner'
import type { Local, Event } from '@/app/page'

interface AdminLocaisProps {
   locais: Local[]
   events: Event[]
   onUpdateLocais: (locais: Local[]) => void
}

export function AdminLocais({ locais, events, onUpdateLocais }: AdminLocaisProps) {
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [editingLocal, setEditingLocal] = useState<Local | null>(null)
   const [formData, setFormData] = useState({
      nome: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      capacidade: '',
      latitude: '',
      longitude: '',
   })

   const handleOpenDialog = (local?: Local) => {
      if (local) {
         setEditingLocal(local)
         setFormData({
            nome: local.nome,
            endereco: local.endereco,
            numero: local.numero,
            complemento: local.complemento || '',
            bairro: local.bairro,
            cidade: local.cidade,
            estado: local.estado,
            cep: local.cep,
            capacidade: local.capacidade.toString(),
            latitude: local.latitude.toString(),
            longitude: local.longitude.toString(),
         })
      } else {
         setEditingLocal(null)
         setFormData({
            nome: '',
            endereco: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: '',
            capacidade: '',
            latitude: '',
            longitude: '',
         })
      }
      setIsDialogOpen(true)
   }

   const handleSave = () => {
      if (!formData.nome.trim() || !formData.cidade.trim() || !formData.estado.trim()) {
         toast.error('Preencha todos os campos obrigatórios')
         return
      }

      const localData = {
         nome: formData.nome,
         endereco: formData.endereco,
         numero: formData.numero,
         complemento: formData.complemento,
         bairro: formData.bairro,
         cidade: formData.cidade,
         estado: formData.estado,
         cep: formData.cep,
         capacidade: parseInt(formData.capacidade) || 0,
         latitude: parseFloat(formData.latitude) || 0,
         longitude: parseFloat(formData.longitude) || 0,
      }

      if (editingLocal) {
         // Edit existing
         const updated = locais.map((l) => (l.id === editingLocal.id ? { ...l, ...localData } : l))
         onUpdateLocais(updated)
         toast.success('Local atualizado com sucesso!')
      } else {
         // Add new
         const newId = Math.max(...locais.map((l) => l.id), 0) + 1
         const newLocal: Local = { id: newId, ...localData }
         onUpdateLocais([...locais, newLocal])
         toast.success('Local criado com sucesso!')
      }

      setIsDialogOpen(false)
   }

   const handleDelete = (id: number) => {
      const eventsWithLocal = events.filter((e) => e.localId === id)

      if (eventsWithLocal.length > 0) {
         toast.error(`Não é possível excluir. Existem ${eventsWithLocal.length} evento(s) usando este local.`)
         return
      }

      if (confirm('Tem certeza que deseja excluir este local?')) {
         onUpdateLocais(locais.filter((l) => l.id !== id))
         toast.success('Local excluído com sucesso!')
      }
   }

   const getEventCount = (localId: number) => {
      return events.filter((e) => e.localId === localId).length
   }

   return (
      <Card>
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>Gerenciar Locais</CardTitle>
                  <CardDescription>Adicione, edite ou remova locais de eventos</CardDescription>
               </div>
               <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                     <Button onClick={() => handleOpenDialog()} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Novo Local
                     </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                     <DialogHeader>
                        <DialogTitle>{editingLocal ? 'Editar Local' : 'Novo Local'}</DialogTitle>
                        <DialogDescription>Preencha os dados do local</DialogDescription>
                     </DialogHeader>
                     <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="nome">Nome do Local*</Label>
                              <Input
                                 id="nome"
                                 placeholder="Ex: Auditório Principal"
                                 value={formData.nome}
                                 onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="endereco">Endereço*</Label>
                              <Input
                                 id="endereco"
                                 placeholder="Ex: Av. Paulista"
                                 value={formData.endereco}
                                 onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="numero">Número*</Label>
                              <Input
                                 id="numero"
                                 placeholder="Ex: 1000"
                                 value={formData.numero}
                                 onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="complemento">Complemento</Label>
                              <Input
                                 id="complemento"
                                 placeholder="Ex: Sala 101"
                                 value={formData.complemento}
                                 onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="bairro">Bairro*</Label>
                              <Input
                                 id="bairro"
                                 placeholder="Ex: Centro"
                                 value={formData.bairro}
                                 onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="cidade">Cidade*</Label>
                              <Input
                                 id="cidade"
                                 placeholder="Ex: São Paulo"
                                 value={formData.cidade}
                                 onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="estado">Estado (UF)*</Label>
                              <Input
                                 id="estado"
                                 placeholder="Ex: SP"
                                 maxLength={2}
                                 value={formData.estado}
                                 onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="cep">CEP</Label>
                              <Input
                                 id="cep"
                                 placeholder="Ex: 01310-100"
                                 value={formData.cep}
                                 onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="capacidade">Capacidade</Label>
                              <Input
                                 id="capacidade"
                                 type="number"
                                 placeholder="Ex: 500"
                                 value={formData.capacidade}
                                 onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="latitude">Latitude</Label>
                              <Input
                                 id="latitude"
                                 type="number"
                                 step="any"
                                 placeholder="Ex: -23.5505"
                                 value={formData.latitude}
                                 onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label htmlFor="longitude">Longitude</Label>
                              <Input
                                 id="longitude"
                                 type="number"
                                 step="any"
                                 placeholder="Ex: -46.6333"
                                 value={formData.longitude}
                                 onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                              />
                           </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                           <Button onClick={handleSave} className="flex-1">
                              {editingLocal ? 'Atualizar' : 'Criar'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {locais.map((local) => (
                  <Card key={local.id}>
                     <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                           <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                 <MapPin className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                 <h4 className="font-medium">{local.nome}</h4>
                                 <p className="text-sm text-muted-foreground">
                                    {local.cidade}, {local.estado}
                                 </p>
                              </div>
                           </div>
                           <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(local)}>
                                 <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleDelete(local.id)}
                                 className="text-destructive hover:text-destructive"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                        </div>
                        <div className="space-y-1 text-sm">
                           <p className="text-muted-foreground">
                              {local.endereco}, {local.numero}
                              {local.complemento && ` - ${local.complemento}`}
                           </p>
                           <p className="text-muted-foreground">
                              {local.bairro} • CEP: {local.cep}
                           </p>
                           <div className="flex items-center justify-between pt-2 mt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                 Capacidade: {local.capacidade} pessoas
                              </span>
                              <span className="text-xs text-muted-foreground">{getEventCount(local.id)} eventos</span>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </CardContent>
      </Card>
   )
}
