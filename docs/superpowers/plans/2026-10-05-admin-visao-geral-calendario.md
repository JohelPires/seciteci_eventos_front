# Calendário + melhorias Visão Geral (admin) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar calendário interativo na Visão Geral do admin (substituindo "Eventos Recentes") e corrigir KPIs/cards inconsistentes, com motion orquestrado e ajustes de a11y.

**Architecture:** Extensão retrocompatível do `CalendarView` (props `layout` + `onEventClick`), card do calendário em `AdminDashboard` que renderiza `EventDetails`, correções de cor/conteúdo nos cards existentes.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Tailwind v4, shadcn/ui, framer-motion (sem dependências novas).

## Global Constraints

- Código, comentários e copy em **português**.
- `CardTitle` do shadcn (`ui/card.tsx`) deve continuar com default `h4` — nenhum outro lugar pode quebrar.
- `CalendarView` na home (`src/app/page.tsx`) **não pode mudar de comportamento** (props novas são opcionais).
- Não tocar: `src/app/admin/page.tsx`, `AdminEventos.tsx`, `AdminUsuarios.tsx`, `AdminCategorias.tsx`, `MapView.tsx`, `EventDetails.tsx`, `Footer.tsx`, dark mode global, TanStack Query.
- Verificação de cada task: `npx tsc --noEmit` e `npm run lint` (o projeto não tem script de testes).
- Commits: prefixo `[feat]` / `[fix]` / `[style]`.

---

### Task 1: Prop `as` no `CardTitle` (a11y de títulos)

**Files:**
- Modify: `src/components/ui/card.tsx:31-39`

**Interfaces:**
- Consumes: nada novo (React puro).
- Produces: `CardTitle` aceita `as?: keyof JSX.IntrinsicElements` (default `"h4"`); todos os usos existentes continuam idênticos.

- [ ] **Step 1: Editar `CardTitle`**

```tsx
function CardTitle({ className, as = "h4", ...props }: React.ComponentProps<"h4"> & { as?: "h2" | "h3" | "h4" }) {
  return (
    <as
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros (default `h4` preserva usos existentes).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "[feat] CardTitle com prop as para nível de título"
```

---

### Task 2: `CalendarView` — props `layout` e `onEventClick` + aria-labels

**Files:**
- Modify: `src/components/CalendarView.tsx`

**Interfaces:**
- Consumes: `Event` de `@/app/page` (já importado).
- Produces: novas props opcionais — `layout?: 'row' | 'stack'` (default `'row'`), `onEventClick?: (event: Event) => void`; helper interno `formatHorario` reused.

- [ ] **Step 1: Adicionar props e classes condicionais de layout**

```tsx
interface CalendarViewProps {
    events: Event[]
    selectedDate: Date | null
    onSelectDate: (date: Date | null) => void
    layout?: 'row' | 'stack'
    onEventClick?: (event: Event) => void
}

// defaults: layout='row'
// container:
className={layout === 'row' ? 'flex flex-col lg:flex-row gap-6' : 'flex flex-col gap-6'}
// card do calendário:
className={layout === 'row' ? 'w-full lg:w-[380px] shrink-0 p-4' : 'w-full p-4'}
// lista lateral:
className={layout === 'stack' ? 'max-h-[260px]' : 'max-h-[200px]'} // no overflow-y
```

- [ ] **Step 2: formato de horário do evento**

```tsx
const formatHorario = (time?: string) =>
    time ? time.substring(11, 16) : '—' // dataInicio ISO → "HH:MM"
```

Nota: se `horarioAbertura` já for "HH:MM", `substring(11,16)` não altera nada (menos de 11 chars); se for ISO, extrai. Fallback: mostrar `dataInicio.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})`. Escolher via trim: preferir `new Date(e.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })` — mais confiável.

- [ ] **Step 3: aria-label nos botões de dia (grade)**

