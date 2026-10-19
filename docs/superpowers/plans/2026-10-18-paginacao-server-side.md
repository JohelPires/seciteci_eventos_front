# Paginação server-side + skeleton — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todas as listagens do front para paginação server-side (eliminando `limit=1000`), com skeleton no 1º load e página anterior mantida nas trocas.

**Architecture:** Camada de dados tipada em `data.ts` (`{ eventos, pagination }`) sobre o contrato confirmado da API; TanStack Query keyed por filtros com `placeholderData: keepPreviousData`; conjunto bounded (`limit=100`) para calendário/mapa/stats; busca server-side com debounce (client nos usuários — `GET /api/usuarios` não aplica `search`).

**Tech Stack:** Next 15 App Router, React 19, TanStack Query, Tailwind v4, shadcn/ui, TypeScript strict.

## Global Constraints

- Verificado na API real (localhost:3030): `GET /api/eventos` devolve `{ eventos, pagination: { page, limit, total, totalPages } }`; `status=` vazio = TODOS os status; status omitido = só `publicado`; ordem server = `dataInicio ASC` (sem param de ordenação).
- `GET /api/meus-eventos` (protegido): aceita `page`/`limit`, devolve `{ eventos, pagination }`.
- `GET /api/usuarios` (protegido): aceita `page`/`limit`, clampa `limit` em 100, devolve `{ usuarios, pagination }`; `search` ignorado pelo servidor.
- Toda chamada autenticada via `authFetch` com `Bearer`. Nenhuma chamada nova com `limit > 100`.
- Skeleton só no `isLoading` (1º load/câmbio de filtro que zera cache); trocas usam `keepPreviousData` + `aria-busy` + opacity. `motion-reduce:animate-none` em todo skeleton.
- Código/comentários em português; commits com prefixo `[feat]`/`[fix]`/`[style]`.
- Verificação por tarefa: `npx tsc --noEmit` (sem erros). Ao fim: `npm run lint` + manual no dev server.

---

### Task 1: Camada de dados paginada (`src/data/data.ts`)

**Files:**
- Modify: `src/data/data.ts:59-122` (bloco de listagem), remove `getEventosFullQuery` (:85-100)

**Interfaces:**
- Consumes: `authFetch`, `normalizarEventos` (existentes).
- Produces (usados pelas Tasks 3–6):
  - `export interface Pagination { page: number; limit: number; total: number; totalPages: number }`
  - `export interface EventosParams { page?: number; limit?: number; categoria?: string; busca?: string; status?: string; tipo?: string }`
  - `getEventos(params?: EventosParams): Promise<ResultadoEventos>` — default `{ page:1, limit:6, status:'publicado' }`
  - `getEventosAdmin(token: string|null, params?: EventosParams): Promise<ResultadoEventos>` — default `{ page:1, limit:10, status:'' }` (todos os status)
  - `getMeusEventos(token: string|null, params?: EventosParams): Promise<ResultadoEventos>` — `GET /api/meus-eventos`
  - `getUsuarios({ queryKey }: { queryKey: [string, { token; search; page?; limit? }] })` — repassa `page`/`limit`, retorna `{ usuarios, pagination }`
  - `ResultadoEventos = { eventos: Event[]; pagination: Pagination }`

- [ ] **Step 1: Substituir `getEventos`, `getEventosFullQuery`, `getEventosAdmin`, `getMeusEventos`** pelo bloco abaixo (após `normalizarEventos`):

```ts
export interface Pagination {
   page: number
   limit: number
   total: number
   totalPages: number
}

export interface EventosParams {
   page?: number
   limit?: number
   categoria?: string
   busca?: string
   status?: string
   tipo?: string
}

export interface ResultadoEventos {
   eventos: Event[]
   pagination: Pagination
}

/** Monta a querystring ignorando parâmetros ausentes. */
const querystring = (params: Record<string, string | number | undefined>): string => {
   const qs = new URLSearchParams()
   for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
   }
   const s = qs.toString()
   return s ? `?${s}` : ''
}

/** Busca a lista completa de eventos do usuário autenticado. */
export const getMeusEventos = async (token: string | null, params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 6 } = params
   const res = await authFetch(`${API_URL}/api/meus-eventos${querystring({ page, limit })}`, {
      headers: { Authorization: `Bearer ${token}` },
   })
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 } }
}

/** Lista pública paginada com filtros server-side. Default: só publicados. */
export const getEventos = async (params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 6, categoria, busca, status = 'publicado', tipo } = params
   const res = await authFetch(`${API_URL}/api/eventos${querystring({ page, limit, categoria, busca, status, tipo })}`)
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 } }
}

/** Lista paginada para o admin: status vazio = TODOS os status (a API default é 'publicado'). */
export const getEventosAdmin = async (token: string | null, params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 10, busca, status = '', tipo } = params
   const res = await authFetch(
      `${API_URL}/api/eventos${querystring({ page: status === undefined ? page : page, limit, busca, status, tipo })}`,
      { headers: { Authorization: `Bearer ${token}` } },
   )
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 } }
}
```

