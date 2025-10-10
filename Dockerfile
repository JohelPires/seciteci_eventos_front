# Etapa 1: Build da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependências primeiro (para aproveitar cache)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do projeto
COPY . .

# Gerar build de produção
RUN npm run build

# Etapa 2: Servir a aplicação
FROM node:20-alpine AS runner

WORKDIR /app

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Copiar apenas o necessário do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Instalar apenas dependências de produção
RUN npm install --omit=dev

# Expor a porta padrão do Next.js
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "run", "start"]
