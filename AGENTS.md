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
- `.gitignore` ignora `Dockerfile` e `docker-compose.yml`, mas o `Dockerfile` já é rastreado (edite normalmente). Os composes de publicação são dois: `compose.yml` (raiz — VM do RISC) e `deploy/conectese/compose.yml` (VM do Conecte-se).

## Deploy (duas VMs da SECITECI)
- Convenção de `fic_dev/secitec-servidor`; **as duas publicações são automáticas** (sem botão — os runners são `ref_protected`, então `main` e `dev` devem estar protegidas).
- **`dev` → VM do RISC**: job `publicar:risc` (template + `.ambiente:producao`); **https://apps.risc.unemat.br/dev/secitec/conectese** — API em `.../conectese-api`. Runner `secitec-vps` (shell, na VM, concurrent=1: builds em fila). Endereço por CAMINHO: Traefik NÃO retira o prefixo, build com `basePath`=`APP_CAMINHO` (`--build-arg APP_CAMINHO`). Compose usado: `compose.yml` da raiz; `.env` em `/opt/apps/conectese/prod/`.
- **`main` → VM do Conecte-se (SECITEC-29949)**: job `publicar:producao:conectese`; **https://conectese.secitec.mt.gov.br** (front na raiz, `APP_CAMINHO=` vazio; API same-origin em `/api`). Runner 119 `conectese-prod` (project runner da API, habilitado no 689). Troca o container `conectese.frontend` via `docker compose -p seciteci_eventos_front -f deploy/conectese/compose.yml` (mesmos labels do Traefik; compose antigo manual em `/home/conectese` fica como rollback e NÃO é escrito).
- `APP_ENV` por escopo (GitLab > Settings > CI/CD > Variables, tipo **File**, Protected): escopo `*` = RISC (`NEXT_PUBLIC_API_URL=https://apps.risc.unemat.br/dev/secitec/conectese-api`); escopo `conectese-web` = Conecte-se (`NEXT_PUBLIC_API_URL=https://conectese.secitec.mt.gov.br`). Ambas carregam `NODE_ENV=production` e entram no build como segredo BuildKit (`id=app_env`) — a URL da API é inlinada NO BUILD, nunca em runtime.
- O job manual `publicar:producao` do template continua na pipeline da `main` (emergência RISC).
- Rota de saúde: `src/app/saude/route.ts` (`/saude` sob o basePath do ambiente; 200 sem depender da API). Rollback = re-run da pipeline de um commit anterior da própria branch.
- Dev local: `NEXT_PUBLIC_BASE_PATH` vazio (app na raiz); siga `.env.example`.
- Referência a asset de `public/` deve usar `comBase()` (`src/lib/caminho-base.ts`) — o `basePath` não prefixa `src`/`href` crus nem `window.location`.

## Convenções
- Commits: prefixo `[feat]`, `[fix]`, `[style]` etc.; código e comentários em português.
- Pendências em `TODO.md`; `src/guidelines/Guidelines.md` é template vazio.

## Deploy (EasyPanel — testes/staging)
- Front: `seciteci-seciteci-eventos-front.qmono1.easypanel.host`; API: `seciteci-seciteci-eventos.qmono1.easypanel.host` (mesma API/DB). O contrato OpenAPI da API fica em `<NEXT_PUBLIC_API_URL>/api-docs.json`.
- `NEXT_PUBLIC_API_URL` é inlinada NO BUILD. O Dockerfile declara `ARG NEXT_PUBLIC_API_URL` (o EasyPanel injeta as envs do serviço como build args; sem o `ARG` o bundle sai sem a URL e as chamadas viram `.../undefined/api/...` — 404 no próprio host).
- Mudar a URL lá = definir a env no serviço e **Force Rebuild** (valor baked no bundle).
- Diagnóstico de "front carrega mas sem dados": CSP do front sem a origem da API em `connect-src` ⇒ a var não existiu no build.
