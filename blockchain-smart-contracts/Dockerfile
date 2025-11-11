FROM node:22-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Install ts-node
RUN npm install --save-dev ts-node

# Make the script executable
RUN chmod +x ./scripts/deploy-wrapper.sh

CMD ["npx", "hardhat", "node"]