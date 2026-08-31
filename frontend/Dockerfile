# WH40k Colony Manager - Frontend Docker Image
# Multi-stage build for production-ready frontend

# ============================================
# Stage 1: Build
# ============================================
FROM node:20.18.1-alpine3.20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using --ignore-scripts to prevent lifecycle script execution (addressing SonarQube docker:S6505)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build for production
RUN npm run build

# ============================================
# Stage 2: Runtime (nginx)
# ============================================
FROM nginx:1.27.3-alpine3.20 AS runtime

# Create non-root user for security
RUN addgroup -g 101 -S nginx-frontend && \
    adduser -S -D -H -u 101 -h /var/www -s /sbin/nologin -G nginx-frontend nginx-frontend

WORKDIR /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist .

# Change ownership
RUN chown -R nginx-frontend:nginx-frontend /usr/share/nginx/html

USER nginx-frontend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]