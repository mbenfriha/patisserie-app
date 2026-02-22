# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

WORKDIR /app

# Workspace root files for pnpm resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

# Install all deps (dev included for TS compilation)
RUN pnpm install --frozen-lockfile --filter=api...

# Copy API source
COPY apps/api/ apps/api/

# Compile TypeScript → build/
WORKDIR /app/apps/api
RUN node ace build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

WORKDIR /app

# Workspace root files for lockfile resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

# Production deps only
RUN pnpm install --frozen-lockfile --prod --filter=api...

# Copy compiled JS from build stage
COPY --from=builder /app/apps/api/build/ apps/api/

# Non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

WORKDIR /app/apps/api
EXPOSE 3333

CMD ["node", "bin/server.js"]