(NOTA de execução: o status vazio precisa ser ENVIADO na query; `querystring` despreza `''`. Para o admin, mandar `new URLSearchParams({ status })` diretamente quando `status === ''` — implementar `querystring` com flag: `if (v === '' && k === 'status') qs.set(k, '')`.)

- [ ] **Step 2: `getUsuarios`** — trocar o corpo para repassar paginação (o server clampa o limit em 100; a busca segue client-side em AdminUsuarios):

```ts
export const getUsuarios = async ({ page = 1, limit = 10, token = null, search = '' }: { page?: number; limit?: number; token: string | null; search?: string }) => {
   const res = await authFetch(`${API_URL}/api/usuarios${querystring({ page, limit, search })}`, {
      headers: { Authorization: `Bearer ${token}` },
   })
   const data = await res.json()
   return data
}
```

- [ ] **Step 3: Remover `getEventosFullQuery`** (export morto, TODO.md:107).
- [ ] **Step 4:** `npx tsc --noEmit` → erros APENAS nos consumidores antigos (resolvidos nas Tasks 3–6; seus typechecks quebram nesta fase: aceitável, seguimos no mesmo PR).
- [ ] **Step 5: Commit**

```bash
git add src/data/data.ts
git commit -m "feat: camada de dados server-paginada (getEventos/getEventosAdmin/getMeusEventos/getUsuarios)"
```

---

### Task 2: Skeletons (`src/components/CardSkeleton.tsx` + novos)

**Files:**
- Modify: `src/components/CardSkeleton.tsx` (migrar p/ `<Skeleton>` do shadcn)
- Create: `src/components/TableSkeleton.tsx`
- Create: `src/components/BlockSkeleton.tsx` (mapa/calendário/stats)

**Interfaces:**
- Produces:
  - `CardSkeleton()` — espelha EventCard (imagem 52, título, meta, botão), shimmer + `motion-reduce:animate-none`.
  - `TableSkeleton({ linhas = 5, colunas }: { linhas?: number; colunas: number })` — `<TableRow>` com N `<Skeleton>`.
  - `BlockSkeleton({ className }: { className?: string })` — bloco `<Skeleton>` (altura reservada).

- [ ] **Step 1: `CardSkeleton.tsx`** — substituir divs `bg-muted`/`animate-pulse` por `<Skeleton>` (`src/components/ui/skeleton.tsx`), com `motion-reduce:animate-none` na raiz; estrutura idêntica à atual.
- [ ] **Step 2: `TableSkeleton.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { useMemo } from 'react'

export function TableSkeleton({ linhas = 5, colunas }: { linhas?: number; colunas: number }) {
   const linhasArr = useMemo(() => Array.from({ length: linhas }), [linhas])
   return (
      <TableBody aria-hidden="true">
         {linhasArr.map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
               {Array.from({ length: colunas }).map((_, j) => (
                  <TableCell key={j}>
                     <Skeleton className="h-5 w-full max-w-[160px] motion-reduce:animate-none" />
                  </TableCell>
               ))}
            </TableRow>
         ))}
      </TableBody>
   )
}
```

- [ ] **Step 3: `BlockSkeleton.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function BlockSkeleton({ className = 'h-80' }: { className?: string }) {
   return <Skeleton className={`w-full ${className} motion-reduce:animate-none`} aria-hidden="true" />
}
```

- [ ] **Step 4:** `npx tsc --noEmit` (só erros pré-existentes dos consumidores) → **Step 5: Commit**

```bash
git add src/components/CardSkeleton.tsx src/components/TableSkeleton.tsx src/components/BlockSkeleton.tsx
git commit -m "feat: skeletons acessíveis (card, tabela, bloco) com reduced-motion"
```

---

### Task 3: Home pública (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx` (queries, filtros, grid, stats, day-filter, mutações)
- Create: `src/hooks/debounce.ts`

