# Design — Paginação server-side + skeleton de loading

Data: 2026-10-18

## Problema

Todas as listagens buscam o conjunto completo da API e filtram/paginam no client (`limit=1000`):

- `data.ts:76` `getEventos` — `limit=1000`, busca/categoria/paginação no client (home pública).
- `data.ts:103` `getEventosAdmin` — `limit=1000`, sem `status`. Como a API trata status omitido como `publicado`, o admin **só enxerga eventos publicados** (rascunho/cancelado somem no reload) — bug latente.
- `data.ts:118` `getMeusEventos` — busca **todos** os eventos e filtra por `organizadorId` no client; ignora o endpoint dedicado `GET /api/meus-eventos`. `meus-eventos/page.tsx:62-72` ainda dispara **duas** queries de lista completa (`meus-eventos-todas` + `meus-eventos`).
- `data.ts:236` `getUsuarios` — `limit=1000` + busca no client.
- `data.ts:85` `getEventosFullQuery` — export morto que já monta a query paginada correta.
- `admin/page.tsx:86-97` — fetch manual com `useState`, sem loading/erro/paginação server (TODO.md:76).
- Home e admin não distinguem erro de lista vazia (TODO.md:77).

Com volume crescente de eventos, degrada payload, tempo de resposta e renders dos componentes (calendário, mapa, grid).

## Contrato da API (verificado em http://localhost:3030/api-docs.json e na API real)

`GET /api/eventos` (público): params `categoria`, `cidade`, `status` (rascunho|publicado|cancelado|encerrado), `tipo` (presencial|online|hibrido), `busca` (título/descrição/cidade/local), `page` (default 1), `limit` (default 10). Resposta:

```json
{ "eventos": [...], "pagination": { "page": 1, "limit": 3, "total": 18, "totalPages": 6 }, "cache": ... }
```

Comportamentos confirmados por teste real:

- **status vazio (`status=`) = todos os status**; status omitido = só `publicado`.
- Não existe filtro multi-status (`status=todos/all/a,b` → 0 resultados) nem filtro por data.
- `limit` não é clampado (aceita 1000), apesar do swagger documentar máximo 100.
- `busca` filtra server-side e `pagination.total` reflete o resultado filtrado.

Endpoints protegidos ainda a verificar (Fase 0 do plano): `GET /api/meus-eventos` e `GET /api/usuarios` (shape e se aceitam `page`/`limit`).

## Decisões (acordadas com o usuário)

1. **Home**: grid server-paginado (6/página, busca/categoria server-side). Calendário e mapa alimentados por uma 2ª **query bounded** (`limit≤100`). Stats reais: "Total de Eventos" = `pagination.total`; "Capacidade total" permanece, somada sobre o conjunto bounded (cobre os 100 publicados mais recentes; diferença só aparece acima desse teto).
2. **Escopo**: home pública + admin + meus-eventos + AdminUsuarios.
3. **Loading**: skeleton só no 1º load; nas trocas de página/filtro, manter a página anterior visível (`keepPreviousData`) com leve escurecimento + `aria-busy`.
4. **Filtro por dia (clique no calendário)**: usa o conjunto bounded — sem dia, grid server-paginado; com dia, o grid mostra os eventos daquele dia do conjunto bounded, sem paginação.
5. Filtro de data no backend: fora de escopo (registrar como fase futura), junto do caveat do conjunto bounded (>100 eventos no calendário/mapa).

## Approaches considerados

- **A (escolhida)** — Server-side em toda listagem + query bounded para calendário/mapa/stats. Fortalece o contrato existente da API sem mudanças no backend.
- B — Paginar só o grid e alimentar calendário/mapa com a página atual (mais simples, mas calendário/mapa deixam de mostrar todos os eventos — muda UX).
- C — Espelhar tudo no client com virtualização (não resolve payload/CPU, só render).

## Fase 1 — Camada de dados (`src/data/data.ts`)

