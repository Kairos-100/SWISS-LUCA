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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server - use node directly
CMD ["node", "server.js"]
