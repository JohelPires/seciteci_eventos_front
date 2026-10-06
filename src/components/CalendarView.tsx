import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'
import type { Event } from '@/app/page'

interface CalendarViewProps {
    events: Event[]
    selectedDate: Date | null
    onSelectDate: (date: Date | null) => void
    // 'row' (padrão, home): grade à esquerda e painel ao lado em telas largas
    // 'stack' (admin): grade em cima, painel embaixo — card de meia largura
    layout?: 'row' | 'stack'
    onEventClick?: (event: Event) => void
    // false: renderiza só o calendário, centralizado e mais largo (home pública)
    showPanel?: boolean
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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

const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

const inicioDoDia = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

const fimDoDia = (date: Date) => {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
}

const inicioDoMes = (ano: number, mes: number) => new Date(ano, mes, 1, 0, 0, 0, 0)

const fimDoMes = (ano: number, mes: number) => {
    const d = new Date(ano, mes + 1, 0)
    d.setHours(23, 59, 59, 999)
    return d
}

// evento em andamento: o intervalo dataInicio–dataFim toca o dia selecionado
const eventosAtivosNoDia = (events: Event[], dia: Date) => {
    const inicio = inicioDoDia(dia)
    const fim = fimDoDia(dia)
    return events.filter(
        (e) =>
            new Date(e.dataInicio) <= fim &&
            new Date(e.dataFim ?? e.dataInicio) >= inicio,
    )
}

export function CalendarView({
    events,
    selectedDate,
    onSelectDate,
    layout = 'row',
    onEventClick,
    showPanel = true,
}: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(() => new Date())

    const { daysInMonth, startingDayOfWeek, year, month } = (() => {
        const ano = currentDate.getFullYear()
        const mes = currentDate.getMonth()
        return {
            daysInMonth: new Date(ano, mes + 1, 0).getDate(),
            startingDayOfWeek: new Date(ano, mes, 1).getDay(),
            year: ano,
            month: mes,
        }
    })()

    const monthName = currentDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    })
    const today = new Date()
    const isCurrentMonth =
        today.getFullYear() === year && today.getMonth() === month

    const yearOptions = Array.from(
        { length: 7 },
        (_, i) => today.getFullYear() - 3 + i,
    )

    // navegação de mês: se o dia selecionado não existir no mês alvo
    // (ex.: 31 selecionado e indo para fevereiro), limpa a seleção
    const irParaMes = (ano: number, mes: number) => {
        if (selectedDate) {
            const diasNoMes = new Date(ano, mes + 1, 0).getDate()
            if (selectedDate.getDate() > diasNoMes) onSelectDate(null)
        }
        setCurrentDate(new Date(ano, mes, 1))
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        irParaMes(year, direction === 'prev' ? month - 1 : month + 1)
    }

    const handleMonthChange = (monthIndex: string) => {
        irParaMes(year, Number(monthIndex))
    }

    const handleYearChange = (yearStr: string) => {
        irParaMes(Number(yearStr), month)
    }

    // toggle: clicar no mesmo dia limpa o filtro
    const handleDayClick = (day: number) => {
        const dia = new Date(year, month, day, 12)
        if (selectedDate && sameDay(selectedDate, dia)) {
            onSelectDate(null)
        } else {
            onSelectDate(dia)
        }
    }

    // eventos no mês inteiro (resumo do painel lateral)
    const eventosNoMes = events.filter(
        (e) =>
            new Date(e.dataInicio) <= fimDoMes(year, month) &&
            new Date(e.dataFim ?? e.dataInicio) >= inicioDoMes(year, month),
    )

    // dias do mês corrente que têm ao menos um evento
    const diasComEventos = Array.from({ length: daysInMonth }, (_, i) => i + 1)
        .map((day) => ({
            day,
            eventos: eventosAtivosNoDia(events, new Date(year, month, day, 12)),
        }))
        .filter((d) => d.eventos.length > 0)

    return (
        <div
            className={
                !showPanel
                    ? 'flex justify-center'
                    : layout === 'row'
                      ? 'flex flex-col lg:flex-row gap-6'
                      : 'flex flex-col gap-6'
            }
        >
            {/* Calendário (esquerda, topo ou centralizado sem painel) */}
            <Card
                className={
                    !showPanel
                        ? 'w-full max-w-[1000px] p-4'
                        : layout === 'row'
                          ? 'w-full lg:w-[380px] shrink-0 p-4'
                          : 'w-full p-4'
                }
            >
                {/* Navegação */}
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <h2 className="capitalize text-lg font-semibold">{monthName}</h2>
                    <div className="flex items-center gap-1">
                        {!isCurrentMonth && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentDate(new Date())}
                            >
                                Hoje
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateMonth('prev')}
                            aria-label="Mês anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Select onValueChange={handleMonthChange} value={String(month)}>
                            <SelectTrigger size="sm" className="w-[110px]">
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
                        <Select onValueChange={handleYearChange} value={String(year)}>
                            <SelectTrigger size="sm" className="w-[80px]">
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
                            aria-label="Próximo mês"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Cabeçalho da semana */}
                <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs text-muted-foreground py-1"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grade de dias */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startingDayOfWeek }).map(
                        (_, index) => <div key={`empty-${index}`} />,
                    )}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const dataDoDia = new Date(year, month, day, 12)
                        const dayEvents = eventosAtivosNoDia(events, dataDoDia)
                        const isSelected =
                            selectedDate !== null && sameDay(selectedDate, dataDoDia)
                        const isToday = isCurrentMonth && day === today.getDate()
                        const temEventos = dayEvents.length > 0

                        // um único caminho de classes por estado, sem conflitos
                        const dayClasses = temEventos
                            ? isSelected
                              ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
                              : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                            : isSelected
                              ? 'border-primary ring-2 ring-primary/40 bg-primary/10'
                              : isToday
                                ? 'border-primary/60 bg-primary/5'
                                : 'border-border hover:bg-muted/50'

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayClick(day)}
                                title={
                                    temEventos
                                        ? dayEvents.map((e) => e.titulo).join('\n')
                                        : undefined
                                }
                                aria-pressed={isSelected}
                                aria-label={
                                    `${day} de ${monthOptions[month]}` +
                                    (temEventos
                                        ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}`
                                        : '')
                                }
                                className={`h-11 rounded-md border flex flex-col justify-between items-center py-1 px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${dayClasses}`}
                            >
                                <span
                                    className={`text-xs leading-none whitespace-nowrap ${
                                        temEventos
                                            ? 'text-primary-foreground font-semibold'
                                            : isSelected || isToday
                                              ? 'text-primary font-semibold'
                                              : ''
                                    }`}
                                >
                                    {day}
                                </span>
                                {/* dia preenchido mostra a contagem de eventos */}
                                {temEventos && (
                                    <span className="text-[10px] font-bold leading-none bg-primary-foreground/25 text-primary-foreground rounded-full min-w-[14px] px-1 py-px">
                                        {dayEvents.length}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </Card>

            {/* Painel lateral (direita) */}
            {showPanel && (
                <div className="flex-1 min-w-[220px] flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                        {eventosNoMes.length}{' '}
                        {eventosNoMes.length === 1 ? 'evento em' : 'eventos em'}{' '}
                        <span className="capitalize font-medium text-foreground">
                            {monthName}
                        </span>
                    </p>
                {selectedDate && onEventClick && (
                    <div className="overflow-y-auto max-h-[260px] flex flex-col gap-1">
                        {eventosAtivosNoDia(events, selectedDate).map((event) => (
                            <button
                                key={event.id}
                                type="button"
                                onClick={() => onEventClick(event)}
                                className="w-full text-left text-sm px-3 py-2 rounded-md border border-border hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            event.categoria?.cor || 'bg-slate-600'
                                        }`}
                                    />
                                    <span className="font-medium truncate">{event.titulo}</span>
                                </span>
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                    {new Date(event.dataInicio).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                    {' · '}
                                    {event.status === 'rascunho'
                                        ? 'Pendente'
                                        : event.status === 'publicado'
                                          ? 'Publicado'
                                          : 'Cancelado'}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {selectedDate && !onEventClick && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => onSelectDate(null)}
                        >
                            Limpar filtro
                        </Button>
                    )}
                </div>

                {selectedDate && (
                    <p className="text-sm">
                        {(() => {
                            const n = eventosAtivosNoDia(events, selectedDate).length
                            return (
                                <>
                                    <span className="font-medium text-foreground">{n}</span>{' '}
                                    {n === 1 ? 'evento em' : 'eventos em'}{' '}
                                    {selectedDate.toLocaleDateString('pt-BR', {
                                        day: 'numeric',
                                        month: 'long',
                                    })}
                                </>
                            )
                        })()}
                    </p>
                )}

                {/* Lista de dias com eventos */}
                {diasComEventos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nenhum evento neste mês.
                    </p>
                ) : (
                    <div className="overflow-y-auto max-h-[200px] flex flex-col gap-1">
                        {diasComEventos.map(({ day, eventos }) => {
                            const diaAtual = new Date(year, month, day, 12)
                            const isSelected =
                                selectedDate !== null && sameDay(selectedDate, diaAtual)
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayClick(day)}
                                    className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                        isSelected
                                            ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                                            : 'border-border hover:bg-muted/50'
                                    }`}
                                >
                                    <span className="font-medium">
                                        {day} de {monthOptions[month].toLowerCase().slice(0, 3)}
                                    </span>{' '}
                                    <span className="text-muted-foreground">
                                        · {eventos.length}{' '}
                                        {eventos.length === 1 ? 'evento' : 'eventos'}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
            )}
        </div>
    )
}