**Interfaces:**
- Consumes: `getEventos`, `ResultadoEventos` (Task 1); `CardSkeleton`, `BlockSkeleton` (Task 2); `keepPreviousData` de `@tanstack/react-query`.
- Produces: query keys `'eventos'` (grid paginado) e `'eventos-calendario'` (bounded); invalidate padrão p/ mutações.

- [ ] **Step 1: `src/hooks/debounce.ts`**

```ts
import { useEffect, useState } from 'react'

/** Atrasa a propagação de um valor (usado p/ busca ao vivo). */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
   const [debounced, setDebounced] = useState(value)
   useEffect(() => {
      const timer = setTimeout(() => setDebounced(value), delayMs)
      return () => clearTimeout(timer)
   }, [value, delayMs])
   return debounced
}
```

- [ ] **Step 2: queries** — substituir `useState<Event[]>` + query atual por:

```ts
const buscaDeb = useDebouncedValue(searchTerm)
const { data, isLoading, isFetching, isError, refetch } = useQuery({
   queryKey: ['eventos', { page: currentPage, categoria: categoryFilter, busca: buscaDeb, dia: selectedDate ? selectedDate.toISOString().slice(0, 10) : null }],
   queryFn: () =>
      selectedDate
         // Com dia selecionado: o conjunto bounded já está no cache; não refaz query de página
         ? Promise.resolve({ eventos: eventosDia, pagination: { page: 1, limit: 100, total: eventosDia.length, totalPages: 0 } })
         : getEventos({ page: currentPage, limit: ITEMS_PER_PAGE, categoria: categoryFilter === 'all' ? undefined : categoryFilter, busca: buscaDeb }),
   placeholderData: keepPreviousData,
})
const { data: eventosCalendarioData } = useQuery({
   queryKey: ['eventos-calendario'],
   queryFn: () => getEventos({ page: 1, limit: 100, status: 'publicado' }),
   placeholderData: keepPreviousData,
})
```

  (No código final: `eventosDia` deriva de `eventosCalendarioData` com `matchesDay` — reuso da lógica de `fimDoDia`/`inicioDoDia` já existente em :354-364. SIMPLIFICAÇÃO de execução: manter `eventosDia` derivado inline, sem a 3ª query.)

- [ ] **Step 3: remove estado duplicado** — `events`/`setEvents` saem; usar:
  - `eventosGrid = data?.eventos ?? []` (server-paginado, ordem `dataInicio asc` — nota: muda do "mais recentes primeiro" p/ cronológico; o server não expõe ordenação).
  - `eventosCalendario = eventosCalendarioData?.eventos ?? []` → CalendarView, MapView e pips no dia.
  - handlers (`handleRequestDelete`, cancelamento/publicar) buscam alvo em `[...eventosGrid, ...eventosCalendario]`.
- [ ] **Step 4: stats** — Total = `data?.pagination?.total ?? 0`; Capacidade = soma de `eventosCalendario`; Categorias = `categoriasData?.length ?? 0`.
- [ ] **Step 5: remove client-filter** — apagar `filteredEvents`, `totalPages`, `startIndex/endIndex/paginatedEvents` (:354-370); `totalPages = data?.pagination?.totalPages ?? 0`; grid mapeia `eventosGrid`.
- [ ] **Step 6: loading/erro** — `isLoading` → grid de 6 `CardSkeleton`; MapView/CalendarView com `BlockSkeleton` no mesmo cenário; `isError` → mensagem + `refetch` (antes de mostrar vazio — TODO.md:77); durante `isFetching && !isLoading` → wrapper do grid com `aria-busy` + `opacity-60 transition-opacity`.
- [ ] **Step 7: mutações** — depois de create/edit/delete/cancelar/publicar: `queryClient.invalidateQueries({ queryKey: ['eventos'] })` e `queryClient.invalidateQueries({ queryKey: ['eventos-calendario'] })` (substitui `setQueryData` de :251-254).
- [ ] **Step 8:** `npx tsc --noEmit` → **Step 9: Commit**

```bash
git add src/app/page.tsx src/hooks/debounce.ts
git commit -m "feat: home com paginação server-side, filtro por dia via conjunto bounded e skeleton"
```

---

### Task 4: Meus eventos (`src/app/meus-eventos/page.tsx`)

**Files:**
- Modify: `src/app/meus-eventos/page.tsx:42-95` (queries/pagination)

**Interfaces:**
- Consumes: `getMeusEventos` (Task 1, retorna `{ eventos, pagination }`), `CardSkeleton`.

