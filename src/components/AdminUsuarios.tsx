import { use, useEffect, useState } from 'react'
import { Edit, Trash2, Search, Check, X, User, Mail, Calendar } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useQuery } from '@tanstack/react-query'
import { getUsuarios } from '@/data/data'
import { useAuth } from '@/context/AuthContext'

export interface Usuario {
   id: string
   nome: string
   email: string
   tipo: 'admin' | 'organizador' | 'participante'
   status: 'ativo' | 'inativo' | 'pendente'
   dataCadastro: string
   ultimoAcesso?: string
}

interface AdminUsuariosProps {
   // usuarios: Usuario[]
   onEditUsuario: (usuario: Usuario) => void
   onDeleteUsuario: (id: string) => void
   onToggleStatus: (id: string) => void
}

export function AdminUsuarios({ onEditUsuario, onDeleteUsuario, onToggleStatus }: AdminUsuariosProps) {
   const [searchTerm, setSearchTerm] = useState('')
   const [tipoFilter, setTipoFilter] = useState<string>('all')
   const [statusFilter, setStatusFilter] = useState<string>('all')
   const [usuarios, setUsuarios] = useState<Usuario[]>([])

   const { user, token } = useAuth()

   const { data, error, isLoading } = useQuery({
      queryKey: ['Usuarios', { token, search: searchTerm }],
      queryFn: getUsuarios,
   })

   useEffect(() => {
      if (data) {
         setUsuarios(data.usuarios)
         console.log(data.usuarios)
      }
   }, [data])

   // Filter usuarios based on search term and filters
   const filteredUsuarios = usuarios.filter((usuario) => {
      const matchesSearch =
         usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTipo = tipoFilter === 'all' || usuario.tipo === tipoFilter
      const matchesStatus = statusFilter === 'all' || usuario.status === statusFilter

      return matchesSearch && matchesTipo && matchesStatus
   })

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'ativo':
            return 'bg-green-500 hover:bg-green-600'
         case 'inativo':
            return 'bg-red-500 hover:bg-red-600'
         case 'pendente':
            return 'bg-yellow-500 hover:bg-yellow-600'
         default:
            return 'bg-gray-500 hover:bg-gray-600'
      }
   }

   const getTipoLabel = (tipo: string) => {
      switch (tipo) {
         case 'admin':
            return 'Administrador'
         case 'organizador':
            return 'Organizador'
         case 'participante':
            return 'Participante'
         default:
            return tipo
      }
   }

   const getTipoColor = (tipo: string) => {
      switch (tipo) {
         case 'admin':
            return 'bg-purple-500 hover:bg-purple-600'
         case 'organizador':
            return 'bg-blue-500 hover:bg-blue-600'
         case 'participante':
            return 'bg-gray-500 hover:bg-gray-600'
         default:
            return 'bg-gray-500 hover:bg-gray-600'
      }
   }

   return (
      <Card className="min-h-screen">
         <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>Visualize e gerencie todos os usuários da plataforma</CardDescription>
         </CardHeader>
         <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                     placeholder="Buscar usuários por nome ou email..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10"
                  />
               </div>
               <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                     <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todos os Tipos</SelectItem>
                     <SelectItem value="admin">Administrador</SelectItem>
                     <SelectItem value="organizador">Organizador</SelectItem>
                     <SelectItem value="participante">Participante</SelectItem>
                  </SelectContent>
               </Select>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                     <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todos os Status</SelectItem>
                     <SelectItem value="ativo">Ativo</SelectItem>
                     <SelectItem value="inativo">Inativo</SelectItem>
                     <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredUsuarios.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhum usuário encontrado
                           </TableCell>
                        </TableRow>
                     ) : (
                        filteredUsuarios.map((usuario) => (
                           <TableRow key={usuario.id}>
                              <TableCell className="font-medium">
                                 <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    {usuario.nome}
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    {usuario.email}
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <Badge className={`${getTipoColor(usuario.tipo)} text-white border-0`}>
                                    {getTipoLabel(usuario.tipo)}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 <Badge className={`${getStatusColor(usuario.status)} text-white border-0`}>
                                    {usuario.status}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {new Date(usuario.dataCadastro).toLocaleDateString('pt-BR', {
                                       day: '2-digit',
                                       month: '2-digit',
                                       year: 'numeric',
                                    })}
                                 </div>
                              </TableCell>
                              <TableCell>
                                 {usuario.ultimoAcesso ? (
                                    <div className="flex items-center gap-2">
                                       <Calendar className="w-4 h-4 text-muted-foreground" />
                                       {new Date(usuario.ultimoAcesso).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                       })}
                                    </div>
                                 ) : (
                                    <span className="text-muted-foreground text-sm">Nunca acessou</span>
                                 )}
                              </TableCell>
                              <TableCell className="text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => onToggleStatus(usuario.id)}
                                       className={usuario.status === 'ativo' ? 'text-destructive' : 'text-green-600'}
                                    >
                                       {usuario.status === 'ativo' ? (
                                          <X className="w-4 h-4" />
                                       ) : (
                                          <Check className="w-4 h-4" />
                                       )}
                                       {usuario.status === 'ativo' ? 'Desativar' : 'Ativar'}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onEditUsuario(usuario)}>
                                       <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => {
                                          if (confirm('Tem certeza que deseja excluir este usuário?')) {
                                             onDeleteUsuario(usuario.id)
                                          }
                                       }}
                                       className="text-destructive hover:text-destructive"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ))
                     )}
                  </TableBody>
               </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
               Mostrando {filteredUsuarios.length} de {usuarios.length} usuários
            </div>
         </CardContent>
      </Card>
   )
}
