// Entry point for Cloud Run / Firebase App Hosting
// This file ensures the server starts and stays running
const server = require('./server.js');

// Ensure process doesn't exit immediately
// Keep the process alive
if (require.main === module) {
  // This is the main entry point
  console.log('✅ Entry point loaded, server should be running');
  
  // Prevent process from exiting
  process.on('SIGINT', () => {
    console.log('⚠️ SIGINT received, shutting down gracefully...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });
}
