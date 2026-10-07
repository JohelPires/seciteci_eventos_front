# Espec: Autorização baseada em claims do JWT

Data: 2026-10-07 · Branch base: `dev`

## Problema

A permissão de admin é derivada de `authUser.tipoUsuario` persistido no
localStorage — manipulável pelo DevTools. O JWT emitido pelo backend
(`controllers/authController.js:82`) já traz no payload `{ id, tipo, exp }`
com `tipo` no mesmo domínio da role (`admin | organizador | participante`),
mas o frontend só lê `exp` (`src/lib/jwt.ts`). O TODO.md (linha 54) pede a
migração para claims do token; o TODO.md (linha 85) registra um gap
relacionado: `useAdminGuard` dispara os fetches admin antes de checar
`isAllowed` e o `token` não está nos deps do `useEffect`.

## Decisões (aprovadas)

- **Abordagem A**: role derivada exclusivamente do JWT, centralizada no
  AuthContext; consumidores trocam `user?.tipoUsuario === 'admin'` por
  `isAdmin`/`userRole` do contexto.
- **`authUser` continua no localStorage**, mas apenas como perfil
  (nome/email/foto). Manipulá-lo não concede permissão alguma.
- Claim lido como **string simples** (`tipo`), domínio
  `admin | organizador | participante`.
- **Fail-closed** em `isTokenValid` (formato JWT confirmado no backend;
  o fail-open anterior perde a razão de ser).
- Branch `dev`. Inclui o fix do fetch antecipado do guard.

## Escopo

### 1. `src/lib/jwt.ts`

- Novo export `obterClaims(token: string): JwtClaims | null`, onde
  `JwtClaims = { id?: number; tipo?: string; exp?: number }`. Decodifica as
  3 partes em base64url, parseia o payload e valida tipos dos campos usados
  (`tipo` string, `id` number, `exp` number); qualquer falha → `null`.
- `isTokenValid` deixa de ser fail-open: token sem 3 partes, payload
  não-parseável ou sem `exp` numérico → inválido (`false`). Atualizar o
  comentário: o fail-open era justificado por não conhecermos o formato;
  agora o formato é confirmado (`authController.js` emite `jwt.sign` com
  `{ id, tipo }` + `expiresIn`, logo `exp` presente).
- `tipo` fora do domínio conocido NÃO invalida o token por si só
  (`isTokenValid` valida `exp` apenas); quem trata domínio é o AuthContext
  (ver 2), que mapeia valor desconhecido para `userRole = null`.

### 2. `src/context/AuthContext.tsx`

- Novos valores expostos no provider:
  `userRole: 'admin' | 'organizador' | 'participante' | null` e
  `isAdmin: boolean` (`userRole === 'admin'`).
- Restante do estado da sessão passa a ser montado a partir do token:
  - `isAuthenticated = !!token && isTokenValid(token) && userRole !== null`
    (na prática `!!token && !!userRole`; ver 2.1 sobre re-cálculo).
  - `userRole` inicial: extraído do token restaurado/definido; o `user`
    (perfil) continua do localStorage.
  - `user.tipoUsuario` deixa de ser lido para autorização em nenhum código
    vivo. O campo permanece na interface `User` (o backend ainda o envia no
    body) para uso de exibição, mas nenhuma permissão depende dele.
- Fluxo:
  - **Restore** (`useEffect` inicial): `obterClaims(storedToken)` →
    `userRole = mapa(claims?.tipo)`; se `isTokenValid` falhar ou
    `userRole === null`, limpa sessão e segue deslogado (fail-closed:
    token sem `tipo` legível não autentica).
  - **login/register**: após receber `{ token, user }`, decodifica o token
    e deriva `userRole`; se `userRole === null`, trata como falha de login
    (toast de erro, não persiste sessão).
  - **logout**: reseta `userRole` junto com token/user.
- Nota registrada no TODO.md: se o backend mudar a role de um usuário
  (ex.: promover via `promoverUsuario`), o token antigo continua com a
  role antiga até novo login — próprio usuário promovido precisa
  re-logar (o admin que promove não é afetado).

### 3. Consumidores — troca da fonte de permissão

| Arquivo | Mudança |
|---|---|
| `src/app/admin/page.tsx:27-39` | `useAdminGuard` usa `isAdmin`/`userRole` do contexto; **fetches admin (linhas ~65-91) só disparam quando `isAllowed`**, `token` entra nos deps do `useEffect` |
| `src/components/Navbar.tsx:73` | Badge/botão "Painel" condicionado a `isAdmin` |
| `src/components/EventCard.tsx:36/114/182/216` | prop `isAdmin` passada pelos pais continua existe, mas o cálculo `podeGerenciar` e badges de admin passam a ser alimentados por `isAdmin` do contexto |
| `src/components/EventDetails.tsx:116/293` | idem — `isAdmin` do contexto |
| `src/app/meus-eventos/page.tsx` | usa `claims.id` (via helper `obterTokenId` no jwt.ts ou `userRoleId` exposto no contexto) como fonte confiável de `userId` para o filtro `organizadorId` |

**Fora de escopo (permanecem com a role da API — são dados, não autorização):**
`AdminUsuarios.tsx`, `UserBadge.tsx` (exibição de papel de OUTROS
usuários vindos do endpoint `/api/usuarios`), botão "Promover a admin".

### 4. Tratamento de erros / casos de borda

- Token JWT válido mas sem `tipo`: sessão deslogada no restore; login
  falha com mensagem genérica. Fail-closed.
- Token não-JWT (campo opaco): restauração deslogada. **Mudança visível**
  em relação ao comportamento atual — qualquer usuário com token opaco
  antigo será deslogado uma vez; aceito (formato confirmado).
- `authUser` JSON corrompido/ausente no localStorage com token válido: a
  sessão pode continuar autenticada, mas as features dependentes de
  perfil não quebram — o contexto torna o `user` também derivável e o
  AuthContext tolera `authUser` ausente definindo o perfil como `null`
  (ou seja, `isAuthenticated` deixa de exigir `!!user`).
- `localStorage` indisponível (SSR/`typeof window`): código atual já
  guarda; manter.

### 5. Verificação

- `npx tsc --noEmit` e `npm run lint` limpos.
- Manual: logar como admin; editar `authUser` no DevTools setando
  `tipoUsuario: 'admin'` numa conta comum → painel continua bloqueado.
- Manual: manipular `authToken` para token com `tipo: 'participante'` →
  painel bloqueado; com `tipo: 'admin'` mas expirado → deslogado no restore.
- Manual: logar admin, abrir painel, recarregar → fetches de eventos
  só acontecem após `isAllowed` (Network tab).

## Arquitetura de referência

```
JWT (localStorage: authToken)
  └─ src/lib/jwt.ts        → isTokenValid (fail-closed), obterClaims
       └─ AuthContext      → userRole, isAdmin, isAuthenticated (token-only)
            ├─ admin/page  → useAdminGuard (isAdmin + gate de fetches)
            ├─ Navbar      → isAdmin
            ├─ EventCard   → isAdmin
            ├─ EventDetails→ isAdmin
            └─ meus-eventos→ tokenId (claims.id)

localStorage authUser → apenas perfil exibido (nome/foto/edit-own-fields)
API responses (Usuarios) → role de outros usuários (exibição)
```
