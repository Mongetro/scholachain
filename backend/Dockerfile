# backend/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install curl pour les healthchecks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application in dev mode
CMD ["npm", "run", "dev"]