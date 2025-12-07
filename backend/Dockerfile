# Use the official Node.js runtime as base image
FROM node:20-slim

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --only=production --no-audit --no-fund
RUN npm cache clean --force

# Copy application files
COPY server.js ./
COPY index.js ./

# Verify files exist
RUN test -f /workspace/server.js && test -f /workspace/index.js && echo "✅ Files verified" || (echo "❌ Missing files" && exit 1)

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
CMD ["node", "index.js"]

