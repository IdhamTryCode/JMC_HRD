# --- deps (install semua deps + compile native addons) ---
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++
COPY package.json package-lock.json* ./
RUN npm ci

# --- builder ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- prod-deps (runtime-only, dengan native addons) ---
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# --- runner (Next.js standalone) ---
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# native addons (argon2, pg, ioredis, sharp) butuh node_modules di samping server.js
# standalone hanya menyertakan pure-JS deps, native addons harus di-copy manual
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# pdfkit font data — tidak ter-trace oleh NFT, harus di-copy manual
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules/pdfkit/js/data ./.next/server/chunks/data

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# --- worker ---
FROM node:20-alpine AS worker
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl python3 make g++
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json knexfile.ts ./
COPY src ./src
COPY db ./db
CMD ["node_modules/.bin/tsx", "src/workers/index.ts"]