- Tipos novos: `Pagination = { page; limit; total; totalPages }` e `RespostaPaginada<T> = { eventos: T[]; pagination: Pagination }`.
- Helper único de querystring (encolhe as 13 funções repetidas — TODO.md:90).
- `getEventos({ page=1, limit=6, categoria, busca, status='publicado', tipo })` → `{ eventos, pagination }`; substitui e **remove** o export morto `getEventosFullQuery` (TODO.md:107).
- `getEventosAdmin(token, { page=1, limit=10, status='', busca })` — `status=''` por padrão = todos os status (corrige o bug latente).
- `getMeusEventos(token, { page, limit })` → usa `GET /api/meus-eventos`; se a Fase 0 mostrar que o endpoint não pagina, cai para o conjunto bounded com filtro client por `organizadorId`.
- `getUsuarios({ token, search, page, limit })` → repassa paginação (detalhe depende da Fase 0).
- `normalizarEvento`/`normalizarEventos` inalterados.

## Fase 2 — Home pública (`src/app/page.tsx`)

- Query keyed por filtros: `['eventos', { page, categoria, busca }]`, `getEventos(...)` com `placeholderData: keepPreviousData`.
- Busca/categoria passam ao servidor (debounce ~350 ms no busca); remover `filteredEvents`/`slice` client e o `useState` espelhando a query (TODO.md:112).
- Reset de página quando muda busca/categoria/dia.
- **Query bounded** `['eventos-calendario']` → `getEventos({ limit: 100, status: 'publicado' })`; alimenta `CalendarView`, `MapView` e o grid quando há dia selecionado.
- Stats: `pagination.total` / soma bounded / contagem de categorias.
- `totalPages` = `pagination.totalPages`; mutações (delete/publicar/cancelar) invalidam `['eventos']` e `['eventos-calendario']`.

## Fase 3 — Admin (`admin/page.tsx` + `AdminEventos.tsx`)

- Fetch manual → `useQuery` keyed `{ page, status, busca }`, `enabled: isAllowed`, `placeholderData: keepPreviousData`.
- Filtro de status server-side (todos/rascunho/publicado/cancelado — `todos` manda `status=''`) + busca server-side debounce.
- `AdminEventos` deixa de fatiar no client; recebe página pronta + `totalPages`.
- `isError` com mensagem + retry (hoje só `console.log`); skeleton de tabela no 1º load (TODO.md:76).

## Fase 4 — Meus-eventos (`src/app/meus-eventos/page.tsx`)

- Uma única query `/api/meus-eventos`; remover a duplicata `['meus-eventos-todas']`.
- Paginação server-side (ou bounded, conforme Fase 0); manter `CardSkeleton`.
- Reavaliar fallback `semOrganizadorMarcado` sem o fetch completo; mutações invalidam só `['meus-eventos']`.

## Fase 5 — AdminUsuarios (`src/components/AdminUsuarios.tsx`)

- Paginação + busca server-side (conforme Fase 0); remover `filteredUsuarios`/`slice`; skeleton de linhas; `isError` + retry.

## Fase 6 — Skeletons e UX de loading

- `CardSkeleton` (existe): migrar para `<Skeleton>` do shadcn, espelhar a geometria real do `EventCard`, shimmer sutil, respeitar `prefers-reduced-motion` (`motion-reduce:animate-none`). Renderizar `ITEMS_PER_PAGE` no 1º load.
- Novos `EventTableSkeleton` e `UserTableSkeleton` (linhas com colunas corretas) para o admin.
- Skeleton próprio (altura reservada, sem CLS) para MapView/CalendarView no 1º load.
- Troca de página/filtro: conteúdo anterior visível, `aria-busy="true"`, opacidade reduzida, status em `aria-live="polite"` ("Carregando eventos…").
- Separar erro (mensagem + "Tentar novamente") de lista vazia (TODO.md:77).

## Fora de escopo (registrar em TODO.md)

- Filtro por data / agregados no backend (caveat do bounded >100).
- Paginadores `<a href="#">` → `aria-disabled` (TODO.md:102).
- Migrar `<img>` para `next/image` (TODO.md:71).
- Memoizar `QueryClient` + `defaultOptions` (TODO.md:58) — recomendado puxar para a Fase 2, mas cabe em PR separado.

## Verificação

- `npx tsc --noEmit`, `npm run lint`.
- Manual: combinações busca×categoria×página; dia selecionado; mapa/calendário; stats; admin com rascunho/cancelado; meus-eventos; usuários.
- Network: nenhuma chamada com `limit=1000`; `limit ≤ 100`.
- Throttling 3G/Slow 4G: skeleton visível no 1º load; nenhuma troca de página salta para skeleton.