- [ ] **Step 1: uma única query server-paginada** — remover `['meus-eventos-todas']` e `getEventosAdmin`; usar:

```ts
const { data, error, isLoading, isFetching, refetch } = useQuery({
   queryKey: ['meus-eventos', tokenId, currentPage],
   queryFn: () => getMeusEventos(token!, { page: currentPage, limit: ITEMS_PER_PAGE }),
   enabled: isAuthenticated && (tokenId !== null || !!user),
   placeholderData: keepPreviousData,
})
const paginatedEvents = data?.eventos ?? []
const totalPages = data?.pagination?.totalPages ?? 0
```

- [ ] **Step 2: fallback `semOrganizadorMarcado`** — o endpoint dedicado já traz somente os eventos do usuário (não depende do `organizadorId`): remover `todasData`, `semOrganizadorMarcado`, o banner yellow (:178-189) e os ramos condicionais do empty state.
- [ ] **Step 3: paginação** — prev/next com `totalPages`; sem `<a href="#">` (usa `onClick` + `aria-disabled` via classe existente).
- [ ] **Step 4: mutações** — invalidar apenas `['meus-eventos']`; durante `isFetching && !isLoading`, mesmo `aria-busy`/opacity da Task 3.
- [ ] **Step 5:** `npx tsc --noEmit` → **Step 6: Commit**

```bash
git add src/app/meus-eventos/page.tsx
git commit -m "fix: meus-eventos usa GET /api/meus-eventos paginado (1 fetch em vez de 2)"
```

---

### Task 5: Admin (`src/app/admin/page.tsx` + `AdminEventos.tsx` + `AdminDashboard.tsx`)

**Files:**
- Modify: `src/app/admin/page.tsx:82-97` (fetch manual → query), `:224-241` (filtros), render `:246-266`
- Modify: `src/components/AdminEventos.tsx:34,47-82` (filtros sobem ao pai; sem client-slice)
- Modify: `src/components/AdminDashboard.tsx:35-105` (recebe overview bounded)

**Interfaces:**
- Consumes: `getEventosAdmin`, `ResultadoEventos` (Task 1); `TableSkeleton`, `CardSkeleton` (Task 2).
- Produces (props de AdminEventos): `events: Event[]` (página pronta), `totalPages: number`, `isFetching: boolean`, `isLoading: boolean`, `searchTerm`, `onSearchChange(value)`, `statusFilter`, `onStatusFilterChange(value)`.

- [ ] **Step 1: admin/page.tsx** — trocar `useEffect`+fetch manual por:

```ts
const buscaAdmin = useDebouncedValue(searchTerm)
const { data, isLoading, isFetching, isError, refetch } = useQuery({
   queryKey: ['admin-eventos', { page: currentPage, status: statusFilter, busca: buscaAdmin, categoryFilter }],
   queryFn: () =>
      getEventosAdmin(token, {
         page: currentPage,
         limit: 10,
         status: statusFilter === 'all' ? '' : statusFilter,
         busca: buscaAdmin,
      }),
   enabled: isAllowed && !!token,
   placeholderData: keepPreviousData,
})
const { data: overviewData } = useQuery({
   queryKey: ['admin-eventos-overview'],
   queryFn: () => getEventosAdmin(token, { page: 1, limit: 100, status: '' }),
   enabled: isAllowed && !!token,
   staleTime: 60_000,
})
```

  - `events = data?.eventos ?? []`; `totalPages = data?.pagination?.totalPages ?? 0`.
  - Novo estado `statusFilter` (`'all' | 'rascunho' | 'publicado' | 'cancelado'`, default `'all'`).
  - `AdminDashboard` recebe `events: overviewData?.eventos ?? []` + `totalEvents = overviewData?.pagination?.total ?? 0` + `isLoading/isError` (skeleton/bloco de erro).
  - Remover `setEvents`, `reload` state (mutações invalidam `['admin-eventos']` **e** `['admin-eventos-overview']`).
- [ ] **Step 2: AdminEventos** — filtros viram props controladas; apagar `searchTerm/statusFilter/currentPage/filteredEvents/sortedEvents/totalPages/paginatedEvents` locais (`:47-82`); `paginatedEvents = events`; `totalPages` vem de prop; busca/status com debounce já no pai; table render recebe `events` direto; loading 1º load → `TableSkeleton linhas={5} colunas={6}` (estado `isLoading` por prop); erro → mensagem + retry.
- [ ] **Step 3: AdminDashboard.tsx** — validação compila: `events` agora é conjunção bounded; ajust `onUpdateEvents` para prop opcional e remova do chamador se morta (rg `onUpdateEvents` — só assinatura).
- [ ] **Step 4: mutações** — `setReload(!reload)` em todos os handlers troca por invalidação inclusiva das 2 query keys.
- [ ] **Step 5:** `npx tsc --noEmit` → **Step 6: Commit**

