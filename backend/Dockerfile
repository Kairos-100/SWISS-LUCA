# Use the official Node.js runtime as base image
FROM node:20-slim

# Create both /app and /workspace directories for compatibility
WORKDIR /app
RUN mkdir -p /workspace

# Copy package files first (for better caching)
COPY package*.json ./
COPY package*.json /workspace/

# Install production dependencies in both locations
RUN npm ci --only=production || npm install --only=production --no-audit --no-fund
RUN npm cache clean --force

# Copy node_modules to workspace for compatibility
RUN cp -r node_modules /workspace/ 2>/dev/null || true

# Copy application code to both locations
COPY server.js ./
COPY server.js /workspace/

# Create a startup script that works from any directory
RUN echo '#!/bin/sh\n\
if [ -f /workspace/server.js ]; then\n\
  cd /workspace && node server.js\n\
elif [ -f /app/server.js ]; then\n\
  cd /app && node server.js\n\
else\n\
  echo "ERROR: server.js not found in /workspace or /app"\n\
  ls -la /workspace/ 2>/dev/null || echo "Workspace empty"\n\
  ls -la /app/ 2>/dev/null || echo "App empty"\n\
  exit 1\n\
fi' > /start.sh && chmod +x /start.sh

# Expose port 8080 (Firebase App Hosting/Cloud Run standard)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check to ensure server is ready
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server using the startup script
CMD ["/start.sh"]

