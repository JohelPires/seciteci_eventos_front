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
- `.gitignore` ignora `Dockerfile` e `docker-compose.yml`, mas o `Dockerfile` já é rastreado (edite normalmente) e o compose de publicação é o `compose.yml` (não `docker-compose.yml`).

## Deploy (VM da SECITECI)
- Convenção de `fic_dev/secitec-servidor`; exemplo de front com caminho base: `fic_dev/portal-da-inovacao/portal-inovacao-web/deploy/secitec/`.
- Produção: **https://apps.risc.unemat.br/dev/secitec/conectese** — API em `.../conectese-api`.
- Endereço é por CAMINHO: O Traefik NÃO retira o prefixo (sem `stripprefix`) e o app é buildado com `basePath`=`NEXT_PUBLIC_BASE_PATH` (o pipeline passa `--build-arg APP_CAMINHO`). Trocar de endereço = re-buildar.
- `.gitlab-ci.yml` inclui o template de publicação com `APP: conectese`; **deploy AUTOMÁTICO a cada merge na `main`** (sem botão — sobrescrevemos o `when: manual` do template). Runner do grupo `secitec-vps` (shell, na VM, concurrent=1): builds ficam em fila.
- `APP_ENV` (GitLab > Settings > CI/CD > Variables, tipo **File**, escopo `producao`, Protected) carrega `NEXT_PUBLIC_API_URL` + `NODE_ENV=production`; entra no build como segredo BuildKit (`id=app_env`) e vira o `.env` do container.
- Só produção (branch `main`). Sem banco no compose: o front só fala com a API. Rollback = re-run da pipeline de um commit anterior.
- Dev local: `NEXT_PUBLIC_BASE_PATH` vazio (app na raiz); siga `.env.example`.
- Referência a asset de `public/` deve usar `comBase()` (`src/lib/caminho-base.ts`) — o `basePath` não prefixa `src`/`href` crus nem `window.location`.

## Convenções
- Commits: prefixo `[feat]`, `[fix]`, `[style]` etc.; código e comentários em português.
- Pendências em `TODO.md`; `src/guidelines/Guidelines.md` é template vazio.

## Deploy (EasyPanel — testes/staging)
- Front: `seciteci-seciteci-eventos-front.qmono1.easypanel.host`; API: `seciteci-seciteci-eventos.qmono1.easypanel.host` (mesma API/DB).
- `NEXT_PUBLIC_API_URL` é inlinada NO BUILD. O Dockerfile declara `ARG NEXT_PUBLIC_API_URL` (o EasyPanel injeta as envs do serviço como build args; sem o `ARG` o bundle sai sem a URL e as chamadas viram `.../undefined/api/...` — 404 no próprio host).
- Mudar a URL lá = definir a env no serviço e **Force Rebuild** (valor baked no bundle).
- Diagnóstico de "front carrega mas sem dados": CSP do front sem a origem da API em `connect-src` ⇒ a var não existiu no build.
