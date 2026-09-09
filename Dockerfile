FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE=https://api.prayinverses.com/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build


# ============================================================
# Production runtime
# ============================================================

FROM nginxinc/nginx-unprivileged:alpine

COPY --from=builder --chown=nginx:nginx \
  /app/dist \
  /usr/share/nginx/html

COPY --chown=nginx:nginx \
  nginx.conf \
  /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]