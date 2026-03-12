# Multi-stage build for KUPURI Studios
# Stage 1: Build BFF (Hono + TypeScript)
FROM node:20-alpine AS bff-build
WORKDIR /app/bff

# Copy BFF package files
COPY bff/package.json bff/pnpm-lock.yaml* ./
COPY bff/tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY bff/src ./src

# Build (if needed)
RUN npm run build 2>/dev/null || true

# Stage 2: Build Web (Next.js)
FROM node:20-alpine AS web-build
WORKDIR /app/web

# Copy Web package files
COPY web/package.json web/pnpm-lock.yaml* ./
COPY web/tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY web/public ./public
COPY web/src ./src
COPY web/next.config.js web/tailwind.config.ts web/postcss.config.js ./

# Build Next.js
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Copy BFF from build stage
COPY --from=bff-build /app/bff/node_modules ./bff/node_modules
COPY --from=bff-build /app/bff/src ./bff/src
COPY bff/package.json bff/tsconfig.json ./bff/

# Copy Web from build stage
COPY --from=web-build /app/web/node_modules ./web/node_modules
COPY --from=web-build /app/web/.next ./web/.next
COPY --from=web-build /app/web/public ./web/public
COPY web/package.json web/next.config.js ./web/

# Copy environment files
COPY .env.example ./
RUN cp .env.example .env

# Expose ports
EXPOSE 8000 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Create entrypoint script
RUN mkdir -p /app/scripts && cat > /app/scripts/start.sh << 'EOF'
#!/bin/sh
set -e

# Start BFF in background
echo "Starting BFF on port 8000..."
cd /app/bff
npm start &
BFF_PID=$!

# Start Web on port 3000
echo "Starting Web (Next.js) on port 3000..."
cd /app/web
npm start &
WEB_PID=$!

# Wait for both processes
wait $BFF_PID $WEB_PID
EOF

RUN chmod +x /app/scripts/start.sh

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["/app/scripts/start.sh"]
