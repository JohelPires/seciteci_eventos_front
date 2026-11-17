# syntax=docker/dockerfile:1
# Imagem do CONECTE-SE (front Next) para a VM da SECITECI — convenção de
# fic_dev/secitec-servidor (padrão do apps/admin/Dockerfile do
# portal-inovacao-web, servido por `next start`).
#
#   docker build -f Dockerfile \
#     --build-arg APP_CAMINHO=/dev/secitec/conectese \
#     --secret id=app_env,src=<arquivo .env do ambiente> -t secitec/conectese .
#
# - APP_CAMINHO (build arg): o prefixo do endereço → o build espera na raiz
#   da imagem `NEXT_PUBLIC_BASE_PATH`, o `basePath` do Next (endereço POR
#   CAMINHO; trocar de endereço = re-buildar).
# - NEXT_PUBLIC_API_URL (build arg): a URL da API, inlinada no bundle no
#   build. O pipeline da VM NÃO passa esse build arg (vem do segredo
#   `app_env` abaixo, que sobrescreve); quem passa é o EasyPanel, que injeta
#   as envs do serviço como build args.
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID (build arg): idem — o Client ID do login
#   Google, inlinado no bundle (o valor é público; entra pelo mesmo
#   mecanismo da API_URL).
# - app_env (segredo do BuildKit): o build precisa das `NEXT_PUBLIC_*`
#   (vão inlinadas no bundle). Lida só durante os RUNs; não fica na imagem
#   final (o runner não copia o arquivo materializado).
#
#   ARMADILHA DE CACHE (já mordeu o RISC): `RUN --mount=type=secret` NÃO
#   invalida o cache quando o CONTEÚDO do segredo muda — a chave da camada
#   é só o comando + camadas-pai, nunca o arquivo. Mudar a env e re-runar
#   o job re-publica o bundle ANTIGO. A env nova só entra no bundle quando
#   algo do contexto muda junto (código, Dockerfile) — a cadência normal
#   (feature + env no mesmo push). Se precisar inlinar sem mudar código:
#   mudar uma linha DESTE RUN, ou `docker builder prune` na VM.
#
#   Para o EasyPanel (que passa as envs como BUILD ARGS), os ARGs são
#   referenciados no comando do build: valor novo de build arg = cache miss.

FROM node:20-alpine AS build
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Copiar manifestos primeiro (aproveita o cache de dependências).
COPY package.json package-lock.json ./
RUN npm ci

# Copiar o restante do projeto e gerar o build de produção.
COPY . .
ARG APP_CAMINHO=
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
# 1) Materializa o segredo num arquivo (debugável com `cat`; mantém o
#    conteúdo do app_env fora do comando/camada final).
RUN --mount=type=secret,id=app_env,required=false \
    if [ -f /run/secrets/app_env ]; then cp /run/secrets/app_env .ambiente.build; else : > .ambiente.build; fi
# 2) Consome o arquivo materializado e builda. Os ARGs explícitos no comando
#    fazem o cache reagir a build args (EasyPanel).
RUN set -a && \
    . ./.ambiente.build && \
    set +a && \
    NEXT_PUBLIC_BASE_PATH="${APP_CAMINHO}" \
    NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID="${NEXT_PUBLIC_GOOGLE_CLIENT_ID}" \
    npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# APP_CAMINHO em runtime é só para o HEALTHCHECK sob o prefixo.
ARG APP_CAMINHO=
ENV APP_CAMINHO=${APP_CAMINHO}

# Apenas as dependências de produção.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs

# Endurecimento (incidente de 16/11): o invasor explorou o contêiner rodando
# como root (instalou pacotes, cron, trocou /etc/shadow). O `node:alpine` já
# traz o usuário `node` (uid 1000). Só o cache do `next start` (otimizador de
# next/image etc.) precisa ser gravável por ele.
RUN mkdir -p /app/.next/cache && chown -R node:node /app/.next
USER node

EXPOSE 3000

# A rota de saúde fica SOB o basePath (o Next só atende dentro dele):
# src/app/saude/route.ts, usada também pelo healthcheck do compose.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
   CMD wget -qO- "http://127.0.0.1:${PORT}${APP_CAMINHO}/saude" >/dev/null || exit 1

# Servir a aplicação. Direto pelo binário do next (npm como PID 1 deixa um
# processo pai que não repassa sinais e é mais um alvo/atração de fork).
CMD ["node", "node_modules/next/dist/bin/next", "start"]
