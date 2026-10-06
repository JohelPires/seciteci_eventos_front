# Design — Menu real + "Meus eventos"

Data: 2026-10-05

## Problema

O menu hambúrguer (`src/components/Navbar.tsx:21-29`) tem 6 itens falsos (Oportunidades, Agentes, Eventos, Espaços, Projetos, Acessibilidade) que não navegam para rota alguma — apenas mudam uma aba visual e fecham o menu. Não existe tela onde o usuário veja os eventos que ele mesmo criou: a home lista só eventos publicados e a edição é gated por `isAdmin`.

## Decisões (acordadas com o usuário)

1. **Remover todos os 6 links falsos** do menu hambúrguer.
2. **Acesso**: qualquer usuário autenticado (client, professional, admin) acessa "Meus eventos"; não autenticado é redirecionado para `/`.
3. **Busca**: sem endpoint dedicado no backend — filtro client-side sobre `getEventosAdmin(token)`, por `organizadorId === user.id`, **com fallback** (banner explicativo) quando o campo não vier preenchido pelo backend.
4. **Status**: mostrar eventos do usuário em **todos os status** (rascunho, publicado, cancelado), com badge.
5. **Ações**: ver detalhes, editar e excluir os próprios eventos (via `canManage`, independente de role).
6. **Visibilidade do item**: "Meus eventos" sempre visível no menu; clique sem login abre o `AuthDialog`.
7. **Footer**: não mexer (fora do escopo).

## Approaches considerados

- **A (escolhida)** — Rota única `/meus-eventos` + `?action=create` na home. URL carrega estado, reuso máximo dos componentes existentes.
- B — Duas rotas com botões internos de criar (mais pontos de entrada, código duplicado).
- C — UIContext global para abrir dialogs da Navbar (overengineering, YAGNI).

## Menu novo (Navbar.tsx)

Substituir `navItems` por 3 itens reais:

| Item | Ação | Sem login |
|---|---|---|
| Explorar eventos | `router.push('/')` | navega |
| Meus eventos | `router.push('/meus-eventos')` | abre `AuthDialog` |
| Criar evento | `router.push('/?action=create')` | abre `AuthDialog` |

- "Painel" (só admin), "Entrar", "Sair" permanecem como estão.
- Navegação via `useRouter` (`next/navigation`).
- Clique em item fecha o menu.
- Ícones lucide-react: `CalendarSearch` (Explorar), `FolderOpen` (Meus eventos), `PlusCircle` (Criar evento).

## Página `/meus-eventos`

Arquivo: `src/app/meus-eventos/page.tsx` ('use client').

- **Guard client-side**: `!isAuthenticated && !loading` → `router.replace('/')` (padrão do `useAdminGuard`, mas para qualquer autenticado).
- **Dados**: `useQuery({ queryKey: ['meus-eventos', user?.id], queryFn: () => getMeusEventos(token!, user!.id) })`, habilitada só quando `isAuthenticated`.
- **Fallback**: se a lista bruta tiver > 0 eventos, o filtro resultar em 0 e nenhum evento bruto tiver `organizadorId` preenchido → banner "Não foi possível carregar seus eventos automaticamente..." + botão "Tentar novamente" (`refetch`). Caso contrário, lista vazia = empty state normal.
- **Layout**: Navbar no topo, header com título/contagem, grid de `EventCard` (mesmo padrão da home), `CardSkeleton` durante loading, paginação client-side (6/página), empty state com framer-motion.
- **Badges de status**: rascunho / publicado / cancelado visíveis para o dono.
- **Ações por card**: `onClick` → `EventDetails`; `canManage = true` → Editar (`EventForm`) e Excluir (`AlertDialog` de confirmação), replicando handlers da home + invalidação da query.

## Mudanças de suporte

- **`src/data/data.ts`**: nova export `getMeusEventos(token, userId)` — chama `getEventosAdmin(token)`, filtra `Number(e.organizadorId) === userId` (NaN-safe), retorna array simples. Também retorna a lista bruta via `getEventosAdminRaw` para o fallback.
- **`EventCard.tsx` / `EventDetails.tsx`**: badge de status e botões Editar/Excluir ficam visíveis quando `isOwner` (dono do evento), além de admin.
- **`src/app/page.tsx`**: `useSearchParams().get('action') === 'create'` → logado abre `EventForm`; não logado abre `AuthDialog`. Após fechar, `router.replace('/', { scroll: false })`.

## Erros e estados

- Loading → skeletons; erro da query → mensagem + retry.
- 401 → comportamento existente do `authFetch`.
- Banner de fallback quando o backend não marcar `organizadorId` (nenhuma mudança no backend).

## Escopo fora

- Footer (links `href="#"`), CalendarView/MapView no menu, mudanças no backend.

## Verificação

`npx tsc --noEmit`, `npm run lint`, `npm run build` + checagem manual (menu navega; `/meus-eventos` mostra os próprios eventos com todos os status; criar via `/?action=create`; não logado → AuthDialog no menu e redirect na página).
