ARG NODE_VERSION=22
ARG APP_DIRNAME=web
ARG PROJECT=web

# 1. Alpine image
FROM node:${NODE_VERSION}-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

# Setup pnpm and turbo on the alpine base
FROM alpine AS base
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
RUN npm install turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

# 2. Prune projects
FROM base AS pruner
ARG PROJECT

WORKDIR /app

# Copy the entire monorepo
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STORAGE_URL
ENV NEXT_PUBLIC_STORAGE_URL=$NEXT_PUBLIC_STORAGE_URL

# Generate a partial monorepo with a pruned lockfile for a target workspace
RUN turbo prune --scope=${PROJECT} --docker

# 3. Build the project
FROM base AS builder
ARG PROJECT
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STORAGE_URL

# Environment to skip .env validation on build
ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STORAGE_URL=$NEXT_PUBLIC_STORAGE_URL

WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

# First install the dependencies (as they change less often)
RUN --mount=type=cache,id=s/patissio-web-pnpm,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

# Create .next cache directory to avoid the no-cache warning
RUN mkdir -p /app/apps/${PROJECT}/.next/cache

# Build the project with cache mount for Next.js
RUN --mount=type=cache,id=s/patissio-web-nextjs,target=/app/apps/${PROJECT}/.next/cache \
  pnpm build --filter=${PROJECT}

# 4. Final image - runner stage with standalone Next.js
FROM node:${NODE_VERSION}-alpine AS runner
ARG APP_DIRNAME

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIRNAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIRNAME}/.next/static ./apps/${APP_DIRNAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIRNAME}/public ./apps/${APP_DIRNAME}/public

USER nextjs

ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start the standalone server
CMD ["node", "apps/web/server.js"]
