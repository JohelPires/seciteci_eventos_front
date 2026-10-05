# Calendário como filtro dos cards — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover o calendário para dentro do bloco de listagem (abaixo das tabs de categorias), torná-lo compacto (células baixas, só pontos) e faze-lo filtrar os cards ao clicar num dia.

**Architecture:** `CalendarView` vira componente controlado por `selectedDate`/`onSelectDate`; a lógica de filtragem de cards fica em `page.tsx` (estado `selectedDate` + `matchesDay` em `filteredEvents`). Seção antiga "Calendário dos Eventos" no `<main>` é removida.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, shadcn/ui, framer-motion (mantido no restante da página).

**Spec:** `docs/superpowers/specs/2026-10-05-calendario-filtro-cards-design.md`

## Global Constraints

- Código e comentários em português (AGENTS.md).
- TypeScript strict; `npx tsc --noEmit` deve passar (não há script de typecheck).
- `npm run lint` (ESLint next/core-web-vitals + next/typescript) deve passar.
- Não há framework de testes no projeto; verificação = tsc + lint + conferência manual.
- Não commitar sem pedido explícito do usuário.
- Não editar `src/components/EventForm2.tsx.backup` nem `src/components/ui/*.tsx.del`.

**Desvio menor do spec aprovado):** a prop `categorias` sai do contrato de `CalendarView` — ela já era não usada no componente atual (os pontos/painel usam `event.categoria.cor` embutida em cada evento) e manter uma prop destruturada não usada acionaria o ESLint de unused vars.

---

### Task 1: Reescrever `CalendarView` como componente controlado

**Files:**
- Modify: `src/components/CalendarView.tsx` (substituição completa)

**Interfaces:**
- Consumes: tipos `Event`, `Categoria`, `Local` de `@/app/page` (somente `Event` passa a ser usado).
- Produces (usado pela Task 2):

```ts
export function CalendarView(props: {
    events: Event[]
    selectedDate: Date | null
    onSelectDate: (date: Date | null) => void
})
```

- Steps:

- [ ] **Step 1: Substituir o conteúdo do arquivo pelo código abaixo**

