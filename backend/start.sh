#!/bin/bash
set -e

echo "🚀 Starting backend server..."
echo "📁 Current directory: $(pwd)"
echo "📦 Node version: $(node --version)"
echo "🔌 PORT: ${PORT:-8080}"

# Ensure we're in the right directory
if [ ! -f "server.js" ]; then
  echo "❌ ERROR: server.js not found in $(pwd)"
  exit 1
fi

# Start the server
exec node server.js