```tsx
aria-label={`${day} de ${monthOptions[month]}${dayEvents.length > 0 ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}` : ''}`}
aria-label="Mês anterior" // já existem nos chevrons
```

- [ ] **Step 4: Painel lateral com `onEventClick`:**

- Sem dia selecionado e `onEventClick` presente: manter lista de dias (comportamento atual).
- Com dia selecionado e `onEventClick` presente: substituir o bloco de resumo ("N eventos em 5 de outubro") por lista clicável:

```tsx
{selectedDate && onEventClick && (
    <div className="overflow-y-auto max-h-[260px] flex flex-col gap-1">
        {eventosAtivosNoDia(events, selectedDate).map((event) => (
            <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className="w-full text-left text-sm px-3 py-2 rounded-md border border-border hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <span className="font-medium">{event.titulo}</span>
                <span className="block text-xs text-muted-foreground">
                    {new Date(event.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {event.status === 'rascunho' ? 'Pendente' : event.status === 'publicado' ? 'Publicado' : 'Cancelado'}
                </span>
            </button>
        ))}
    </div>
)}
```

- Com dia selecionado e **sem** `onEventClick`: manter bloco atual ("N eventos em 5 de outubro"). O dot color do item: adicionar `<span className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.categoria?.cor || 'bg-slate-600'}`} />` antes do título, num flex.

- [ ] **Step 5: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros. A home compila igual (props opcionais).

- [ ] **Step 6: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "[feat] CalendarView com layout stack e eventos clicáveis"
```

---

### Task 3: AdminDashboard — card do calendário + EventDetails

**Files:**
- Modify: `src/components/AdminDashboard.tsx`

**Interfaces:**
- Consumes: `CalendarView` (Task 2 prop `layout="stack"` + `onEventClick`), `EventDetails` (`event, categoria, onClose, onEdit, onDelete`), props existentes `onEditEvent`, `onDeleteEvent`.
- Produces: `selectedDate` state interno; `selectedEvent` deixa de ser estado morto.

- [ ] **Step 1: imports + estados**

```tsx
import { CalendarView } from './CalendarView'
import { EventDetails } from './EventDetails'
import { useReducedMotion } from 'framer-motion'
// estado:
const [selectedDate, setSelectedDate] = useState<Date | null>(null)
```

- [ ] **Step 2: substituir "Eventos Recentes" (linhas ~289-316) pelo card do calendário**

```tsx
{/* Calendário de Eventos */}
<motion.div
   variants={item} // Task 4 troca por container real; por ora manter initial/animate como os demais
   className="lg:col-span-1"
>
   <Card className="h-full">
      <CardHeader>
         <CardTitle as="h2">Calendário de Eventos</CardTitle>
         <CardDescription>Selecione um dia para ver os eventos</CardDescription>
      </CardHeader>
      <CardContent>
         <CalendarView
            layout="stack"
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEventClick={handleEventClick}
         />
      </CardContent>
   </Card>
</motion.div>
```

- [ ] **Step 3: renderizar `EventDetails` (selectedEvent deixa de ser morto)**

Antes de `<Footer />`, ao lado do mapa:

```tsx
{selectedEvent && (
   <EventDetails
      event={selectedEvent}
      categoria={categorias.find((c) => c.id === selectedEvent.categoriaId) ?? null}
      onClose={() => setSelectedEvent(null)}
      onEdit={onEditEvent}
      onDelete={onDeleteEvent}
   />
)}
```

Confirmação: `handleEventClick` (linha ~74) e `selectedEvent` (linha ~44) já existem no arquivo — apenas passam a ser usados.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros ("Eventos Recentes" removido, calendário no lugar).

- [ ] **Step 5: Commit**

```bash
git add src/components/AdminDashboard.tsx
git commit -m "[feat] calendário de eventos na visão geral do admin"
```

---

### Task 4: Cards disciplinares (KPIs, Status/Tipo, Categoria) + motion orquestrado

**Files:**
- Modify: `src/components/AdminDashboard.tsx`

**Interfaces:**
- Consumes: nada além do que já existe no arquivo (`events`, `categorias`).
- Produces: `categoriaPoints` (mapa local de cores), `container`/`item` variants (framer-motion).

- [ ] **Step 1: mapa de cores para Status/Tipo e Ponto/Barra helpers (definidos junto ao componente)**

```tsx
const STATUS_DOTS: Record<string, string> = {
   publicado: 'bg-green-600',
   rascunho: 'bg-amber-500',
   cancelado: 'bg-red-600',
} as const

const TIPO_DOTS: Record<string, string> = {
   presencial: 'bg-primary',
   online: 'bg-violet-500',
   hibrido: 'bg-teal-500',
} as const
```

- [ ] **Step 2: Status/Tipo — `bg-blue-100` → `bg-muted/50` + ponto colorido**

```tsx
<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-2">
   <span className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOTS['publicado']}`} />
      Publicados
   </span>
   <span className="font-semibold">{publishedEvents}</span>
</div>
```

