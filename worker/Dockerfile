# Stage 1: Build the worker using the backend source
FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# Stage 2: Production worker
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/worker.js"]