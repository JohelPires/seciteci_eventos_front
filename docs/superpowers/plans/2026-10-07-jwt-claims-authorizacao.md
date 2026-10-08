# Autorização via claims JWT — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derivar a autorização de admin/role exclusivamente dos claims do JWT (`{ id, tipo, exp }`), tornando o `authUser` do localStorage mero perfil exibível.

**Architecture:** `src/lib/jwt.ts` expõe `obterClaims()` e vira fail-closed; `AuthContext` centraliza `userRole`/`isAdmin`/`tokenId` derivados do token; os consumidores trocam leituras de `user.tipoUsuario` por `isAdmin` do contexto, com gate de fetch no painel admin.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, TanStack Query.

Spec: `docs/superpowers/specs/2026-10-07-jwt-claims-authorizacao-design.md`

## Global Constraints

- Sem infra de testes no projeto — NÃO criar testes; verificação por `npx tsc --noEmit` + `npm run lint` + checagens manuais no navegador.
- `npx tsc --noEmit` DEVE rodar antes de todo commit (AGENTS.md).
- Commits em português com prefixo `[fix]` (segurança); nenhum comentário além dos existentes no estilo do arquivo, em português.
- Não editar `EventForm2.tsx.backup` nem `src/components/ui/*.tsx.del` (arquivos mortos).
- Role/claim do backend: `tipo` no payload JWT (string `admin | organizador | participante`); body de login continua devolvendo `user` com `tipoUsuario` (usado só como perfil).
- Branch base: `dev`.

## File Structure

- Modify: `src/lib/jwt.ts` — decodificação de claims + validação fail-closed (fonte única de parsing JWT)
- Modify: `src/context/AuthContext.tsx` — estado de sessão derivado do token: `userRole`, `isAdmin`, `tokenId`
- Modify: `src/app/admin/page.tsx` — guard + gate de fetches
- Modify: `src/components/Navbar.tsx:70-77` — botão Painel e badge próprios via `isAdmin`/`userRole`
- Modify: `src/components/AdminDashboard.tsx:133` — badge de papel próprio via `userRole`
- Modify: `src/components/EventCard.tsx` — `podeGerenciar`/badges via `isAdmin` do contexto
- Modify: `src/components/EventDetails.tsx:116,293` — idem
- Modify: `src/app/meus-eventos/page.tsx` — `userId` confiável via `tokenId`
- Modify: `TODO.md` — marcar itens concluídos

**Disclaimer de ordem:** Tasks 1 e 2 precisam ser implementadas antes das demais (os consumidores consomem o novo contrato do contexto). Tasks 3–6 são independentes entre si.

---

### Task 1: jwt.ts — `obterClaims` + `isTokenValid` fail-closed

**Files:**
- Modify: `src/lib/jwt.ts` (reescrita, 32 linhas hoje)

**Interfaces:**
- Produces: `interface JwtClaims { id?: number; tipo?: string; exp?: number }`; `obterClaims(token: string): JwtClaims | null`; `isTokenValid(token: string): boolean`. Rotina interna `decodificarBase64Url` permanece privada, assinatura inalterada.

Consumo manual sobrescrevendo o localStorage do navegador é a "suíte de testes" desta task (passo 4); validação estática por tsc/lint em todos os passos.

- [ ] **Step 1: Reescrever `src/lib/jwt.ts`**

Substituir o conteúdo integral do arquivo por:

