import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { motion } from 'framer-motion'
import type { Event, Categoria, Local } from '@/app/page'
import { ScrollArea } from '@radix-ui/react-scroll-area'

interface CalendarViewProps {
    events: Event[]
    categorias: Categoria[]
    // locais: Local[]
    onEventClick: (event: Event) => void
}

// capacidade fixa de pontos por dia: 2 linhas de pontos dentro da célula h-32
const MAX_DOTS_POR_DIA = 16

export function CalendarView({
    events,
    categorias,
    onEventClick,
}: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        return { daysInMonth, startingDayOfWeek, year, month }
    }

    const getEventsForDay = (day: number) => {
        const targetDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day,
            12,
            0,
            0, // evita problemas de timezone
        )

        return events.filter((event) => {
            const start = new Date(event.dataInicio)
            const end = new Date(event.dataFim ?? event.dataInicio)

            // normaliza horas
            start.setHours(0, 0, 0, 0)
            end.setHours(23, 59, 59, 999)

            return targetDate >= start && targetDate <= end
        })
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate((prevDate) => {
            const newDate = new Date(prevDate)
            if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1)
            else newDate.setMonth(newDate.getMonth() + 1)
            return newDate
        })
    }

    const goToToday = () => setCurrentDate(new Date())

    const handleMonthChange = (monthIndex: string) => {
        setCurrentDate(
            (prevDate) =>
                new Date(prevDate.getFullYear(), Number(monthIndex), 1),
        )
    }

    const handleYearChange = (year: string) => {
        setCurrentDate(
            (prevDate) => new Date(Number(year), prevDate.getMonth(), 1),
        )
    }

    const { daysInMonth, startingDayOfWeek, year, month } =
        getDaysInMonth(currentDate)
    const monthName = currentDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    })
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const today = new Date()
    const isCurrentMonth =
        today.getFullYear() === year && today.getMonth() === month

    // Lista de meses e anos (últimos 3 anos + próximos 3)
    const monthOptions = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
    ]
    const yearOptions = Array.from(
        { length: 7 },
        (_, i) => today.getFullYear() - 3 + i,
    )

    function onDayClick(day: number, month: number, year: number) {
        console.log(day, monthOptions[month], year)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="capitalize">{monthName}</h2>
                    {!isCurrentMonth && (
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Hoje
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {/* Select de Mês */}
                    <Select
                        onValueChange={handleMonthChange}
                        value={String(month)}
                    >
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map((m, i) => (
                                <SelectItem key={m} value={String(i)}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Select de Ano */}
                    <Select
                        onValueChange={handleYearChange}
                        value={String(year)}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="p-6">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-1">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-sm text-muted-foreground p-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells before first day of month */}
                    {Array.from({ length: startingDayOfWeek }).map(
                        (_, index) => (
                            <div key={`empty-${index}`} className="" />
                        ),
                    )}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1
                        const dayEvents = getEventsForDay(day)
                        const isToday =
                            isCurrentMonth && day === today.getDate()

                        return (
                            <Popover
                                key={day}
                                open={openPopoverId === `day-${day}`}
                                onOpenChange={(open) =>
                                    setOpenPopoverId(open ? `day-${day}` : null)
                                }
                            >
                                <PopoverTrigger asChild>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.01 }}
                                        className={`h-32 p-2 rounded-lg border border-border
                      ${isToday ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}
                      ${dayEvents.length > 0 ? 'cursor-pointer' : ''}
                      transition-colors
                    `}
                                    >
                                        <div className="h-full flex flex-col">
                                            <span
                                                className={`text-sm mb-2 ${isToday ? 'text-primary' : 'text-foreground'}`}
                                            >
                                                {day}
                                            </span>
                                            <div className="flex-1 space-y-1 overflow-hidden">
                                                {dayEvents.length <= 2 ? (
                                                    dayEvents.map((event) => {
                                                        const categoria =
                                                            event.categoria
                                                        const categoryStyle =
                                                            categoria?.cor ||
                                                            'bg-slate-600'

                                                        return (
                                                            <motion.div
                                                                key={event.id}
                                                                whileHover={{
                                                                    scale: 1.05,
                                                                }}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation()
                                                                    onEventClick(
                                                                        event,
                                                                    )
                                                                    setOpenPopoverId(
                                                                        null,
                                                                    )
                                                                }}
                                                            >
                                                                <Badge
                                                                    className={`${categoryStyle} text-white border-0 text-xs w-full justify-start truncate cursor-pointer`}
                                                                >
                                                                    {
                                                                        event.titulo
                                                                    }
                                                                </Badge>
                                                            </motion.div>
                                                        )
                                                    })
                                                ) : (
                                                    <>
                                                        <div className="flex flex-wrap gap-1 content-start">
                                                            {dayEvents
                                                                .slice(
                                                                    0,
                                                                    MAX_DOTS_POR_DIA,
                                                                )
                                                                .map(
                                                                    (
                                                                        event,
                                                                    ) => {
                                                                        const categoria =
                                                                            event.categoria
                                                                        const categoryStyle =
                                                                            categoria?.cor ||
                                                                            'bg-slate-600'

                                                                        return (
                                                                            <span
                                                                                key={
                                                                                    event.id
                                                                                }
                                                                                title={
                                                                                    event.titulo
                                                                                }
                                                                                className={`w-2 h-2 rounded-full shrink-0 ${categoryStyle}`}
                                                                            />
                                                                        )
                                                                    },
                                                                )}
                                                        </div>
                                                        {dayEvents.length >
                                                            MAX_DOTS_POR_DIA && (
                                                            <p className="text-xs text-muted-foreground">
                                                                +
                                                                {dayEvents.length -
                                                                    MAX_DOTS_POR_DIA}{' '}
                                                                mais
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </PopoverTrigger>

                                {dayEvents.length > 0 && (
                                    <PopoverContent
                                        className="w-80 p-0"
                                        align="start"
                                        side="right"
                                    >
                                        <div className="p-4 border-b border-border">
                                            <h4 className="mb-1">
                                                {day} de{' '}
                                                {currentDate.toLocaleDateString(
                                                    'pt-BR',
                                                    { month: 'long' },
                                                )}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {dayEvents.length}{' '}
                                                {dayEvents.length === 1
                                                    ? 'evento'
                                                    : 'eventos'}
                                            </p>
                                        </div>
                                        <ScrollArea className="max-h-[400px] overflow-auto">
                                            <div className="p-4 space-y-3">
                                                {dayEvents.map((event) => {
                                                    const categoria =
                                                        event.categoria
                                                    // const local = event.local
                                                    const categoryStyle =
                                                        categoria?.cor ||
                                                        'bg-slate-600'
                                                    const startTime = new Date(
                                                        event.dataInicio,
                                                    ).toLocaleTimeString(
                                                        'pt-BR',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )

                                                    return (
                                                        <motion.div
                                                            key={event.id}
                                                            whileHover={{
                                                                scale: 1.02,
                                                            }}
                                                            className="p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                onEventClick(
                                                                    event,
                                                                )
                                                                setOpenPopoverId(
                                                                    null,
                                                                )
                                                            }}
                                                        >
                                                            <div className="space-y-2">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h5 className="leading-tight flex-1">
                                                                        {
                                                                            event.titulo
                                                                        }
                                                                    </h5>
                                                                    <Badge
                                                                        className={`${categoryStyle} text-white border-0 text-xs shrink-0`}
                                                                    >
                                                                        {
                                                                            categoria?.nome
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {
                                                                            startTime
                                                                        }
                                                                    </div>

                                                                    <div className="flex items-center gap-1 truncate">
                                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                                        <span className="truncate">
                                                                            {
                                                                                event.LocalNome
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                )}
                            </Popover>
                        )
                    })}
                </div>
            </Card>

            {/* Resumo */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>
                    {
                        events.filter((e) => {
                            const eventDate = new Date(e.dataInicio)
                            return (
                                eventDate.getMonth() === month &&
                                eventDate.getFullYear() === year
                            )
                        }).length
                    }{' '}
                    eventos em {monthName}
                </span>
            </div>
        </div>
    )
}
