# WH40k Colony Manager - Frontend Docker Image
# Multi-stage build for production-ready frontend

# ============================================
# Stage 1: Build
# ============================================
FROM node:alpine AS builder

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
FROM nginx:alpine-slim AS runtime

WORKDIR /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist .

# Change ownership to existing nginx user (UID/GID 101 in Alpine)
# Also create cache and run directories with proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    mkdir -p /run/nginx && \
    chown -R nginx:nginx /run/nginx

# Note: Not switching to nginx user to avoid PID file permission issues
# The container runs as root but nginx worker processes drop privileges automatically

# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#     CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]