```ts
// Utilitário puro para decodificar e validar tokens JWT (payload sem verificação de assinatura).
// Não usa dependências externas: decodifica o payload com atob e ajustes de base64url.
// A assinatura NÃO é verificada aqui (impossível no cliente); quem valida de verdade é o backend,
// e requisições inválidas resultam em 401 tratado pelo authFetch em src/data/data.ts.

// Converte uma string em base64url para base64 padrão e decodifica com atob,
// adicionando o padding '=' necessário quando o comprimento não é múltiplo de 4.
const decodificarBase64Url = (entrada: string): string => {
   const base64 = entrada.replace(/-/g, '+').replace(/_/g, '/')
   const resto = base64.length % 4
   const padding = resto === 0 ? '' : '='.repeat(4 - resto)
   return atob(base64 + padding)
}

export interface JwtClaims {
   id?: number
   tipo?: string
   exp?: number
}

// Decodifica e retorna os claims do payload, ou null se não for um JWT parseável.
// O backend emite { id, tipo } no payload (controllers/authController.js) junto do
// `exp` padrão do jwt.sign, mas os campos são opcionais aqui porque este utilitário
// só decodifica — quem valida cada claim é o consumidor (AuthContext).
export const obterClaims = (token: string): JwtClaims | null => {
   const partes = token.split('.')
   if (partes.length !== 3) return null
   try {
      const payload = JSON.parse(decodificarBase64Url(partes[1])) as JwtClaims | null
      if (!payload || typeof payload !== 'object') return null
      return payload
   } catch {
      return null
   }
}

// Decisão fail-closed: qualquer token que não seja um JWT com `exp` válido é inválido.
// O fail-open anterior era justificado por não conhecermos o formato do token; hoje o
// formato é confirmado (jwt.sign com { id, tipo } e expiresIn no backend).
// JWT sem `exp` numérico ou expirado → false.
export const isTokenValid = (token: string): boolean => {
   const claims = obterClaims(token)
   if (!claims || typeof claims.exp !== 'number') return false
   const agoraEmSegundos = Math.floor(Date.now() / 1000)
   return claims.exp > agoraEmSegundos
}
```

- [ ] **Step 2: Verificação estática (o único consumidor vivo do arquivo é o AuthContext, que na Task 2 migra para `obterClaims`)**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS (ninguém mais importa este módulo além do AuthContext; `isTokenValid` continua exportada com a mesma assinatura)

- [ ] **Step 3: Commit**

```bash
git add src/lib/jwt.ts
git commit -m "[fix] jwt.ts: expõe obterClaims e valida formato fail-closed (token não-JWT/sem exp = inválido)"
```

---

### Task 2: AuthContext — `userRole`/`isAdmin`/`tokenId` derivados do token

**Files:**
- Modify: `src/context/AuthContext.tsx`

**Interfaces:**
- Consumes: `obterClaims`, `isTokenValid` da Task 1.
- Produces (novo contrato do `useAuth()` usado por Tasks 3–6):
  - `userRole: 'admin' | 'organizador' | 'participante' | null`
  - `isAdmin: boolean` (`userRole === 'admin'`)
  - `tokenId: number | null` (claim `id` do JWT)
  - `isAuthenticated: boolean` — passa a exigir token válido + role legível; NÃO exige `user`
  - `user: User | null`, `token: string | null`, `loading: boolean`, `login/register/logout` inalterados em assinatura

- [ ] **Step 1: Ajustar imports e tipos**

Em `src/context/AuthContext.tsx:6`:

```ts
import { isTokenValid, obterClaims } from '@/lib/jwt'
```

Acima da interface `User` (linha 11), adicionar o tipo e o domínio de roles:

```ts
type TipoUsuario = 'admin' | 'organizador' | 'participante'

const ROLES_VALIDAS: readonly TipoUsuario[] = ['admin', 'organizador', 'participante']
```

Na interface `User`, deixar comentário explícito (linha 19):

```ts
   // Somente perfil/exibição: a permissão REAL vem do claim `tipo` do JWT (userRole no contexto)
   tipoUsuario: TipoUsuario
```

Estender `AuthContextType` (linhas 24–32):

```ts
interface AuthContextType {
   user: User | null
   token: string | null
   userRole: TipoUsuario | null
   isAdmin: boolean
   tokenId: number | null
   isAuthenticated: boolean
   loading: boolean
   login: (email: string, senha: string) => Promise<void>
   register: (nome: string, email: string, senha: string, userType: 'client' | 'professional') => Promise<void>
   logout: () => void
}
```

