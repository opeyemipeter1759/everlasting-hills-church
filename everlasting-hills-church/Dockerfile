# Production image for Google Cloud Run, built by Cloud Build from this folder.
# Three stages: install dependencies, build, then a slim runner holding only
# the standalone server (next.config.mjs sets output: 'standalone').
FROM node:20-alpine AS base

# ── Stage 1: dependencies ────────────────────────────────────────────────────
FROM base AS deps
# Some prebuilt native modules expect glibc symbols that Alpine's musl lacks.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Installed on Alpine, so sharp pulls its linux-musl binary for next/image.
RUN npm ci

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_ values come from .env.production, which Next.js reads at build
# time and inlines into the browser bundle. Server-only values are never baked
# in: they are set on the Cloud Run service and read at runtime.
# The YouTube browser key stays out of git: Cloud Build passes it in from the
# trigger's _NEXT_PUBLIC_YOUTUBE_API_KEY substitution (see cloudbuild.yaml).
ARG NEXT_PUBLIC_YOUTUBE_API_KEY
ENV NEXT_PUBLIC_YOUTUBE_API_KEY=$NEXT_PUBLIC_YOUTUBE_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: runner ──────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# public/ includes sw.js, which Serwist generates during the build.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# The standalone server and the node_modules it traced (sharp included).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Standalone tracing keeps sharp's JS but drops its native linux-musl binary,
# which lives in @img/*. Without it next/image optimisation fails at runtime.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img

# Owns .next, so the ISR/fetch cache under .next/cache stays writable.
USER nextjs

EXPOSE 8080
CMD ["node", "server.js"]
