# Use the official Node.js runtime as base image
FROM node:20-slim

# Set working directory to /workspace (Firebase App Hosting mounts code here)
WORKDIR /workspace

# Copy package files for dependency installation
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --only=production --no-audit --no-fund
RUN npm cache clean --force

# Note: server.js and index.js will be mounted by Firebase App Hosting
# We don't copy them here because Firebase App Hosting mounts the source directory

# Expose port 8080 (Firebase App Hosting/Cloud Run standard)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check to ensure server is ready
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server - Firebase App Hosting will mount index.js in /workspace
# If index.js doesn't exist, fall back to server.js
CMD sh -c "if [ -f /workspace/index.js ]; then node /workspace/index.js; elif [ -f /workspace/server.js ]; then node /workspace/server.js; else echo 'ERROR: No entry point found' && ls -la /workspace/ && exit 1; fi"

