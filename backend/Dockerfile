# Use the official Node.js runtime as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install production dependencies only
# Use npm install as fallback if npm ci fails (more robust for Cloud Run)
RUN npm ci --only=production || npm install --only=production --no-audit --no-fund
RUN npm cache clean --force

# Copy application code
COPY server.js ./
COPY index.js ./

# Verify files are in place
RUN ls -la /app/ && test -f /app/server.js || (echo "ERROR: server.js not found!" && exit 1)

# Expose port 8080 (Firebase App Hosting/Cloud Run standard)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check to ensure server is ready
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server using npm start (more reliable)
CMD ["npm", "start"]

