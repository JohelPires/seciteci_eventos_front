# Design: Calendário como filtro dos cards (home)

Data: 2026-10-05
Status: aprovado pelo usuário

## Objetivo

Combinar as seções de cards e calendário da home (`src/app/page.tsx`):

- O calendário sobe para dentro do bloco de listagem, logo abaixo das tabs de categorias.
- O calendário fica mais comprido e mais baixo: todos os eventos são representados apenas por um ponto (sem badges com título, sem popover).
- Clicar num dia filtra os cards abaixo para mostrar todos os eventos daquele dia.
- A seção antiga "Calendário dos Eventos" no rodapé da listagem é removida. O mapa permanece inalterado.

## Decisões (acordadas com o usuário)

1. **Clique no dia (toggle + sem popover):** clicar num dia filtra os cards; o dia fica destacado; clicar de novo no mesmo dia limpa o filtro. Sem popover de eventos.
2. **Semântica do filtro (evento em andamento):** aparecem os eventos cujo intervalo `dataInicio–dataFim` toca o dia selecionado (mesma lógica atual do `getEventsForDay` do `CalendarView`). Eventos de múltiplos dias aparecem em cada dia que ocupam.
3. **Combinação de filtros (AND + chip):** busca, categoria e dia aplicam-se juntos. O filtro de dia aparece como chip removível acima dos cards ("Eventos em 12 de outubro ✕").
4. **Layout do bloco:** calendário à esquerda (~360-400px, altura ~320-340px) e painel resumo à direita. Cards continuam abaixo em grid de 3 colunas.
5. **Seção antiga:** removida (sem duplicação).
6. **Cor dos pontos:** cor da categoria do evento (`categoria.cor`), fallback `bg-slate-600`.

## Arquitetura

### `src/app/page.tsx`

- Novo estado: `const [selectedDate, setSelectedDate] = useState<Date | null>(null)` (meio-dia para evitar problemas de timezone, igual ao padrão do `CalendarView`).
- `filteredEvents` ganha `matchesDay`:

```ts
const matchesDay = !selectedDate ||
   (new Date(event.dataInicio) <= fimDoDia(selectedDate) &&
    new Date(event.dataFim ?? event.dataInicio) >= inicioDoDia(selectedDate))
```

- Busca, categoria e dia combinam com AND.
- `useEffect` de reset de paginação passa a depender também de `selectedDate`.
- Chip removível acima do grid de cards quando `selectedDate` está ativo; estado vazio menciona o dia quando aplicável.
- `<CalendarView>` movido para dentro do header, abaixo das tabs de categorias (aparece sempre, independente de `viewMode`).
- Seção antiga do calendário (header + `<CalendarView>` no `<main>`, linhas ~565-581) removida.

### `src/components/CalendarView.tsx` (reescrito)

Contrato (controlado — lógica de filtro de cards mora na página, não no componente):

```ts
interface CalendarViewProps {
    events: Event[]
    categorias: Categoria[]
    selectedDate: Date | null
    onSelectDate: (date: Date | null) => void
    // onEventClick removido: não há mais popover por dia
}
```

Layout:

- Conteúdo: `flex flex-col lg:flex-row` — grid à esquerda (largura fixa ~360-400px), painel lateral no restante.
- Header compacto: chevrons + selects de mês/ano + botão "Hoje" (apenas fora do mês corrente).
- Semana: `grid grid-cols-7 gap-2`.
- Célula do dia: altura compacta (`h-11`/`h-12`), número no canto superior esquerdo, pontos centralizados na parte inferior (máx. ~8 + "N+" se exceder, `title` nativo com os títulos).
- Estados visuais: dia selecionado → anel primário + `bg-primary/10`; hoje → número em cor primária; dias com eventos → `hover:bg-muted/50`, `cursor-pointer`.

Interação:

- Clique em dia sem seleção → `onSelectDate(dia)`.
- Clique no mesmo dia → `onSelectDate(null)`.
- Clique em outro dia → troca a seleção.
- Navegar de mês não limpa a seleção; se o dia selecionado não existir no novo mês (ex. 31 → fevereiro), a seleção é limpa.
- Navegação de mês/anô: mantém chevrons, selects e `goToToday` do esquema atual.

Painel lateral:

- Contagem mensal ("N eventos em outubro").
- Lista compacta dos dias com eventos ("12 out — 3 eventos", rolável se longo), clicável para selecionar/trocar o dia.
- Com dia selecionado: contagem daquele dia + botão "Limpar filtro".

## Arquivos tocados

| Arquivo | Mudança |
|---|---|
| `src/components/CalendarView.tsx` | Reescrito (células baixas com pontos, sem popover, controlado, painel lateral) |
| `src/app/page.tsx` | Estado `selectedDate`, filtro `matchesDay`, chip removível, calendário movido para cima, seção antiga removida |

Nenhum outro arquivo é tocado.

## Verificação

- `npx tsc --noEmit`
- `npm run lint`
- Teste manual: seleção, toggle, troca de mês, chip, combinação com busca/categoria, paginação, empty state.