- [ ] **Step 2: Helper `resolverUserRole` + novo estado**

Logo após `getStoredAuthData` (linha 46), adicionar:

```ts
// Fonte de verdade da role: claim `tipo` do JWT. Valor fora do domínio
// conhecido (ou token sem claim) vira null — fail-closed.
const resolverUserRole = (token: string | null): TipoUsuario | null => {
   const claims = token ? obterClaims(token) : null
   return claims && ROLES_VALIDAS.includes(claims.tipo as TipoUsuario)
      ? (claims.tipo as TipoUsuario)
      : null
}
```

Dentro do `AuthProvider`, junto ao `useState` de `token` (linha 50):

```ts
const [userRole, setUserRole] = useState<TipoUsuario | null>(null)
const [tokenId, setTokenId] = useState<number | null>(null)
```

Substituir `const isAuthenticated = !!token && !!user` (linha 54) por:

```ts
// Autenticação depende do TOKEN (formato + exp + role legível), não do authUser
// do localStorage — que é manipulável no DevTools e leva só o perfil.
const isAuthenticated = !!token && !!userRole
const isAdmin = userRole === 'admin'
```

- [ ] **Step 3: Restore fail-closed**

Substituir o `useEffect` de restore (linhas 56–68) por:

```ts
useEffect(() => {
   const { token: storedToken, user: storedUser } = getStoredAuthData()
   const role = storedToken ? resolverUserRole(storedToken) : null
   // Token ausente, expirado, não-JWT ou sem role legível: limpa a sessão persistida
   // e segue como deslogado (o 401 em chamadas da API continua a cargo do data.ts)
   if (!storedToken || !isTokenValid(storedToken) || role === null) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
   } else {
      setToken(storedToken)
      setUserRole(role)
      setTokenId(obterClaims(storedToken)?.id ?? null)
      // authUser é só perfil: pode estar ausente ou corrompido sem invalidar a sessão
      if (storedUser) setUser(storedUser)
   }
   setLoading(false) // auth resolvido, libera a aplicação
}, [])
```

Nota: `getStoredAuthData` fará `JSON.parse` direto; para tornar o perfil tolerante a JSON corrompido, mudar a linha 42 para try/catch:

```ts
const getStoredAuthData = () => {
   if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken')
      const storedUserJson = localStorage.getItem('authUser')
      let user: User | null = null
      try {
         user = storedUserJson ? (JSON.parse(storedUserJson) as User) : null
      } catch {
         user = null
      }
      return { token: storedToken, user }
   }
   return { token: null, user: null }
}
```

(este step presume o parse tolerante a JSON corrompido de `getStoredAuthData` já aplicado acima; o restore resume-se a `if (storedUser) setUser(storedUser)`, como no bloco)

- [ ] **Step 4: login/register derivam role do token**

Em `login` (após extrair `receivedToken`/`userData` na linha 84), antes de persistir:

```ts
const role = resolverUserRole(receivedToken)
if (role === null) {
   // Backend autenticou mas não devolveu um JWT com role legível — não há sessão confiável
   throw new Error('Resposta de login inválida. Contate o suporte.')
}
```

Substituir as persistências (linhas 86–90) por:

```ts
localStorage.setItem('authToken', receivedToken)
if (userData) localStorage.setItem('authUser', JSON.stringify(userData))
setToken(receivedToken)
setUserRole(role)
setTokenId(obterClaims(receivedToken)?.id ?? null)
if (userData) setUser(userData as User)
```

O `toast` de boas-vindas (linha 92) passa a tolerar usuário sem `userData`:

```ts
toast.success(`Bem-vindo(a), ${(userData?.nome ?? '').split(' ')[0] || 'usuário(a)'}!`)
```

Em `register`, aplicar o MESMO bloco no lugar das linhas 116–121 (mesmo código de `role`/persistência acima; o `throw` do register usa mensagem `'Resposta de registro inválida. Contate o suporte.'`).

