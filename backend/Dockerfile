FROM node:20-slim

WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install --only=production

# Copy server file
COPY server.js /workspace/server.js

# Verify file exists
RUN test -f /workspace/server.js || exit 1

# Expose port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Start server
CMD ["node", "/workspace/server.js"]
