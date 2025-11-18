# React Native Web Docker configuration
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    bash

# Copy package files
COPY package.json yarn.lock ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

# Install Yarn Berry if not using PnP
RUN corepack enable && \
    corepack prepare yarn@3.6.4 --activate

# Install dependencies
RUN yarn install --immutable

# Copy application source
COPY . .

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose Metro bundler port
EXPOSE 8081

# Expose React Native debugger port
EXPOSE 8097

# Health check for Metro bundler
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/status || exit 1

# Start Metro bundler
CMD ["yarn", "start", "--reset-cache"]