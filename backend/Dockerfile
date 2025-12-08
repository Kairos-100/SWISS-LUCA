FROM node:20-slim

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --only=production

# Copy all necessary files
COPY server.js ./
COPY index.js ./

# Verify files exist
RUN test -f ./server.js || (echo "ERROR: server.js not found" && exit 1)
RUN test -f ./package.json || (echo "ERROR: package.json not found" && exit 1)

# Expose port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start server - use node directly
# Note: Cloud Run uses its own health check system based on HTTP requests
# No need for Docker HEALTHCHECK instruction
CMD ["node", "server.js"]
