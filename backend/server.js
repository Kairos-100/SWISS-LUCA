// Logging inmediato para Cloud Run
console.log('🚀 Iniciando aplicación backend...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('📦 Node version:', process.version);
console.log('🔧 Working directory:', process.cwd());

// Listar archivos para debugging
try {
  const fs = require('fs');
  const files = fs.readdirSync(process.cwd());
  console.log('📁 Files in directory:', files.join(', '));
  
  // Verificar que server.js existe
  const serverPath = require('path').join(process.cwd(), 'server.js');
  if (fs.existsSync(serverPath)) {
    console.log('✅ server.js encontrado en:', serverPath);
  } else {
    console.error('❌ server.js NO encontrado en:', serverPath);
  }
} catch (error) {
  console.warn('⚠️ Error al listar archivos:', error.message);
}

// Cargar variables de entorno primero (sin error si no existe)
try {
  require('dotenv').config();
  console.log('✅ dotenv cargado correctamente');
} catch (error) {
  console.warn('⚠️ No se pudo cargar dotenv, usando variables de entorno del sistema');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Inicializar Stripe solo si la clave está disponible
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe inicializado correctamente');
  } else {
    console.warn('⚠️ STRIPE_SECRET_KEY no está configurada. Las funciones de pago no estarán disponibles.');
  }
} catch (error) {
  console.error('❌ Error al inicializar Stripe:', error.message);
}

const app = express();

// CRITICAL: Cloud Run provides PORT as string, must convert to number
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Validate PORT
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`❌ ERROR: Invalid PORT value: ${process.env.PORT}`);
  console.error(`❌ PORT must be a number between 1 and 65535`);
  process.exit(1);
}

console.log(`🔌 PORT: ${PORT} (type: ${typeof PORT})`);
console.log(`🔌 HOST: ${HOST}`);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoints - MUST respond immediately
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'FLASH Backend API',
    timestamp: new Date().toISOString(),
    stripe: stripe ? 'configured' : 'not configured',
    port: PORT,
    host: HOST
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripe: stripe ? 'configured' : 'not configured',
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  res.status(200).json({ 
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Servicio de pagos no disponible',
        details: 'STRIPE_SECRET_KEY no está configurada'
      });
    }

    const { amount, currency, description, metadata } = req.body;

    if (!amount || !currency || !description) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency.toLowerCase(),
      description: description,
      metadata: metadata || {},
      payment_method_types: ['card', 'twint', 'apple_pay', 'google_pay', 'link', 'klarna'],
      shipping_address_collection: {
        allowed_countries: ['CH'],
      },
    });

    res.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Error al crear el pago',
      details: error.message 
    });
  }
});

app.get('/api/payment-status/:paymentIntentId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Servicio de pagos no disponible',
        details: 'STRIPE_SECRET_KEY no está configurada'
      });
    }

    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      lastPaymentError: paymentIntent.last_payment_error?.message,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      error: 'Error al verificar el estado del pago',
      details: error.message 
    });
  }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Servicio de pagos no disponible',
      details: 'STRIPE_SECRET_KEY no está configurada'
    });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error handler:', err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Start server - SIMPLIFIED and ROBUST
console.log(`🔧 Starting server on ${HOST}:${PORT}...`);

// Start server immediately - no try-catch that might hide errors
const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  console.log(`✅ Server started successfully on ${HOST}:${PORT}`);
  console.log(`✅ Health check: http://${HOST}:${PORT}/health`);
  console.log(`✅ API: http://${HOST}:${PORT}/api`);
  
  if (address) {
    console.log(`✅ Listening on ${address.address}:${address.port}`);
  } else {
    console.error('❌ ERROR: Server address is null!');
    process.exit(1);
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error(`❌ Server error:`, error);
  console.error(`❌ Error code: ${error.code}`);
  console.error(`❌ Error message: ${error.message}`);
  console.error(`❌ Stack:`, error.stack);
  process.exit(1);
});

// Verify server is listening - CRITICAL for Cloud Run
server.on('listening', () => {
  const address = server.address();
  console.log(`✅ Server is now listening on ${address.address}:${address.port}`);
  console.log(`✅ Server ready to accept connections`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('⚠️ Force shutdown');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

// Handle uncaught errors - but don't exit immediately
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit - let the server try to continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection:', reason);
  // Don't exit - just log
});

// CRITICAL: Verify server exists before export
if (!server) {
  console.error('❌ CRITICAL: Server was not initialized!');
  process.exit(1);
}

module.exports = app;
