FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

# Install deterministically from lockfile
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy application source
COPY . .

# Generate Prisma Client and compile Nest
RUN npx prisma generate
RUN npm run build


# ============================================================
# Production runtime
# ============================================================

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Only package metadata first
COPY package.json package-lock.json ./

# `postinstall` currently calls `prisma generate`.
# Prisma CLI is intentionally a dev dependency, so remove that
# lifecycle script only inside the runtime image.
#
# --omit=peer also prevents Prisma's optional CLI peer from being
# pulled into the production image.
RUN npm pkg delete scripts.postinstall \
    && npm ci --omit=dev --omit=peer \
    && npm cache clean --force

# Compiled Nest application
COPY --from=builder /app/dist ./dist

# Prisma Client generated in the builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Drop root privileges
RUN chown -R node:node /app

USER node

EXPOSE 4000

CMD ["node", "dist/main.js"]