- [ ] **Step 5: logout**

Em `logout` (linhas 134–141), acrescentar junto aos resets existentes:

```ts
setUserRole(null)
setTokenId(null)
```

- [ ] **Step 6: Provider expõe o novo contrato**

Linha 144:

```tsx
<AuthContext.Provider value={{ user, token, userRole, isAdmin, tokenId, isAuthenticated, loading, login, register, logout }}>
```

- [ ] **Step 7: Verificação estática**

Run: `npx tsc --noEmit`
Expected: PASS — PODE falhar em consumidores que leem `isAuthenticated`/`user` de forma incompatível com o novo contrato? Não deve: o contrato só ganha campos. `tsc` limpo esperado.

Run: `npm run lint`
Expected: PASS

- [ ] **Step 8: Verificação manual (backend local em localhost:3030 ligado)**

Login válido → Navbar mostra badge e nome; DevTools → editar `authUser` para `tipoUsuario: 'participante'` numa conta admin `/admin` continua acessível nesta task (consumidores ainda não migrados); token manipulado para payload sem `tipo` → recarregar página desloga.

- [ ] **Step 9: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "[fix] AuthContext: role/autenticação derivados do JWT (tipo/exp); authUser vira só perfil"
```

---

### Task 3: admin/page.tsx — guard via `isAdmin` + gate de fetches

**Files:**
- Modify: `src/app/admin/page.tsx:27-39,59,65-91`

**Interfaces:**
- Consumes: `isAdmin`, `isAuthenticated`, `userRole`, `tokenId` (Task 2).

- [ ] **Step 1: `useAdminGuard` usa o contexto**

Substituir linhas 27–39 por:

```tsx
function useAdminGuard() {
   const { isAuthenticated, isAdmin, loading } = useAuth()
   const router = useRouter()

   useEffect(() => {
      if (loading) return // espera resolver o token do localStorage
      if (!isAuthenticated || !isAdmin) {
         router.replace('/')
      }
   }, [isAuthenticated, isAdmin, loading, router])

   return { isAllowed: isAuthenticated && isAdmin, loading }
}
```

- [ ] **Step 2: Gate de fetches (TODO.md:85)**

Linha 59 passa a incluir `isAllowed` do guard (deleta `isAuthenticated, user` da destruturação do useAuth — `user` não é usado pela página):

```tsx
const { token, logout } = useAuth()
const { isAllowed } = useAdminGuard()
```

O `useEffect` de eventos (linhas 65–77) fica:

```tsx
useEffect(() => {
   // Só busca eventos admin quando a permissão está resolvida — não antes do redirect
   if (!isAllowed || !token) return

   async function fetchData() {
      try {
         const response = await getEventosAdmin(token)
         setEvents(response.eventos)
      } catch (error) {
         console.log(error)
      }
   }

   fetchData()
}, [reload, isAllowed, token])
```

O `useEffect` de categorias (linhas 79–91, endpoint público) ganha `isAllowed` só para evitar redundantidade durante o redirect; se o time preferir, também pode permanecer público — RECOMENDADO manter com gate:

```tsx
useEffect(() => {
   if (!isAllowed) return

   async function fetchData() {
      try {
         const response = await getCategorias()
         setCategorias(response)
      } catch (error) {
         console.log(error)
      }
   }

   fetchData()
}, [reload, isAllowed])
```

- [ ] **Step 3: Verificação**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

Manual: conta admin → `/admin` acessa; conta `organizador`/`participante` → redireciona para `/`; Network tab: sem chamadas a `/api/eventos?limit=1000` antes do `(loading=false, isAllowed=false)`.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "[fix] admin: guard por isAdmin do JWT e fetches admin gated por isAllowed"
```

---

### Task 4: Navbar + AdminDashboard — exibição e botão Painel pelo contexto

**Files:**
- Modify: `src/components/Navbar.tsx:20,70-77`
- Modify: `src/components/AdminDashboard.tsx:133`

