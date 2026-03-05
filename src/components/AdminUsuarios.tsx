import { useState } from 'react'
import {
    Edit,
    Trash2,
    Search,
    Check,
    X,
    User,
    Mail,
    Calendar,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table'
import { Badge } from './ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from './ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from './ui/pagination'
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
    onEditUsuario: (usuario: Usuario) => void
    onDeleteUsuario: (id: string) => void
    onToggleStatus: (id: string) => void
}

const ITEMS_PER_PAGE = 10

export function AdminUsuarios({
    onEditUsuario,
    onDeleteUsuario,
    onToggleStatus,
}: AdminUsuariosProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [tipoFilter, setTipoFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)

    const { user, token } = useAuth()

    // search is included in the query key to satisfy getUsuarios's type, but filtering
    // happens client-side for now. When evolving to server-side search, add debouncing
    // to searchTerm and remove the client-side filteredUsuarios filter below.
    const { data, error, isLoading } = useQuery({
        queryKey: ['Usuarios', { token, search: searchTerm }],
        queryFn: getUsuarios,
    })

    const usuarios: Usuario[] = data?.usuarios ?? []

    const filteredUsuarios = usuarios.filter((usuario) => {
        const matchesSearch =
            usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesTipo = tipoFilter === 'all' || usuario.tipo === tipoFilter
        const matchesStatus =
            statusFilter === 'all' || usuario.status === statusFilter

        return matchesSearch && matchesTipo && matchesStatus
    })

    const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE)
    const paginatedUsuarios = filteredUsuarios.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    )

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

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
                <CardDescription>
                    Visualize e gerencie todos os usuários da plataforma
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar usuários por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Data de Cadastro</TableHead>
                                <TableHead>Último Acesso</TableHead>
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        Carregando usuários...
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-destructive"
                                    >
                                        Erro ao carregar usuários. Tente
                                        novamente.
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsuarios.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        Nenhum usuário encontrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsuarios.map((usuario) => (
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
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                {new Date(
                                                    usuario.dataCadastro,
                                                ).toLocaleDateString('pt-BR', {
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
                                                    {new Date(
                                                        usuario.ultimoAcesso,
                                                    ).toLocaleDateString(
                                                        'pt-BR',
                                                        {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    Nunca acessou
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        onEditUsuario(usuario)
                                                    }
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                'Tem certeza que deseja excluir este usuário?',
                                                            )
                                                        ) {
                                                            onDeleteUsuario(
                                                                usuario.id,
                                                            )
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
                    Mostrando {filteredUsuarios.length} de {usuarios.length}{' '}
                    usuários
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(1, prev - 1),
                                            )
                                        }
                                        className={
                                            currentPage === 1
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>

                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1,
                                ).map((page) => {
                                    const showPage =
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 &&
                                            page <= currentPage + 1)

                                    const showEllipsisBefore =
                                        page === currentPage - 2 &&
                                        currentPage > 3
                                    const showEllipsisAfter =
                                        page === currentPage + 2 &&
                                        currentPage < totalPages - 2

                                    if (
                                        showEllipsisBefore ||
                                        showEllipsisAfter
                                    ) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )
                                    }

                                    if (!showPage) return null

                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() =>
                                                    setCurrentPage(page)
                                                }
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(totalPages, prev + 1),
                                            )
                                        }
                                        className={
                                            currentPage === totalPages
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
