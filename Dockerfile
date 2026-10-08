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
# - app_env (segredo do BuildKit): o build precisa das `NEXT_PUBLIC_*`
#   (vão inlinadas no bundle). Lida só durante o RUN do build; não fica em
#   camada da imagem.

FROM node:20-alpine AS build
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Copiar manifestos primeiro (aproveita o cache de dependências).
COPY package.json package-lock.json ./
RUN npm ci

# Copiar o restante do projeto e gerar o build de produção.
COPY . .
ARG APP_CAMINHO=
RUN --mount=type=secret,id=app_env,required=false \
    set -a && \
    if [ -f /run/secrets/app_env ]; then . /run/secrets/app_env; fi && \
    set +a && \
    NEXT_PUBLIC_BASE_PATH="${APP_CAMINHO}" npm run build

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

EXPOSE 3000

# A rota de saúde fica SOB o basePath (o Next só atende dentro dele):
# src/app/saude/route.ts, usada também pelo healthcheck do compose.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
   CMD wget -qO- "http://127.0.0.1:${PORT}${APP_CAMINHO}/saude" >/dev/null || exit 1

# Servir a aplicação
CMD ["npm", "run", "start"]