```bash
git add src/app/admin/page.tsx src/components/AdminEventos.tsx src/components/AdminDashboard.tsx
git commit -m "feat: admin com paginação/filtros server-side + overview bounded + skeleton de tabela"
```

  **BUG FIXES nesta Task:** status server-side expõe rascunho/cancelado (antes ocultos — status omitido pela API default `publicado`).

---

### Task 6: AdminUsuarios (`src/components/AdminUsuarios.tsx`)

**Files:**
- Modify: `src/components/AdminUsuarios.tsx:61-112,319-402`

**Interfaces:**
- Consumes: `getUsuarios(token, { page, limit, search })` (Task 1, retorna `{ usuarios, pagination }`); `TableSkeleton`.

- [ ] **Step 1: query server-paginada**:

```ts
const buscaDeb = useDebouncedValue(searchTerm)
const { data, isLoading, isFetching, isError, refetch } = useQuery({
   queryKey: ['Usuarios', { token, currentPage, busca: buscaDeb }],
   queryFn: () => getUsuarios({ token, page: currentPage, limit: ITEMS_PER_PAGE }),
   placeholderData: keepPreviousData,
})
const usuarios = data?.usuarios ?? []
const totalPages = data?.pagination?.totalPages ?? 0
```

  - **Busca fica client-side** (server não aplica `search`): filtra a página atual APENAS quando paged search está inativo — implementação: quando `buscaDeb` não vazio, usar segunda query `['Usuarios-todos', { token }]` (`limit: 100`) e filtrar/paginar client sobre ela (caveat >100, mesma filosofia bounded).
- [ ] **Step 2: loading/tabela** — 1º load: `TableSkeleton linhas={5} colunas={6}` no lugar da linha "Carregando usuários..."; `isFetching && !isLoading` → `aria-busy` + opacity na table wrapper.
- [ ] **Step 3:** `npx tsc --noEmit` → **Step 4: Commit**

```bash
git add src/components/AdminUsuarios.tsx
git commit -m "feat: usuarios com paginação server-side, busca client bounded e skeleton"
```

---

### Task 7: TODO.md + verificação final

**Files:**
- Modify: `TODO.md` (itens :70, :107 → `[x]`; nota em :76)

- [ ] **Step 1:** Marcar como feitos os itens de paginação server-side; atualizar `data.ts` refs de linha no TODO.
- [ ] **Step 2:** `npx tsc --noEmit` → limpo; `npm run lint` → sem erros novos; `npm run build` de produção.
- [ ] **Step 3: Verificação manual (dev server + Network tab):**
  1. Home: `limit=100, page=` nas chamadas; busca/categoria/paginação sem `limit=1000`; skeleton 1º load; Gutenberg 3G.
  2. Dia selecionado: grid muda, sem pagination; mapa/calendário completos.
  3. Stats: Total = `pagination.total`; Capacidade = bounded.
  4. Admin (principais): rascunhos/cancelados agora listados; filtro `todos` faz `status=''`.
  5. `meus-eventos`: 1 chamada (`/api/meus-eventos?page=1&limit=6`), não 2.
  6. AdminUsuarios: paginação server-side; com busca preenchida, a 2ª query bounded alimenta o filtro client (caveat >100 documentado).
- [ ] **Step 4: Commit final**

```bash
git add TODO.md
git commit -m "docs: fecha itens de paginação server-side no TODO"
```

---

## Notes de execução

- **Ordem/random cruzamento de dados:** a home server-sort por `dataInicio ASC` no lugar do sort desc client — aceitar e comunicar no PR.
- `getMeusEventos` antigo filtrava por `organizadorId` — endpoint `/api/meus-eventos` devolve **somente os seus** (contrato confirmado).
- `AdminEventos` continua com ordenação client por `dataCriacao desc` sobre a página recebida? NÃO — a página já vem fatiada; remover o sort (server-side `dataInicio asc` prevalece).
- `getLocais`/`getCategorias` inalterados.
- O `querystring` do admin ('status' vazio) é um detalhe: construir a URL de admin com `URLSearchParams` e `qs.set('status', '')` SE e SOMENTE SE status é `''` (o server precisa receber `status=` vazio para não defaultar a `publicado`).