Análogo para pendentes (`rascunho`), cancelados, presencial, online, híbrido (usar `TIPO_DOTS`).

- [ ] **Step 3: KPI cards — tile de ícone + altura uniforme**

Card genérico (exemplo "Total de Eventos"):

```tsx
<Card className="h-full">
   <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
         <div>
            <CardDescription>Total de Eventos</CardDescription>
            <CardTitle className="text-3xl">{totalEvents}</CardTitle>
         </div>
         <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-muted-foreground" />
         </div>
      </div>
   </CardHeader>
   <CardContent>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
         <span>Todos os status</span>
      </div>
   </CardContent>
</Card>
```

Regra: `Publicados` mantém número em `text-green-600`; os outros 3 KPIs neutros; tile usa o mesmo ícone já usado no CardContent de hoje (`Calendar`, `TrendingUp`, `Users`, `Tag`) e o ícone do CardContent antigo é removido/movi para o tile.

- [ ] **Step 4: Eventos por Categoria — barra de proporção**

```tsx
{eventsByCategory.map((item) => {
   const maxCount = Math.max(...eventsByCategory.map((i) => i.count), 1)
   return (
      <div key={item.categoria} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50">
         <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={`w-3 h-3 rounded-full shrink-0 ${item.cor}`} />
            <span className="text-sm truncate">{item.categoria}</span>
         </div>
         <div className="flex items-center gap-2 w-24 shrink-0">
            <div className="h-1.5 rounded-full bg-muted flex-1 overflow-hidden">
               <div
                  className={`h-full rounded-full ${item.cor}`}
                  style={{ width: `${item.count === 0 ? 0 : Math.max(100 * (item.count / maxCount), 2)}%` }}
               />
            </div>
            <span className="text-xs font-semibold w-5 text-right">{item.count}</span>
         </div>
      </div>
   )
})}
```

- [ ] **Step 5: "Categorias Ativas" vazio → conteúdo real**

```tsx
// junto às estatísticas:
const categoriasComEventos = categorias.filter((cat) => events.some((e) => e.categoriaId === cat.id)).length
```

```tsx
<CardContent>
   <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Tag className="w-4 h-4" />
      <span>{categoriasComEventos} com eventos</span>
   </div>
</CardContent>
```

- [ ] **Step 6: motion orquestrado (substitui delays dispersos)**

```tsx
const container = {
   hidden: {},
   show: { transition: { staggerChildren: 0.06 } },
}
const item = {
   hidden: useReducedMotion() ? {} : { opacity: 0, y: 20 },
   show: useReducedMotion() ? {} : { opacity: 1, y: 0 },
}
```

KPIs e grade 2×2 ficam em `motion.div variants={container} initial="hidden" animate="show"`; cada card vira `motion.div variants={item}` (sem `transition={{ delay }}` local).

- [ ] **Step 7: Verificar**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/components/AdminDashboard.tsx
git commit -m "[style] visão geral: KPIs, cores por ponto e motion orquestrado"
```

---

### Task 5: Verificação final

- [ ] **Step 1:** `npx tsc --noEmit && npm run lint` — sem erros.
- [ ] **Step 2:** `npm run build` — passa.
- [ ] **Step 3:** `npm run dev` e testar manualmente: calendário na Visão Geral (selecionar dia → eventos do dia; clicar num evento → `EventDetails`; mapa também abre detalhes); KPI/Status/Tipo/Categoria corrigidos; mobile empilhado; teclado e reduced-motion.
