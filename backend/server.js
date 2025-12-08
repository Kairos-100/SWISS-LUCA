// ============================================
// FLASH Backend Server - Cloud Run Optimized
// ============================================

console.log('🚀 Starting FLASH Backend Server...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('📦 Node version:', process.version);
console.log('🔧 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Load environment variables (optional, Cloud Run provides them)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not critical, Cloud Run provides env vars
}

// Load dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Initialize Stripe (optional - won't crash if not configured)
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized');
  }
} catch (e) {
  console.warn('⚠️ Stripe not configured');
}

// Create Express app
const app = express();

// CRITICAL: Convert PORT to number (Cloud Run provides as string)
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Validate PORT
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error('❌ Invalid PORT:', process.env.PORT);
  process.exit(1);
}

console.log(`🔌 Server will listen on ${HOST}:${PORT}`);

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check endpoints (CRITICAL - must respond immediately)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'FLASH Backend API',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

// API Routes
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }
    const { amount, currency, description, metadata } = req.body;
    if (!amount || !currency || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      description,
      metadata: metadata || {},
      payment_method_types: ['card', 'twint', 'apple_pay', 'google_pay', 'link', 'klarna'],
      shipping_address_collection: { allowed_countries: ['CH'] },
    });
    res.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payment-status/:paymentIntentId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
    res.json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook event:', event.type);
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Request error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER - CRITICAL FOR CLOUD RUN
// ============================================
console.log(`🔧 Starting server on ${HOST}:${PORT}...`);

// Start server - this MUST succeed
const server = app.listen(PORT, HOST, () => {
  const addr = server.address();
  console.log(`✅ Server listening on ${addr.address}:${addr.port}`);
  console.log(`✅ Health: http://${HOST}:${PORT}/health`);
});

// Error handler for server
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  console.error('Code:', err.code);
  console.error('Message:', err.message);
  process.exit(1);
});

// Confirm server is listening
server.on('listening', () => {
  const addr = server.address();
  console.log(`✅ Server confirmed listening on ${addr.address}:${addr.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM - shutting down...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT - shutting down...');
  server.close(() => process.exit(0));
});

// Keep process alive - don't exit on uncaught errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  // Don't exit - keep server running
});

// Export app
module.exports = app;
