# ── Stage 1: build @restaurant/shared-types ───────────────────────────────────
FROM node:20-alpine AS shared-types-builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared-types/package.json   ./packages/shared-types/
COPY packages/shared-types/tsconfig.json  ./packages/shared-types/
COPY packages/shared-types/src            ./packages/shared-types/src
WORKDIR /app/packages/shared-types
RUN npm install && npm run build

# ── Stage 2: build api-gateway ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app/services/api-gateway
COPY services/api-gateway/package.json ./
RUN npm install
# Inject shared-types as a real directory (no workspace symlink needed)
COPY --from=shared-types-builder /app/packages/shared-types/package.json ./node_modules/@restaurant/shared-types/
COPY --from=shared-types-builder /app/packages/shared-types/dist          ./node_modules/@restaurant/shared-types/dist
COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/src           ./src
RUN npm run build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/services/api-gateway/package.json ./
COPY --from=builder /app/services/api-gateway/node_modules ./node_modules
COPY --from=builder /app/services/api-gateway/dist         ./dist
CMD ["node", "dist/main.js"]
