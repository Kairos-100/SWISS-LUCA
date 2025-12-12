FROM node:20-slim

# Firebase App Hosting uses /workspace as the working directory
# This Dockerfile is used when runtime is not specified in apphosting.yaml
WORKDIR /workspace

# Copy package files first
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --no-audit --no-fund || npm install --only=production --no-audit --no-fund

# Copy server file
COPY server.js ./

# Verify files exist and log their locations
RUN echo "=== File verification ===" && \
    ls -la /workspace/ && \
    echo "=== Checking files ===" && \
    test -f ./server.js && echo "✅ server.js found" || (echo "❌ ERROR: server.js not found" && exit 1) && \
    test -f ./package.json && echo "✅ package.json found" || (echo "❌ ERROR: package.json not found" && exit 1) && \
    echo "=== File contents check ===" && \
    head -5 ./server.js && \
    cat ./package.json && \
    echo "=== Entry point verification ===" && \
    echo "Package.json main field:" && grep '"main"' ./package.json && \
    echo "Package.json start script:" && grep '"start"' ./package.json

# Expose port
EXPOSE 8080

# Environment variables - PORT will be set by Cloud Run/App Hosting
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Start server - use npm start which runs "node server.js" according to package.json
# This matches what apphosting.yaml runCommand does
# Add debug logging before starting
RUN echo "=== Pre-start verification ===" && \
    pwd && \
    ls -la && \
    echo "=== package.json start script ===" && \
    cat package.json | grep -A 2 '"scripts"' && \
    echo "=== Ready to start ==="

# Start server directly - matches apphosting.yaml runCommand
CMD ["node", "server.js"]
