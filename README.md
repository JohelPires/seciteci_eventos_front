# Conecte-se — front (gestao-eventos-web)

Agenda estadual de Ciência, Tecnologia e Inovação de Mato Grosso (SECITECI):
front Next.js que consome a API própria e roda na VM da SECITECI pela
convenção de [`fic_dev/secitec-servidor`](https://gitlab.risc.unemat.br/fic_dev/secitec-servidor).

## Stack

Next.js 15 (App Router, Turbopack), React 19, TypeScript strict, Tailwind v4,
shadcn/ui, TanStack Query, Leaflet.

## Rodar localmente

```bash
cp .env.example .env.local   # ajuste NEXT_PUBLIC_API_URL (padrão: localhost:3030)
npm install
npm run dev
```

## Deploy na VM da SECITECI

| Assunto | Valor |
| --- | --- |
| Produção | **https://apps.risc.unemat.br/dev/secitec/conectese** |
| API | `https://apps.risc.unemat.br/dev/secitec/conectese-api` |
| Branch | só `main` (protegida) |
| Publicação | **automática a cada merge na `main`** (sem botão) |
| Runner | `secitec-vps` (shell, na VM, concurrent=1 — builds ficam em fila) |

Como funciona (detalhes no README do `fic_dev/secitec-servidor`):

- O endereço é por **CAMINHO**. O Traefik da VM NÃO retira o prefixo (sem
  `stripprefix`) e o app é buildado com `basePath` =
  `NEXT_PUBLIC_BASE_PATH` — o template de CI passa o caminho no build
  (`--build-arg APP_CAMINHO`). Trocar de endereço = re-buildar.
- O template (`.gitlab-ci.yml` inclui `gitlab/deploy.gitlab-ci.yml` de
  `fic_dev/secitec-servidor`, com `APP: conectese`) builda a imagem com o
  segredo BuildKit `id=app_env`, copia o `compose.yml` e escreve o `.env`
  em `/opt/apps/conectese/prod/`; o `docker compose up --wait` espera a
  rota de saúde `${APP_CAMINHO}/saude` ficar saudável.
- O `APP_ENV` (GitLab > Settings > CI/CD > Variables, tipo **File**,
  escopo `producao`, Protected) carrega:

  ```
  NEXT_PUBLIC_API_URL=https://apps.risc.unemat.br/dev/secitec/conectese-api
  NODE_ENV=production
  ```

- O `basePath` cobre `<Link>`, `router.push/replace` e `redirect()`, mas
  NÃO prefixa `src` cru de imagem, `window.location` nem ícones de
  `metadata` — use `comBase()` (`src/lib/caminho-base.ts`).
- O Next lê o `basePath` do `next.config.mjs` TAMBÉM no runtime
  (`next start`), não só no build: o `compose.yml` exporta
  `NEXT_PUBLIC_BASE_PATH=${APP_CAMINHO}` no container (o pipeline só
  fornece `APP_CAMINHO`). Sem isso o app sobe na raiz e 404a sob o
  prefixo — o healthcheck falha e o deploy não sobe.
- Rota de saúde: `src/app/saude/route.ts` (200 sem depender da API).
- Sem banco no compose: o front só fala com a API.
- Rollback: re-run da pipeline de um commit anterior.

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
