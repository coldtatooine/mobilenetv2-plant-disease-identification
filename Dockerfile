# Dockerfile para Plant Disease Detection PWA
# Multi-stage build para otimização de tamanho e segurança

# ========================================
# STAGE 1: Preparação
# ========================================
FROM node:20-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Configurar npm para melhor performance
RUN npm config set cache /tmp/npm-cache && \
    npm config set audit false && \
    npm config set fund false && \
    npm config set update-notifier false

# Copiar arquivos de dependências primeiro (cache do Docker)
COPY package*.json ./

# Instalar dependências
RUN if [ -f package-lock.json ]; then \
        echo "Usando package-lock.json..." && \
        npm ci --production=false --no-audit --no-fund; \
    else \
        echo "package-lock.json não encontrado, usando npm install..." && \
        npm install --production=false --no-audit --no-fund; \
    fi

# Copiar arquivos da aplicação
COPY public ./public

# ========================================
# STAGE 2: Production Stage
# ========================================
FROM nginx:alpine AS production

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar arquivos estáticos
COPY --from=builder /app/public /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Criar usuário não-root para nginx
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# Configurar permissões
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Usar usuário não-root
USER nginx-user

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]