```tsx
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
}

const MAX_DOTS_POR_DIA = 8

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

// evento em andamento: intervalo dataInicio–dataFim toca o dia selecionado
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
        irParaMes(
            year,
            direction === 'prev' ? month - 1 : month + 1,
        )
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

    // eventos no mês inteiro (para o resumo do painel lateral)
    const eventosNoMes = events.filter(
        (e) =>
            new Date(e.dataInicio) <= fimDoMes(year, month) &&
            new Date(e.dataFim ?? e.dataInicio) >= inicioDoMes(year, month),
    )

    // dias do mês corrente que têm ao menos um evento
    const diasComEventos = Array.from({ length: daysInMonth }, (_, i) => i + 1)
        .map((day) => ({ day, eventos: eventosAtivosNoDia(events, new Date(year, month, day, 12)) }))
        .filter((d) => d.eventos.length > 0)

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendário (esquerda) */}
            <Card className="w-full lg:w-[380px] shrink-0 p-4">
                {/* Navegação */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="capitalize text-lg font-semibold">
                        {monthName}
                    </h2>
                    <div className="flex items-center gap-1">
                        {!isCurrentMonth && (
                            <Button variant="outline" size="sm" onClick={() => {
                                const hoje = new Date()
                                if (selectedDate && hoje.getDate() > new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()) {
                                    // impossível, mantém só por segurança
                                }
                                setCurrentDate(new Date())
                            }}>
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
                        <Select
                            onValueChange={handleMonthChange}
                            value={String(month)}
                        >
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
                        <Select
                            onValueChange={handleYearChange}
                            value={String(year)}
                        >
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
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-xs text-muted-foreground py-1">
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

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayClick(day)}
                                title={
                                    dayEvents.length > 0
                                        ? dayEvents.map((e) => e.titulo).join('\n')
                                        : undefined
                                }
                                aria-pressed={isSelected}
                                className={`h-11 rounded-md border flex flex-col justify-between items-center py-1 px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    isSelected
                                        ? 'border-primary ring-2 ring-primary/40 bg-primary/10'
                                        : isToday
                                          ? 'border-primary/60 bg-primary/5'
                                          : 'border-border hover:bg-muted/50'
                                }`}
                            >
                                <span
                                    className={`text-xs leading-none whitespace-nowrap ${
                                        isSelected || isToday
                                            ? 'text-primary font-semibold'
                                            : ''
                                    }`}
                                >
                                    {day}
                                </span>
                                {/* um ponto por evento, cor da categoria */}
                                <div className="flex flex-wrap gap-[3px] justify-center max-w-full overflow-hidden pb-0.5">
                                    {dayEvents
                                        .slice(0, MAX_DOTS_POR_DIA)
                                        .map((event) => (
                                            <span
                                                key={event.id}
                                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                    event.categoria?.cor ||
                                                    'bg-slate-600'
                                                }`}
                                            />
                                        ))}
                                    {dayEvents.length > MAX_DOTS_POR_DIA && (
                                        <span className="text-[8px] leading-none text-muted-foreground">
                                            +{dayEvents.length - MAX_DOTS_POR_DIA}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </Card>

            {/* Painel lateral (direita) */}
            <div className="flex-1 min-w-[220px] flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                        {eventosNoMes.length}{' '}
                        {eventosNoMes.length === 1 ? 'evento em' : 'eventos em'}{' '}
                        <span className="capitalize font-medium text-foreground">
                            {monthName}
                        </span>
                    </p>
                    {selectedDate && (
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
                                        {day} de{' '}
                                        {monthOptions[month].toLowerCase().slice(0, 3)}
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
        </div>
    )
}
```

- [ ] **Step 2: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: ok (sem erros).

- [ ] **Step 3: Sanidade — página ainda compila com o contrato antigo**

Nota: neste ponto `page.tsx` passa props antigas (`categorias`, `onEventClick`) → TS pode reclamar de props extras/não declaradas. Aceitável temporariamente; a Task 2 imediatamente corrige o call-site.

---

### Task 2: Integrar `selectedDate` em `page.tsx` e remover seção antiga

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes (da Task 1): `<CalendarView events={Event[]} selectedDate={Date | null} onSelectDate={(date: Date | null) => void} />`
- Produces: estado `selectedDate` (local da página, sem consumo externo).

**Steps:**

- [ ] **Step 1: Adicionar estado e helpers**

Após `const [categoryFilter, setCategoryFilter] = useState('all')` (linha ~112):

```tsx
const [selectedDate, setSelectedDate] = useState<Date | null>(null)
```

Acima de `filteredEvents` (fora do componente ou junto aos helpers de filtro):

```tsx
const fimDoDia = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
```

- [ ] **Step 2: Estender `filteredEvents` com `matchesDay`**

```tsx
const filteredEvents = events.filter((event) => {
    const matchesSearch =
        event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || event.categoria?.nome === categoryFilter
    const matchesDay =
        !selectedDate ||
        (new Date(event.dataInicio) <= fimDoDia(selectedDate) &&
            new Date(event.dataFim ?? event.dataInicio) >= inicioDoDia(selectedDate))
    return matchesSearch && matchesCategory && matchesDay
})
```

- [ ] **Step 3: Reset de paginação também no dia**

```tsx
useEffect(() => {
    setCurrentPage(1)
}, [searchTerm, categoryFilter, selectedDate])
```

- [ ] **Step 4: Mover `<CalendarView>` para o header e atualizar props**

No `<header>` principal, logo depois do bloco `<Tabs>` (dentro do mesmo `motion.div`), adicionar:

```tsx
<div className="mt-6">
    <CalendarView events={events} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
</div>
```

- [ ] **Step 5: Remover a seção antiga "Calendário dos Eventos"**

Em `<main>`, remover: o `<div className="h-0.5 mt-10 mb-5 bg-gray-200 rounded-2xl"></div>`, o `motion.div` com o título "Calendário dos Eventos" (ícone `CalendarDays`) e `<CalendarView events={events} categorias={categoriasData || []} onEventClick={handleEventClick} />`. Manter o `<div>`-divider e o bloco do Mapa logo depois.

- [ ] **Step 6: Chip removível do filtro de dia acima dos cards**

No `<main>`, dentro do fragmento `<>` que renderiza o grid, antes do `<div className="grid grid-cols-1 md:grid-cols-2 ...">` (e visível também no estado vazio), adicionar:

```tsx
{selectedDate && (
    <div className="mb-6 flex justify-center">
        <Badge className="gap-2 px-3 py-1.5 bg-primary text-primary-foreground">
            Eventos em{' '}
            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="Remover filtro de dia"
                className="hover:opacity-70"
            >
                <X className="w-4 h-4" />
            </button>
        </Badge>
    </div>
)}
```

Imports a acrescentar: `X` em lucide-react e `Badge` de `@/components/ui/badge`.

Posicionamento: colocar o chip logo no início do `<main>`, antes do `isLoading ? ...` ternário, para aparecer também no empty state.

- [ ] **Step 7: Empty state menciona o dia**

No bloco "Nenhum evento encontrado", trocar a condição/texto do parágrafo:

```tsx
<p className="text-muted-foreground mb-6">
    {searchTerm || categoryFilter !== 'all'
        ? 'Tente ajustar os filtros de busca'
        : selectedDate
          ? 'Nenhum evento neste dia. Tente outro dia ou limpe o filtro'
          : 'Comece criando seu primeiro evento'}
</p>
```

---

### Task 3: Verificação final

- [ ] `npx tsc --noEmit` → ok
- [ ] `npm run lint` → ok
- [ ] Conferência manual (dev server): clicar dia → cards filtram; clicar de novo → volta tudo; chip ✕ limpa; trocar de mês não limpa seleção (e 31 → fev limpa); busca + categoria + dia combinam; paginação reseta; mapa intacto.

---

## Self-review do plano

- **Cobertura do spec:** mover calendário ✓ (Task 2 Step 4); remover seção antiga ✓ (Step 5); células baixas com pontos ✓ (Task 1); toggle ✓ (Task 1 `handleDayClick`); evento em andamento ✓ (`eventosAtivosNoDia` em Task 1 e `matchesDay` na Task 2 — mesma semantics); AND + chip ✓ (Task 2 Steps 2/6); painel lateral ✓ (Task 1); highlight de hoje/selecionado ✓ (Task 1); reset de paginação ✓ (Step 3); empty state ✓ (Step 7).
- **Placeholders:** nenhum "TBD/TODO";
- **Consistência de tipos:** `onSelectDate: (date: Date | null) => void` idêntico no componente e no call-site (`setSelectedDate` é `Dispatch<SetStateAction<Date | null>>` — atribuição direta de setters a callbacks do tipo `(v: T | null) => void` é válida pois o setState aceita o valor direto).

  **Espera — correção:** `Dispatch<SetStateAction<Date|null>>` não é atribuível a `(date: Date | null) => void`? Sim, é: `SetStateAction<Date | null>` = `Date | null | ((prev) => ...)`, e um valor `Date | null` é um argumento válido — a função é mais permissiva no param, logo atribuível. Ajuste feito: usar `onSelectDate={setSelectedDate}` diretamente.
