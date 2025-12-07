// Cargar variables de entorno primero (sin error si no existe)
try {
  require('dotenv').config();
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
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Ruta raíz para health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'FLASH Backend API',
    timestamp: new Date().toISOString(),
    stripe: stripe ? 'configured' : 'not configured'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripe: stripe ? 'configured' : 'not configured'
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

// Iniciar servidor
// Firebase App Hosting/Cloud Run requiere escuchar en 0.0.0.0
const HOST = process.env.HOST || '0.0.0.0';

try {
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor backend ejecutándose en ${HOST}:${PORT}`);
    console.log(`💳 Stripe: ${stripe ? 'configurado' : 'no configurado'}`);
    console.log(`🌍 CORS habilitado para: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`📦 Node version: ${process.version}`);
    console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  });

  // Manejar errores del servidor
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
    } else {
      console.error(`❌ Error del servidor:`, error);
    }
    process.exit(1);
  });

  // Manejar cierre graceful
  process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM recibido, cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('❌ Error crítico al iniciar el servidor:', error);
  process.exit(1);
}

module.exports = app;
