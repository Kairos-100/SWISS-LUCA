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
// Firebase App Hosting/Cloud Run usa PORT=8080 por defecto
// CRITICAL FIX: Cloud Run provides PORT as string, must convert to number
const PORT = parseInt(process.env.PORT || '8080', 10);
// Firebase App Hosting/Cloud Run requiere escuchar en 0.0.0.0
const HOST = process.env.HOST || '0.0.0.0';

// Validate PORT is a valid number
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`❌ ERROR: Invalid PORT value: ${process.env.PORT}`);
  console.error(`❌ PORT must be a number between 1 and 65535`);
  process.exit(1);
}

// Middleware
app.use(helmet({
  // Configurar helmet para Cloud Run
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS: Permitir todas las solicitudes en Cloud Run (se puede restringir después)
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Ruta raíz para health check (responde inmediatamente)
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

// Health check endpoint (para Cloud Run)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripe: stripe ? 'configured' : 'not configured',
    uptime: process.uptime()
  });
});

// Startup probe endpoint (responde inmediatamente sin verificar servicios externos)
app.get('/ready', (req, res) => {
  res.status(200).json({ 
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Crear Payment Intent con TWINT
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Servicio de pagos no disponible',
        details: 'STRIPE_SECRET_KEY no está configurada'
      });
    }

    const { amount, currency, description, metadata } = req.body;

    // Validar datos
    if (!amount || !currency || !description) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Crear Payment Intent con Card, TWINT y Apple Pay
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Ya viene en centavos desde el frontend
      currency: currency.toLowerCase(),
      description: description,
      metadata: metadata || {},
      // Métodos de pago explícitos: Card, TWINT, Apple Pay, Google Pay, Link y Klarna
      payment_method_types: ['card', 'twint', 'apple_pay', 'google_pay', 'link', 'klarna'],
      // Configuración específica para Suiza
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

// Verificar estado del pago
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

// Webhook para confirmar pagos (opcional)
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

  // Manejar eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Aquí puedes actualizar tu base de datos
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor - CRITICAL: Must start immediately for Cloud Run
console.log(`🔧 Iniciando servidor en ${HOST}:${PORT}...`);
console.log(`📦 Node version: ${process.version}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌍 CORS habilitado para: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
console.log(`💳 Stripe: ${stripe ? 'configurado' : 'no configurado'}`);
console.log(`🔌 PORT environment variable: ${process.env.PORT || 'not set (using default 8080)'}`);
console.log(`🔌 Using PORT: ${PORT}, HOST: ${HOST}`);

// Start server - wrap in try-catch to catch any startup errors
let server;
try {
  server = app.listen(PORT, HOST, () => {
    const address = server.address();
    console.log(`✅ Servidor backend ejecutándose correctamente en ${HOST}:${PORT}`);
    console.log(`✅ Health check disponible en http://${HOST}:${PORT}/health`);
    console.log(`✅ API disponible en http://${HOST}:${PORT}/api`);
    
    if (address) {
      console.log(`✅ Servidor escuchando en ${address.address}:${address.port}`);
      console.log(`✅ Server is ready and listening on port ${address.port}`);
    } else {
      console.error('❌ ERROR: Server address is null - server may not be listening!');
      process.exit(1);
    }
  });

  // Handle server errors immediately
  server.on('error', (error) => {
    console.error(`❌ Error del servidor:`, error);
    console.error(`❌ Error code: ${error.code}`);
    console.error(`❌ Error message: ${error.message}`);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
    } else if (error.code === 'EACCES') {
      console.error(`❌ Error: No se tienen permisos para usar el puerto ${PORT}`);
    }
    process.exit(1);
  });

  // Verify server is actually listening after a short delay
  setTimeout(() => {
    if (!server) {
      console.error('❌ CRITICAL: Server object is null!');
      process.exit(1);
    }
    const address = server.address();
    if (address) {
      console.log(`✅ VERIFIED: Server is listening on ${address.address}:${address.port}`);
    } else {
      console.error('❌ CRITICAL: Server is not listening! Address is null.');
      process.exit(1);
    }
  }, 2000);

} catch (error) {
  console.error('❌ Error crítico al iniciar el servidor:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Manejar cierre graceful para Cloud Run
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recibido, cerrando servidor gracefully...');
  if (server) {
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
    
    // Timeout de seguridad
    setTimeout(() => {
      console.error('⚠️ Forzando cierre del servidor');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  // No salir del proceso, solo registrar el error
});

module.exports = app;