**Interfaces:**
- Consumes: `isAdmin`, `userRole` (Task 2).

- [ ] **Step 1: Navbar**

Linha 20:

```tsx
const { isAuthenticated, user, userRole, isAdmin, logout } = useAuth()
```

Linhas 70–77:

```tsx
{isAuthenticated && user ? (
    <div className="flex items-center gap-2 sm:gap-3">
        <UserBadge nome={user.nome} fotoPerfil={user.fotoPerfil} papel={userRole ?? user.tipoUsuario} />
        {isAdmin && (
            <Button asChild variant="outline" className="cursor-pointer">
                <Link href="/admin">Painel</Link>
            </Button>
        )}
```

(`papel` decai para `user.tipoUsuario` se `userRole` estiver null — só acontece enquanto `loading`; `UserBadge` já lida com label padrão? Não — `papel` obrigatório; fallback String via `?? user.tipoUsuario` cobre.)

- [ ] **Step 2: AdminDashboard badge própria**

Linha 133 (badge do próprio usuário autenticado):

```tsx
<UserBadge nome={user.nome} fotoPerfil={user.fotoPerfil} papel={userRole ?? user.tipoUsuario} />
```

E na linha 67 deste arquivo (`if (!user) return <div>Não autenticado</div>`), nenhuma mudança: `user` ainda existe como perfil.

- [ ] **Step 3: Verificação**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

