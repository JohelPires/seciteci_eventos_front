import { useState } from 'react'
import { Edit, Trash2, Eye, Search, Globe, CircleX } from 'lucide-react'
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
import { EventDetails } from './EventDetails'
import type { Event, Categoria } from '@/app/page'
import { useAuth } from '@/context/AuthContext'

interface AdminEventosProps {
    events: Event[]
    categorias: Categoria[]
    // locais: Local[]
    onEditEvent: (event: Event) => void
    onDeleteEvent: (id: string) => void
    onPublicarEvent: (id: string) => void
    onCancelarEvent: (id: string) => void
}

const ITEMS_PER_PAGE = 10

export function AdminEventos({
    events,
    categorias,
    // locais,
    onEditEvent,
    onDeleteEvent,
    onPublicarEvent,
    onCancelarEvent,
}: AdminEventosProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [currentPage, setCurrentPage] = useState(1)

    //  const { user, token } = useAuth()

    const getCategoria = (id: number) => categorias.find((c) => c.id === id)
    // const getLocal = (id: number) => locais.find((l) => l.id === id)

    const filteredEvents = events.filter((event) => {
        const matchesSearch =
            event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus =
            statusFilter === 'all' || event.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    )

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value)
        setCurrentPage(1)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'publicado':
                return 'bg-green-600'
            case 'rascunho':
                return 'bg-yellow-600'
            case 'cancelado':
                return 'bg-red-600'
            default:
                return 'bg-gray-600'
        }
    }

    const handleViewEvent = (event: Event) => {
        setSelectedEvent(event)
    }

    const handleCloseEventDetails = () => {
        setSelectedEvent(null)
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Eventos</CardTitle>
                    <CardDescription>
                        Visualize e gerencie todos os eventos da plataforma
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar eventos..."
                                value={searchTerm}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={handleStatusFilterChange}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todos os Status
                                </SelectItem>
                                <SelectItem value="publicado">
                                    Publicado
                                </SelectItem>
                                <SelectItem value="rascunho">
                                    Pendente
                                </SelectItem>
                                <SelectItem value="cancelado">
                                    Cancelado
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Local</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">
                                        Ações
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Nenhum evento encontrado
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedEvents.map((event) => {
                                        const categoria = getCategoria(
                                            event.categoriaId,
                                        )
                                        // const local = getLocal(event.localId)

                                        return (
                                            <TableRow key={event.id}>
                                                <TableCell className="font-medium">
                                                    {event.titulo}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        event.dataInicio,
                                                    ).toLocaleDateString(
                                                        'pt-BR',
                                                        {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </TableCell>
                                                <TableCell>local</TableCell>
                                                <TableCell>
                                                    {categoria && (
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${categoria.cor}`}
                                                            />
                                                            <span className="text-sm">
                                                                {categoria.nome}
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${getStatusColor(event.status)} text-white border-0`}
                                                    >
                                                        {event.status ===
                                                        'rascunho'
                                                            ? 'pendente'
                                                            : event.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {event.tipoEvento}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {event.status ===
                                                        'rascunho' ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    onPublicarEvent(
                                                                        event.id,
                                                                    )
                                                                }
                                                            >
                                                                <Globe className="w-4 h-4" />{' '}
                                                                Publicar
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    onCancelarEvent(
                                                                        event.id,
                                                                    )
                                                                }
                                                            >
                                                                <CircleX className="w-4 h-4" />{' '}
                                                                Cancelar
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleViewEvent(
                                                                    event,
                                                                )
                                                            }
                                                            title="Visualizar detalhes do evento"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                onEditEvent(
                                                                    event,
                                                                )
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
                                                                        'Tem certeza que deseja excluir este evento?',
                                                                    )
                                                                ) {
                                                                    onDeleteEvent(
                                                                        event.id,
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
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground">
                        Mostrando {filteredEvents.length} de {events.length}{' '}
                        eventos
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
                                                    isActive={
                                                        currentPage === page
                                                    }
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
                                                    Math.min(
                                                        totalPages,
                                                        prev + 1,
                                                    ),
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

            {/* Modal de detalhes do evento */}
            {selectedEvent && (
                <EventDetails
                    event={selectedEvent}
                    categoria={getCategoria(selectedEvent.categoriaId)}
                    onClose={handleCloseEventDetails}
                    onEdit={onEditEvent}
                    onDelete={onDeleteEvent}
                />
            )}
        </>
    )
}
