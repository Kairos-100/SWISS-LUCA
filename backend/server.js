const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Crear Payment Intent con TWINT
app.post('/api/create-payment-intent', async (req, res) => {
  try {
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
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor backend ejecutándose en ${HOST}:${PORT}`);
  console.log(`💳 Stripe configurado para TWINT`);
  console.log(`🌍 CORS habilitado para: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;
