# Multi-stage production build for Aarogya Hospital Management System

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app

# Copy server package and install production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server source code
WORKDIR /app
COPY server ./server

# Copy built frontend assets from stage 1 into dist
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "server/app.js"]
