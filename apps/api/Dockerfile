# Version de Node.js
ARG NODE_VERSION=24
ARG APP_DIRNAME=api
ARG PROJECT=api

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

COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune --scope=${PROJECT} --docker

# 3. Build the project
FROM base AS builder
ARG PROJECT

ENV CI=true

WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /app/out/json/ .

# First install the dependencies (as they change less often)
RUN pnpm install --frozen-lockfile

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

RUN pnpm build --filter=${PROJECT}

# 4. Production image
FROM base AS runner
ARG APP_DIRNAME
WORKDIR /app

# Non-root user
RUN addgroup --system --gid 1001 adonis
RUN adduser --system --uid 1001 adonis
USER adonis

# Copy built files
COPY --from=builder --chown=adonis:adonis /app .
WORKDIR /app/apps/${APP_DIRNAME}

ARG PORT=3333
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["node", "./build/bin/server.js"]