Manual: admin → badge "Administrador" + botão Painel; organizador → badge "Organizador" sem Painel; editar `authUser.tipoUsuario: 'admin'` no DevTools como organizador → botão Painel DESAPARECE (role agora vem do token).

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.tsx src/components/AdminDashboard.tsx
git commit -m "[fix] Navbar/AdminDashboard: botão Painel e badge próprios via isAdmin/userRole do JWT"
```

---

### Task 5: EventCard + EventDetails — permissões internas pelo contexto

**Files:**
- Modify: `src/components/EventCard.tsx:34,36,114,182,216`
- Modify: `src/components/EventDetails.tsx` (imports/useAuth destructuring + linhas 116,293)

**Interfaces:**
- Consumes: `isAdmin` (Task 2). Decisão: REMOVER a prop `isAdmin?: boolean` do EventCard — ninguém a passa hoje (grep confirmou) e a fonte da permissão passa a ser sempre o contexto; remover falha mais cedo se alguém tentar usá-la errado.

- [ ] **Step 1: EventCard**

Remover `isAdmin?: boolean` (linha 18), `isAdmin,` (linha 31) do destructuring.

Linha 34:

```tsx
const { isAuthenticated, user, logout, isAdmin } = useAuth()
```

(a prop removida acima é substituída, no destructuring, pelo `isAdmin` do contexto — não há mais conflito de nome)

Linha 36:

```tsx
const podeGerenciar = isAdmin || isOwner
```

Linha 114:

```tsx
{(user?.tipoUsuario === 'admin' || isOwner) && (
```
→
```tsx
{(isAdmin || isOwner) && (
```

Linhas 182 e 216 (`{isAdmin && (` / `{isOwner && !isAdmin && (`) seguem válidas: `isAdmin` agora vem do contexto via destructuring.

- [ ] **Step 2: EventDetails**

Localizar as 2 ocorrências de `user?.tipoUsuario === 'admin'` (linhas 116 e 293) e trocar por `isAdmin` do contexto — o destructuring de `useAuth` já presente no arquivo é estendido para incluir `isAdmin`:

```tsx
const { isAuthenticated, user, logout, isAdmin } = useAuth()
```

```tsx
{(isAdmin || isOwner) && (
```

- [ ] **Step 3: Verificação**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS. Se falhar em consumidor que passava `isAdmin` ao EventCard (nenhum hoje, grep `isAdmin={` vazio esperado — se um aparecer, remover o prop do JSX), corrigir o consumidor.

Manual: organizador em "Meus eventos" vê botões de gerenciar só nos próprios eventos; admin vê Aprovar/Editar também em eventos de terceiros.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventCard.tsx src/components/EventDetails.tsx
git commit -m "[fix] EventCard/EventDetails: permissões internas derivadas de isAdmin do JWT"
```

---

### Task 6: meus-eventos — `tokenId` como userId confiável

**Files:**
- Modify: `src/app/meus-eventos/page.tsx:47,68-72`

**Interfaces:**
- Consumes: `tokenId` (Task 2); `getMeusEventos(token, userId)` (data.ts, inalterado).

- [ ] **Step 1: Trocar a fonte de userId**

Linha 47:

```tsx
const { token, user, isAuthenticated, loading, tokenId } = useAuth()
```

Linhas 68–72:

```tsx
const { data: eventos, error, isLoading, refetch } = useQuery({
   queryKey: ['meus-eventos', tokenId],
   queryFn: () => getMeusEventos(token!, tokenId !== null ? tokenId : user!.id),
   enabled: isAuthenticated && ((tokenId !== null) || !!user),
})
```

(`tokenId ?? user?.id` como fallback — o claim `id` é confiável; `user.id` do localStorage serve de fallback se o backend emitir token sem `id`)

Percorrer o restante do arquivo por `user` para dependência de permissão nenhuma; há `isOwner` calculado? Checar `organizadorId === user.id` — substituir ocorrências equivalentes por `(tokenId ?? user?.id)`. (Verificação: há `isOwner` calculado? precisa varredura.)

- [ ] **Step 2: Verificação**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

Manual: login organizador → "Meus eventos" lista só os do próprio organizador (comportamento atual preservado, muda apenas a fonte do userId).

- [ ] **Step 3: Commit**

```bash
git add src/app/meus-eventos/page.tsx
git commit -m "[fix] meus-eventos: userId do claim id do JWT com fallback ao perfil"
```

---

### Task 7: TODO.md + verificação final

**Files:**
- Modify: `TODO.md:54,85`

- [ ] **Step 1: Atualizar TODO.md**

Linha 54 → `[x]` com nota:

```
[x] 🖥️ Autorização do admin não depende mais de authUser do localStorage: role vem do claim `tipo` do JWT (AuthContext: userRole/isAdmin; jwt.ts: obterClaims, fail-closed). Pendência backend correlata: reemitir token ao mudar tipo de usuário (promote exige re-login)
```

Linha 85 → `[x]` "admin/page.tsx: useAdminGuard gating dos fetches por isAllowed; token nos deps".

Linha 48 (`[ ] 🖥️ Confirmar com backend: toda rota admin recusa não-admins…`) permanece — não é escopo destas changes.

- [ ] **Step 2: Verificação global**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS ambos

Run: `npm run build`
Expected: build conclui sem erros

- [ ] **Step 3: Commit final**

```bash
git add TODO.md
git commit -m "[fix] TODO: autorização via claims concluída; gate de fetch do painel concluído"
```

---

## Verificação guiada (pós-execução, navegador)

1. `npm run dev`, login admin → `/admin` ok; DevTools: alterar `authUser.tipoUsuario` para `'participante'` → **Painel continua acessível** (role do JWT), badge pode ficar falso (é perfil — documentado como aceito).
2. Login organizador → `/admin` → redirect `/`; editar `authUser.tipoUsuario: 'admin'` → **nenhum efeito** (sem botão Painel, `/admin` redireciona).
3. Manipular `authToken` no DevTools para string sem formato JWT → reload → sessão deslogada.
4. Manipular payload para `{"tipo":"participante","exp":}` simulado (sem `exp` válido ou com expirado) → deslogado no restore; com `{"tipo":"admin","exp":futuro}` trocado pelo token de um participante real → `/admin` redireciona (o par token↔role é inseparável agora).
5. `payload {"tipo":"participante","exp":alto}` + login admin real com token trocado pelo do participante → `/admin` redireciona (role corrupta do token vence sobre o body).
