/**
 * FIREBASE CLOUD FUNCTIONS - LUCA APP
 * 
 * Funciones para procesar pagos, suscripciones y webhooks de Stripe
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';
import * as cors from 'cors';

// Inicializar Firebase Admin
admin.initializeApp();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Configurar Express app para endpoints HTTP
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ========================================
// CREAR PAYMENT INTENT (Pago único)
// ========================================

export const createPaymentIntent = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    try {
      // Verificar autenticación
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuario no autenticado'
        );
      }

      const { amount, currency = 'chf', description, metadata } = data;

      // Validar datos
      if (!amount || amount <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Monto inválido'
        );
      }

      // Crear Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency: currency.toLowerCase(),
        description,
        metadata: {
          userId: context.auth.uid,
          ...metadata,
        },
        // Habilitar TWINT y otros métodos
        payment_method_types: ['card', 'twint'],
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('Error creando PaymentIntent:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Error al crear el pago'
      );
    }
  });

// ========================================
// CREAR SUSCRIPCIÓN
// ========================================

export const createSubscription = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    try {
      // Verificar autenticación
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuario no autenticado'
        );
      }

      const { planId, planType, customerEmail } = data;

      // Validar datos
      if (!planId || !planType) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Datos de suscripción inválidos'
        );
      }

      const userId = context.auth.uid;

      // Obtener o crear cliente de Stripe
      let customerId: string;
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (userData?.stripeCustomerId) {
        customerId = userData.stripeCustomerId;
      } else {
        // Crear nuevo cliente en Stripe
        const customer = await stripe.customers.create({
          email: customerEmail || context.auth.token.email,
          metadata: {
            userId,
          },
        });
        customerId = customer.id;

        // Guardar customerId en Firestore
        await admin.firestore().collection('users').doc(userId).update({
          stripeCustomerId: customerId,
        });
      }

      // Determinar precio según plan
      const prices: { [key: string]: { monthly: number; yearly: number } } = {
        standard: {
          monthly: 9.99,
          yearly: 99.99,
        },
      };

      const price = planType === 'monthly' 
        ? prices.standard.monthly 
        : prices.standard.yearly;

      // Crear suscripción en Stripe
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: 'chf',
              product_data: {
                name: `LUCA App - ${planType === 'monthly' ? 'Plan Mensuel' : 'Plan Annuel'}`,
                description: 'Accès complet à toutes les offres',
              },
              unit_amount: Math.round(price * 100), // En centavos
              recurring: {
                interval: planType === 'monthly' ? 'month' : 'year',
              },
            },
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card', 'twint'],
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Obtener client secret del PaymentIntent
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error: any) {
      console.error('Error creando suscripción:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Error al crear la suscripción'
      );
    }
  });

// ========================================
// CANCELAR SUSCRIPCIÓN
// ========================================

export const cancelSubscription = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    try {
      // Verificar autenticación
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuario no autenticado'
        );
      }

      const { subscriptionId } = data;

      if (!subscriptionId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'ID de suscripción no proporcionado'
        );
      }

      // Cancelar suscripción en Stripe
      await stripe.subscriptions.cancel(subscriptionId);

      // Actualizar estado en Firestore
      const userId = context.auth.uid;
      await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelando suscripción:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Error al cancelar la suscripción'
      );
    }
  });

// ========================================
// WEBHOOK DE STRIPE
// ========================================

export const stripeWebhook = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).send('No signature');
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Procesar evento
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentSucceeded(paymentIntent);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentFailed(paymentIntent);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(invoice);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).send(`Webhook Error: ${error.message}`);
    }
  });

// ========================================
// FUNCIONES AUXILIARES PARA WEBHOOKS
// ========================================

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  const userId = paymentIntent.metadata.userId;
  const offerId = paymentIntent.metadata.offerId;

  if (!userId) return;

  // Registrar pago en Firestore
  await admin.firestore().collection('payments').add({
    userId,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'succeeded',
    offerId: offerId || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  const userId = paymentIntent.metadata.userId;

  if (!userId) return;

  // Registrar pago fallido
  await admin.firestore().collection('payments').add({
    userId,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'failed',
    error: paymentIntent.last_payment_error?.message,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);
  
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Buscar usuario por customerId
  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) {
    console.error('Usuario no encontrado para customerId:', customerId);
    return;
  }

  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;

  // Obtener detalles de la suscripción
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Actualizar suscripción en Firestore
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: 'active',
    subscriptionId: subscriptionId,
    subscriptionEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
    totalPaid: admin.firestore.FieldValue.increment(invoice.amount_paid / 100),
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  const customerId = invoice.customer as string;

  // Buscar usuario
  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) return;

  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;

  // Actualizar estado (período de gracia)
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: 'past_due',
    lastPaymentError: invoice.last_finalization_error?.message || 'Payment failed',
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = subscription.customer as string;

  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) return;

  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;

  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status,
    subscriptionEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = subscription.customer as string;

  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) return;

  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;

  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: 'cancelled',
    subscriptionEnd: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ========================================
// TAREA PROGRAMADA: VERIFICAR SUSCRIPCIONES EXPIRADAS
// ========================================

export const checkExpiredSubscriptions = functions
  .region('europe-west1')
  .pubsub.schedule('0 0 * * *') // Todos los días a medianoche
  .timeZone('Europe/Zurich')
  .onRun(async () => {
    console.log('Checking expired subscriptions...');

    const now = admin.firestore.Timestamp.now();
    const usersRef = admin.firestore().collection('users');

    // Buscar suscripciones que hayan expirado
    const snapshot = await usersRef
      .where('subscriptionEnd', '<', now)
      .where('subscriptionStatus', 'in', ['active', 'trial'])
      .get();

    const batch = admin.firestore().batch();
    let count = 0;

    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        subscriptionStatus: 'expired',
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Expired ${count} subscriptions`);
    } else {
      console.log('No subscriptions to expire');
    }

    return null;
  });

// ========================================
// ENDPOINT HTTP ALTERNATIVO (opcional)
// ========================================

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'chf', metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      payment_method_types: ['card', 'twint'],
      metadata,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export const api = functions
  .region('europe-west1')
  .https.onRequest(app);
