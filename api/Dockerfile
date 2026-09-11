FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=development

# Prisma requires OpenSSL at generation/runtime. Keep build and runtime
# on the same Debian/OpenSSL family so the native engine matches.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install deterministically from lockfile.
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# The committed lockfile currently contains mixed Nest runtime patches:
# @nestjs/common=11.1.28 while core/platform-express=11.2.3.
# Nest core 11.2.3 imports files added in common 11.2.x, so normalize the
# runtime framework trio to one exact patch without rewriting the lockfile
# inside the image.
RUN npm install --no-save --package-lock=false --ignore-scripts \
      @nestjs/common@11.2.3 \
      @nestjs/core@11.2.3 \
      @nestjs/platform-express@11.2.3 \
    && node -e "const names=['common','core','platform-express']; const versions=Object.fromEntries(names.map((name)=>[name,require('./node_modules/@nestjs/'+name+'/package.json').version])); if(Object.values(versions).some((version)=>version!=='11.2.3')) throw new Error('Nest runtime version mismatch: '+JSON.stringify(versions)); console.log('Nest runtime aligned:', versions);"

# Copy application source.
COPY . .

# Generate Prisma Client and compile Nest.
RUN npx prisma generate
RUN npm run build


# ============================================================
# Production runtime
# ============================================================

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Prisma's native query engine requires OpenSSL in the runtime image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Only package metadata first.
COPY package.json package-lock.json ./

# `postinstall` currently calls `prisma generate`.
# Prisma CLI is intentionally a dev dependency, so remove that lifecycle
# script only inside the runtime image. --omit=peer also prevents Prisma's
# optional CLI peer from being pulled into production.
RUN npm pkg delete scripts.postinstall \
    && npm ci --omit=dev --omit=peer \
    && npm install --no-save --package-lock=false --ignore-scripts --omit=dev --omit=peer \
      @nestjs/common@11.2.3 \
      @nestjs/core@11.2.3 \
      @nestjs/platform-express@11.2.3 \
    && node -e "const names=['common','core','platform-express']; const versions=Object.fromEntries(names.map((name)=>[name,require('./node_modules/@nestjs/'+name+'/package.json').version])); if(Object.values(versions).some((version)=>version!=='11.2.3')) throw new Error('Nest runtime version mismatch: '+JSON.stringify(versions)); console.log('Nest runtime aligned:', versions);" \
    && npm cache clean --force

# Compiled Nest application.
COPY --from=builder /app/dist ./dist

# Prisma Client generated in the builder stage.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Drop root privileges.
RUN chown -R node:node /app

USER node

# Cloud Run defaults to 8080 and injects PORT at runtime.
EXPOSE 8080

CMD ["node", "dist/main.js"]
