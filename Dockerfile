# Builder
FROM oven/bun:alpine AS builder
WORKDIR /app

# Copy konfigurasi package dan install dependency
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy seluruh source code
COPY . .

# (Opsional) Jika nanti CLI buntok mendukung proses build/bundle
# RUN bun run build

# Production Runner
FROM oven/bun:alpine
WORKDIR /app

# Copy dependency yang sudah di-install dan source code dari builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Siapkan folder logs
RUN mkdir -p /app/logs && chown -R bun:bun /app/logs

# Gunakan user non-root untuk keamanan
USER bun

# Expose default port
EXPOSE 1212

# Environment variables
ENV NODE_ENV=production
ENV PORT=1212
ENV LOGGER_DIR=/app/logs

# Jalankan framework
CMD ["bun", "run", "src/index.ts"]