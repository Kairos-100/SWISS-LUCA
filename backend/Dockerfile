# Use the official Node.js runtime as base image
FROM node:20-slim

# Create /workspace directory (Firebase App Hosting uses this)
WORKDIR /workspace

# Also create /app for our files
RUN mkdir -p /app

# Copy package files to both locations
COPY package*.json ./
COPY package*.json /app/

# Install production dependencies in /workspace
RUN npm ci --only=production || npm install --only=production --no-audit --no-fund
RUN npm cache clean --force

# Copy node_modules to /app
RUN cp -r node_modules /app/ 2>/dev/null || true

# Copy application files to both locations
COPY server.js ./
COPY index.js ./
COPY server.js /app/
COPY index.js /app/

# Verify files exist in both locations
RUN test -f /workspace/server.js && test -f /workspace/index.js && echo "✅ Files in /workspace" || (echo "❌ Missing files in /workspace" && exit 1)
RUN test -f /app/server.js && test -f /app/index.js && echo "✅ Files in /app" || echo "⚠️ Files not in /app"

# Expose port 8080 (Firebase App Hosting/Cloud Run standard)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check to ensure server is ready
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server using index.js (which requires server.js)
CMD ["node", "index.js"]

