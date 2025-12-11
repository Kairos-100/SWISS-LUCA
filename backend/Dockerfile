FROM node:20-slim

# Firebase App Hosting uses /workspace as the working directory
WORKDIR /workspace

# Copy package files first
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --no-audit --no-fund || npm install --only=production --no-audit --no-fund

# Copy all necessary files
COPY server.js ./
COPY index.js ./

# Verify files exist
RUN test -f ./server.js || (echo "ERROR: server.js not found" && exit 1)
RUN test -f ./index.js || (echo "ERROR: index.js not found" && exit 1)
RUN test -f ./package.json || (echo "ERROR: package.json not found" && exit 1)

# Expose port
EXPOSE 8080

# Environment variables - PORT will be set by Cloud Run/App Hosting
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Start server - use index.js as entry point (it requires server.js)
# Firebase App Hosting copies files to /workspace, so we use that path
CMD ["node", "/workspace/index.js"]
