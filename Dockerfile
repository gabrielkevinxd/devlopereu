# syntax=docker/dockerfile:1
# --- build: site estático pré-renderizado ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime: Apache + PHP (o agente vive em /api/agent.php) ---
FROM php:8.3-apache
RUN a2enmod rewrite headers expires deflate mime env setenvif remoteip \
 && printf '%s\n' \
    'ServerName localhost' \
    'RemoteIPHeader X-Forwarded-For' \
    'RemoteIPInternalProxy 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16' \
    '<Directory /var/www/html>' \
    '    AllowOverride All' \
    '</Directory>' > /etc/apache2/conf-available/devlopereu.conf \
 && a2enconf devlopereu \
 && mkdir -p /data && chown www-data:www-data /data
COPY --from=build /app/dist/ /var/www/html/
ENV AGENT_DATA_DIR=/data
EXPOSE 80
# Sem proxy à frente, o .htaccess redirecionaria para HTTPS: o healthcheck simula o Traefik.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS -H 'X-Forwarded-Proto: https' http://localhost/ >/dev/null || exit 1
