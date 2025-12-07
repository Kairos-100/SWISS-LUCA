# Use the official Node.js runtime as base image
FROM node:20-slim

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --only=production --no-audit --no-fund
RUN npm cache clean --force

# Copy application files explicitly
COPY server.js /workspace/server.js
COPY index.js /workspace/index.js

# Verify files exist and list directory contents
RUN ls -la /workspace/ && \
    echo "Checking for server.js..." && \
    test -f /workspace/server.js && echo "✅ server.js found" || (echo "❌ server.js NOT FOUND" && exit 1) && \
    echo "Checking for index.js..." && \
    test -f /workspace/index.js && echo "✅ index.js found" || (echo "❌ index.js NOT FOUND" && exit 1) && \
    echo "✅ All files verified"

# Expose port 8080 (Cloud Run standard)
EXPOSE 8080

# Set environment variables (Cloud Run will override PORT if needed)
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check to ensure server is ready (increased timeout for Cloud Run)
# Note: Cloud Run has its own health checks, but this helps during build
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Start the server using index.js (which requires server.js)
# Use exec form to ensure proper signal handling
# Use absolute path to be explicit
CMD ["node", "/workspace/index.js"]

