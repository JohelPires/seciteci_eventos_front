# Design: Calendário interativo + melhorias na Visão Geral (admin)

Data: 2026-10-05
Status: aprovado pelo usuário

## Objetivo

Na aba **Visão Geral** do painel admin (`src/components/AdminDashboard.tsx`):

- Adicionar um calendário de eventos como card interativo na grade 2×2.
- Corrigir cards quebrados/inconsistentes (conteúdo vazio, cores falsas).
- Ajustar movimento (orquestado, não espalhado) e acessibilidade.

Escopo confirmado: **somente a Visão Geral** — sem tocar header, TabsList, dark mode global, TanStack Query, tabela de Eventos, Usuários, Categorias ou mapa.

## Decisões (acordadas com o usuário)

1. **Papel do calendário: card interativo na grade 2×2** — reusa o `CalendarView` existente (mês + pontos por categoria + painel lateral). Substitui o card "Eventos Recentes", mantendo a grade 2×2 (a lista do próprio calendário já cobre essa informação).
2. **Escopo das melhorias: só a Visão Geral.**
3. **Interatividade:** clicar num dia destaca o dia e lista os eventos daquele dia no painel lateral; os títulos são clicáveis e abrem o diálogo de detalhes (`EventDetails`, o mesmo da aba Eventos).
4. **Ambição visual: ajuste disciplinado** — mantém estrutura/page tokens; unifica linguagem de cor; orquestra a entrada; sem redesign.

## Arquitetura

### `src/components/CalendarView.tsx` (extensão retrocompatível)

Duas props opcionais (a home não muda de comportamento):

```ts
interface CalendarViewProps {
    events: Event[]
    selectedDate: Date | null
    onSelectDate: (date: Date | null) => void
    layout?: 'row' | 'stack' // default 'row' (comportamento atual)
    onEventClick?: (event: Event) => void
}
```

- `layout="row"`: `flex flex-col lg:flex-row`, grid `w-full lg:w-[380px] shrink-0` (hoje).
- `layout="stack"`: `flex flex-col`; calendário `w-full`; painel abaixo — usado no card de meia largura do admin, evita espremer lado a lado dentro do breakpoint `lg`.
- Painel lateral quando `onEventClick` está presente:
  - **sem dia selecionado** → lista de dias com eventos (comportamento atual);
  - **com dia selecionado** → os **títulos** dos eventos do dia (ponto da cor da categoria + horário + badge de status), cada um clicável → `onEventClick(event)`.
- A11y: `aria-label` nos botões de dia (ex.: "5 de outubro, 2 eventos") em vez do número cru; `aria-pressed` mantido.

### `src/components/AdminDashboard.tsx`

- Novo estado `selectedDate`.
- O `motion.div` do card **"Eventos Recentes"** (linhas ~289–316) é substituído pelo card **"Calendário de Eventos"**:

```tsx
<Card>
  <CardHeader>…Calendário de Eventos…</CardHeader>
  <CardContent className="pt-6">
    <CalendarView layout="stack" events={events}
      selectedDate={selectedDate} onSelectDate={setSelectedDate}
      onEventClick={handleEventClick} />
  </CardContent>
</Card>
```

- `selectedEvent` (estado morto na linha 44) passa a renderizar `EventDetails` com categoria via `categorias.find(...)`; fecha ao `onClose`; `onEdit`/`onDelete` vêm das props existentes. Bônus: cliques no mapa passam a abrir detalhes também (o `handleEventClick` já existia e era passado ao `MapView` sem efeito).

### Correções disciplinares na Visão Geral

- **"Categorias Ativas" vazio (193–204):** CardContent mostra `{categoriasComEventos} de {categorias.length} com eventos` (categoria com ≥1 evento), com ícone `Tag`.
- **Status/Tipo (214–259):** hoje as três linhas usam o *mesmo* `bg-blue-100` no claro (bug). Trocar por `bg-muted/50` + **ponto colorido** antes do rótulo (mesma linguagem de "Eventos por Categoria"). Cores: publicado `green-600`, pendente `amber-500`, cancelado `red-600`; presencial `primary`, online `violet-500`, híbrido `teal-500`.
- **KPIs (152–204):** tile de ícone `rounded-lg bg-muted`; hierarquia rótulo → valor grande → legenda; altura uniforme. Só "Publicados" mantém verde de destaque; resto neutro.
- **Eventos por Categoria (268–287):** barra fina de proporção (`h-1.5`), largura % sobre a categoria mais numerosa — codifica magnitude sem chart lib.
- **Movimento orquestrado:** os 4 `motion.div` com delays soltos viram containers com `staggerChildren` (um único momento de entrada), respeitando `useReducedMotion()`.
- **A11y de títulos:** `CardTitle` renderiza `<h4>` → pula h1→h4. Adicionar prop opcional `as` (default `"h4"`, retrocompatível) em `ui/card.tsx` e usar `as="h2"` nos cards da Visão Geral.
- Copy: manter "Pendente(s)" como no resto do app; vazios já orientam ("Nenhum evento neste mês.").

## Arquivos tocados

| Arquivo | Mudança |
|---|---|
| `src/components/CalendarView.tsx` | Props `layout`/`onEventClick`, lista de eventos do dia, aria-labels |
| `src/components/AdminDashboard.tsx` | Card do calendário, render de `EventDetails`, correções, motion orquestrado |
| `src/components/ui/card.tsx` | Prop opcional `as` no `CardTitle` |

Nenhum outro arquivo é tocado. Sem novas dependências (`react-day-picker` não entra).

## Verificação

- `npx tsc --noEmit`
- `npm run lint`
- Teste manual (`npm run dev`): seleção de dia e lista do dia, clique em evento abre `EventDetails`, mobile stack, navegação por teclado, reduced-motion, KPIs, proporção por categoria, mapa abrindo detalhes.
