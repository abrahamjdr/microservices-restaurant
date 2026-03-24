# ── Stage 1: build @restaurant/shared-types ───────────────────────────────────
FROM node:20-alpine AS shared-types-builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json   ./packages/shared-types/
COPY packages/shared-types/tsconfig.json  ./packages/shared-types/
COPY packages/shared-types/src            ./packages/shared-types/src
WORKDIR /app/packages/shared-types
RUN npm install && npm run build

# ── Stage 2: build warehouse-service ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app/services/warehouse-service
COPY services/warehouse-service/package.json ./
RUN npm install
# Inject shared-types as a real directory (no workspace symlink needed)
COPY --from=shared-types-builder /app/packages/shared-types/package.json ./node_modules/@restaurant/shared-types/
COPY --from=shared-types-builder /app/packages/shared-types/dist          ./node_modules/@restaurant/shared-types/dist
COPY services/warehouse-service/prisma ./prisma
RUN npx prisma generate
COPY services/warehouse-service/tsconfig.json ./
COPY services/warehouse-service/src           ./src
RUN npm run build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/services/warehouse-service/package.json ./
COPY --from=builder /app/services/warehouse-service/node_modules ./node_modules
COPY --from=builder /app/services/warehouse-service/dist         ./dist
COPY --from=builder /app/services/warehouse-service/prisma       ./prisma
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main.js"]
