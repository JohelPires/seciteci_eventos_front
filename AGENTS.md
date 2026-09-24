# AGENTS.md

## Stack
Next.js 15 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4, shadcn/ui (new-york), TanStack Query, Leaflet.

## Comandos
- `npm run dev` — dev server (Turbopack)
- `npm run build` — build de produção (Turbopack)
- `npm run lint` — ESLint (config: next/core-web-vitals + next/typescript)
- Não há script de typecheck nem testes no projeto. Rode `npx tsc --noEmit` antes de commit.

## Backend / API
- API externa via `NEXT_PUBLIC_API_URL` (arquivo `.env.local`, obrigatório).
- Todas as chamadas ficam em `src/data/data.ts`; requisições autenticadas usam `Bearer` do token.
- Auth: `src/context/AuthContext.tsx` persiste `authToken` e `authUser` no localStorage; tipo do usuário: `admin | client | professional`.

## Estrutura
- App de praticamente 2 páginas: `src/app/page.tsx` (público) e `src/app/admin/page.tsx` (painel).
- Alias `@/*` → `./src/*` (ex.: `@/components` = `src/components`).
- Componentes shadcn em `src/components/ui`; `components.json` aponta tokens para `src/app/globals.css`.

## Armadilhas
- `src/components/EventForm2.tsx.backup` e `src/components/ui/*.tsx.del` são arquivos mortos — não edite; o form vivo é `EventForm.tsx`.
- `origin` aponta para GitLab (com segundo push URL no GitHub).

## Convenções
- Commits: prefixo `[feat]`, `[fix]`, `[style]` etc.; código e comentários em português.
- Pendências em `TODO.md`; `src/guidelines/Guidelines.md` é template vazio.
