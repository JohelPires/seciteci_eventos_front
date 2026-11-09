# Conecte-se — front (gestao-eventos-web)

Agenda estadual de Ciência, Tecnologia e Inovação de Mato Grosso (SECITECI):
front Next.js que consome a API própria e roda nas VMs da SECITECI pela
convenção de [`fic_dev/secitec-servidor`](https://gitlab.risc.unemat.br/fic_dev/secitec-servidor)
(`dev` → RISC; `main` → VM do Conecte-se).

## Stack

Next.js 15 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4,
shadcn/ui, TanStack Query, Leaflet.

## Rodar localmente

```bash
cp .env.example .env.local   # ajuste NEXT_PUBLIC_API_URL (padrão: localhost:3030)
npm install
npm run dev
```

## Deploy nas VMs da SECITECI (duas produções)

| Ambiente | Branch | URL | API | Runner | Environment (GitLab) |
| --- | --- | --- | --- | --- | --- |
| RISC | `dev` | **https://apps.risc.unemat.br/dev/secitec/conectese** | `https://apps.risc.unemat.br/dev/secitec/conectese-api` | `secitec-vps` (grupo) | `producao` |
| Conecte-se (SECITEC-29949) | `main` | **https://conectese.secitec.mt.gov.br** | same-origin `…/api` | `conectese-prod` (runner 119) | `conectese-web` |

Como funciona (detalhes no README do `fic_dev/secitec-servidor`):

- **As duas publicações são automáticas**: `publicar:risc` dispara a cada
  push/merge na `dev`; `publicar:producao:conectese` a cada merge na `main`.
  O job manual `publicar:producao` do template continua disponível na
  pipeline da `main` (publicação de emergência do RISC por commit).

### VM do RISC (branch `dev`)

- Job `publicar:risc` (`.gitlab-ci.yml`), corpo do template
  (`.publicar-na-vm` + `.ambiente:producao`): builda com
  `--build-arg APP_CAMINHO=/dev/secitec/conectese`, copia o `compose.yml`
  da raiz e escreve o `.env` em `/opt/apps/conectese/prod/`; o
  `docker compose up --wait` espera a rota de saúde `${APP_CAMINHO}/saude`.
- A `APP_ENV` usada é a variável de escopo `*` (GitLab > Settings > CI/CD >
  Variables, tipo **File**, Protected), que aponta para a API do RISC:

  ```
  NEXT_PUBLIC_API_URL=https://apps.risc.unemat.br/dev/secitec/conectese-api
  NODE_ENV=production
  ```

- A URL da API vai INLINADA no bundle no build (segredo BuildKit
  `id=app_env`).

### VM do Conecte-se (SECITEC-29949; branch `main`)

- Job `publicar:producao:conectese` (`.gitlab-ci.yml`), runner de projeto
  `conectese-prod` (119, da API): builda a imagem com `basePath` vazio
  (`--build-arg APP_CAMINHO=`) e **API same-origin**
  (`https://conectese.secitec.mt.gov.br` — o código acrescenta `/api`),
  e troca o container `conectese.frontend` via
  `docker compose -p seciteci_eventos_front -f deploy/conectese/compose.yml`.
- O compose de lá (mesmos labels do Traefik: router `conectese-frontend`,
  `Host(conectese.secitec.mt.gov.br)`, `websecure` + `leresolver`,
  serviço na porta 3000) está em `deploy/conectese/compose.yml`; o
  container antigo (compose manual em `/home/conectese`) é substituído sem
  escrever nessa pasta.
- A `APP_ENV` usada é a variável de escopo **`conectese-web`** (File,
  Protected), criada para isolar a VM:

  ```
  NEXT_PUBLIC_API_URL=https://conectese.secitec.mt.gov.br
  NODE_ENV=production
  ```

- Também aqui a URL da API é INLINADA no build; o container não recebe
  `NEXT_PUBLIC_API_URL` em runtime.

### Regras comuns às duas VMs

- As branches `main` e `dev` são **protegidas** (os dois runners são
  `ref_protected` e só rodam em ref protegida); sem force-push.
- O `basePath` cobre `<Link>`, `router.push/replace` e `redirect()`, mas
  NÃO prefixa `src` cru de imagem, `window.location` nem ícones de
  `metadata` — use `comBase()` (`src/lib/caminho-base.ts`).
- O Next lê o `basePath` do `next.config.mjs` TAMBÉM no runtime
  (`next start`), não só no build: o `compose.yml` (RISC) exporta
  `NEXT_PUBLIC_BASE_PATH=${APP_CAMINHO}` no container; na VM do Conecte-se
  ele fica vazio (app na raiz).
- Rota de saúde: `src/app/saude/route.ts` (200 sem depender da API).
- Sem banco no compose: o front só fala com a API.
- Rollback: re-run da pipeline de um commit anterior da própria branch
  (a imagem é tagueada com o SHA).

### Validar o build com prefixo (como o pipeline faz)

```bash
NEXT_PUBLIC_BASE_PATH=/dev/secitec/conectese \
NEXT_PUBLIC_API_URL=https://apps.risc.unemat.br/dev/secitec/conectese-api \
npm run build
npm start
# conferir http://localhost:3000/dev/secitec/conectese/ e .../saude
```

No dev local `NEXT_PUBLIC_BASE_PATH` fica vazio (app na raiz).

## Deploy no EasyPanel (ambiente de testes/staging)

| Assunto | Valor |
| --- | --- |
| Front | `https://seciteci-seciteci-eventos-front.qmono1.easypanel.host` |
| API | `https://seciteci-seciteci-eventos.qmono1.easypanel.host` |

Como funciona:

- O EasyPanel builda o `Dockerfile` do repositório e injeta as envs do
  serviço como **build args** (a doc deles: "passes project and service
  environment values, including GIT_SHA, as build arguments"). Por isso o
  `Dockerfile` declara `ARG NEXT_PUBLIC_API_URL` (além de `APP_CAMINHO`):
  sem o `ARG`, o valor não chega ao `npm run build` e o bundle sai SEM a
  URL da API — o front carrega, mas as chamadas viram
  `/undefined/api/...` (404 no próprio host) e nada acessa a API/banco.
- No serviço do front, defina a env de build (e use **Force Rebuild**
  depois de mudá-la — o valor é baked no bundle):

  ```
  NEXT_PUBLIC_API_URL=https://seciteci-seciteci-eventos.qmono1.easypanel.host
  ```

- `NEXT_PUBLIC_API_URL` fica vazia no build da VM (o pipeline não passa
  esse build arg; lá o valor vem do segredo `app_env`, que sobrescreve o
  ARG) — mudar aqui não afeta a produção da VM.
- Sem `basePath` nesse ambiente: o app responde na raiz.
- Se o CORS da API não permitir o domínio do front, configure o
  `CORS_ORIGINS`/equivalente no serviço da API.
- Diagnóstico rápido quando "o front carrega mas não pega dados":
  - `curl https://.../saude` → 200 (front no ar);
  - conferir o CSP do front: sem a origem da API em `connect-src`,
    `NEXT_PUBLIC_API_URL` não existiu no build;
  - `curl https://...front.../api/eventos` → 404 confirma bundle sem URL
    (a API não é servida pelo host do front).

## Comandos

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint`; e `npx tsc --noEmit` antes de commit (sem script de
  typecheck no projeto).

## Convenções

- Commits com prefixo `[feat]`, `[fix]`, `[style]` etc.; código e
  comentários em português. Pendências em `TODO.md`. Detalhes para agentes
  em `AGENTS.md`.
