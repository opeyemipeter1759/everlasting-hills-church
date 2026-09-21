FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
# The build transpiles with SWC (see nest-cli.json): under a second and a few
# hundred MB. The tsc builder had grown past the default heap and past Cloud
# Build's default machine, which is how the API silently stopped deploying on
# 2026-09-16. Type errors are caught by CI's `npm run typecheck`, not here.
RUN npm run build

FROM node:22-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
EXPOSE 8080
CMD ["node", "dist/main"]