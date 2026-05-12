# =============================================================================
# Stage 1: deps — install semua dependencies
# =============================================================================
FROM oven/bun:1.2-alpine AS deps

WORKDIR /app

# Copy package files saja untuk layer caching
COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile


# =============================================================================
# Stage 2: builder — build SvelteKit
# =============================================================================
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build SvelteKit (adapter-node menghasilkan ./build)
RUN bun run build


# =============================================================================
# Stage 3: runner — image final untuk SvelteKit + Drizzle
# =============================================================================
FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/build        ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Drizzle migrations — copy kalau dijalankan saat startup
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000

CMD ["bun", "./build/index.js"]


# =============================================================================
# Stage 4: worker — image untuk BullMQ worker (multi-instance)
# =============================================================================
FROM oven/bun:1.2-alpine AS worker

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy worker entry point dan semua yang di-import-nya
COPY --from=builder /app/worker.ts ./worker.ts
# Sesuaikan baris di bawah dengan struktur project kamu:
COPY --from=builder /app/src/lib     ./src/lib
# COPY --from=builder /app/src/db      ./src/db
# COPY --from=builder /app/src/queues  ./src/queues

# Bun bisa run TypeScript langsung — tidak perlu compile step
CMD ["bun", "worker.ts"]
