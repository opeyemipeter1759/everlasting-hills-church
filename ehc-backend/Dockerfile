FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
# nest build (tsc) OOMs on the default Cloud Build machine's memory budget once
# V8 hits its auto-detected heap ceiling (~2GB) well before the box's actual
# limit. The npm build script raises the heap itself so every builder (this
# image, Railway's Railpack, a laptop) gets the same fix; this ENV stays for
# the prisma/postinstall steps that run node directly.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
EXPOSE 8080
CMD ["node", "dist/main"]