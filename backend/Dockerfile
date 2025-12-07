# Use the official Node.js runtime as base image
FROM node:20-slim

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --only=production --no-audit --no-fund
RUN npm cache clean --force

# Copy application files - only server.js is needed
COPY server.js /workspace/server.js

# Verify server.js exists
RUN test -f /workspace/server.js && echo "✅ server.js found" || (echo "❌ server.js NOT FOUND" && exit 1)

# Expose port 8080 (Cloud Run standard)
EXPOSE 8080

# Set environment variables (Cloud Run will override PORT if needed)
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Note: Cloud Run handles health checks automatically
# No need for Docker HEALTHCHECK as Cloud Run does this

# Start the server directly using server.js
# server.js has all the startup logic and will start listening on port 8080
# Use exec form to ensure proper signal handling
CMD ["node", "/workspace/server.js"]

