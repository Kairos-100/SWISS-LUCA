/**
 * FIREBASE CLOUD FUNCTIONS - LUCA APP
 * 
 * Funciones para procesar pagos, suscripciones y webhooks de Stripe
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';
import * as cors from 'cors';

// Inicializar Firebase Admin
admin.initializeApp();

// Obtener clave secreta de Stripe desde Secrets
const getStripeSecretKey = (): string => {
  // Firebase Secrets están disponibles automáticamente en process.env cuando se despliega
  if (process.env.STRIPE_SECRET_KEY) {
    const key = process.env.STRIPE_SECRET_KEY;
    console.log('✅ STRIPE_SECRET_KEY encontrada:', key.substring(0, 20) + '...' + key.substring(key.length - 4));
    return key;
  }
  
  // Fallback: intentar obtener de Firebase Functions Config (deprecated)
  const config = functions.config();
  if (config?.stripe?.secret_key) {
    const key = config.stripe.secret_key;
    console.log('✅ STRIPE_SECRET_KEY encontrada en config (deprecated):', key.substring(0, 20) + '...');
    return key;
  }
  
  console.error('❌ STRIPE_SECRET_KEY no configurada');
  console.error('Por favor, configura el secret en Firebase:');
  console.error('firebase functions:secrets:set STRIPE_SECRET_KEY');
  return '';
};

// Inicializar Stripe
const getStripeInstance = (): Stripe => {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY no encontrada en process.env');
    console.error('Verifica que el secret esté configurado y las functions redesplegadas');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'stripeKeyNotConfigured'
    );
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-07-30.basil',
    maxNetworkRetries: 4,
    timeout: 60000, // 60 segundos
  });
};

// ========================================
// HELPER: Reintento con backoff exponencial
// ========================================

/**
 * Reintenta una operación con backoff exponencial
 * @param fn Función a ejecutar
 * @param maxRetries Número máximo de reintentos (default: 3)
 * @param initialDelay Delay inicial en ms (default: 1000)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // No reintentar si es un error de configuración o autenticación
      if (
        error.code === 'stripeKeyNotConfigured' ||
        error.code === 'unauthenticated' ||
        error.code === 'permission-denied' ||
        error.code === 'invalid-argument'
      ) {
        throw error;
      }
      
      // Verificar si es un error de conexión que vale la pena reintentar
      const isConnectionError = 
        error.type === 'StripeConnectionError' ||
        error.type === 'StripeAPIError' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection') ||
        error.message?.includes('network');
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      // Calcular delay con backoff exponencial
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Intento ${attempt + 1}/${maxRetries + 1} falló. Reintentando en ${delay}ms...`, {
        error: error.message,
        type: error.type,
        code: error.code,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Detecta si un error es de conexión con Stripe
 */
function isStripeConnectionError(error: any): boolean {
  return (
    error.type === 'StripeConnectionError' ||
    error.type === 'StripeAPIError' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.message?.includes('timeout') ||
    error.message?.includes('connection') ||
    error.message?.includes('network') ||
    error.message?.includes('ECONNREFUSED')
  );
}

// Configurar Express app para endpoints HTTP
const app = express.default();
app.use(cors.default({ origin: true }));
app.use(express.json());

// ========================================
// CREAR PAYMENT INTENT (Pago único)
// ========================================

export const createPaymentIntent = functions
  .region('europe-west1')
  .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB' as const,
  })
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    let stripe: Stripe;
    try {
      stripe = getStripeInstance();
    } catch (error: any) {
      // Si el error es de configuración de Stripe, lanzarlo con el código correcto
      if (error.message && error.message.includes('stripeKeyNotConfigured')) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'stripeKeyNotConfigured'
        );
      }
      // Re-lanzar otros errores
      throw error;
    }

    try {
      // Verificar autenticación
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuario no autenticado'
        );
      }

      const userId = context.auth.uid;
      const { amount, currency = 'chf', description, metadata } = data;

      // Validar datos
      if (!amount || amount <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Monto inválido'
        );
      }

      // Crear Payment Intent con reintentos
      // El amount ya viene en centavos desde el frontend
      console.log('🔧 Creando Payment Intent con Stripe...', {
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        description,
        userId,
      });
      
      const paymentIntent = await retryWithBackoff(async () => {
        try {
          const intent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Ya viene en centavos, solo redondear
            currency: currency.toLowerCase(),
            description,
            metadata: {
              userId: userId,
              ...metadata,
            },
            // Métodos de pago explícitos: Card, TWINT, Apple Pay, Google Pay, Link y Klarna
            // Estos métodos deben estar habilitados en Stripe Dashboard
            payment_method_types: ['card', 'twint', 'apple_pay', 'google_pay', 'link', 'klarna'],
            // Habilitar métodos de pago automáticos para asegurar que todos estén disponibles
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: 'never',
            },
          });
          console.log('✅ Payment Intent creado exitosamente:', intent.id);
          return intent;
        } catch (stripeError: any) {
          console.error('❌ Error en llamada a Stripe API:', {
            type: stripeError.type,
            code: stripeError.code,
            message: stripeError.message,
            statusCode: stripeError.statusCode,
          });
          throw stripeError;
        }
      }, 3, 2000); // 3 reintentos, delay inicial de 2 segundos

      console.log('✅ Payment Intent creado exitosamente:', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('❌ Error creando PaymentIntent:', {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
      });
      
      // Detectar errores de conexión específicos
      if (isStripeConnectionError(error)) {
        throw new functions.https.HttpsError(
          'unavailable',
          'An error occurred with our connection to Stripe. Request was retried 2 times. Please try again in a moment.'
        );
      }
      
      // Otros errores de Stripe
      if (error.type && error.type.startsWith('Stripe')) {
        throw new functions.https.HttpsError(
          'internal',
          error.message || 'Error al crear el pago con Stripe'
        );
      }
      
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
  .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB' as const,
  })
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    let stripe: Stripe;
    try {
      stripe = getStripeInstance();
    } catch (error: any) {
      // Si el error es de configuración de Stripe, lanzarlo con el código correcto
      if (error.message && error.message.includes('stripeKeyNotConfigured')) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'stripeKeyNotConfigured'
        );
      }
      // Re-lanzar otros errores
      throw error;
    }

    try {
      // Verificar autenticación
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuario no autenticado'
        );
      }

      const userId = context.auth.uid;
      const userEmail = context.auth.token?.email as string | undefined;
      const { planId, planType, customerEmail } = data;

      // Validar datos
      if (!planId || !planType) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Datos de suscripción inválidos'
        );
      }

      // Obtener o crear cliente de Stripe
      let customerId: string;
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (userData?.stripeCustomerId) {
        customerId = userData.stripeCustomerId;
      } else {
        // Crear nuevo cliente en Stripe (con reintentos)
        const customer = await retryWithBackoff(async () => {
          return await stripe.customers.create({
            email: customerEmail || userEmail || undefined,
            metadata: {
              userId,
            },
          });
        }, 3, 2000);
        customerId = customer.id;

        // Guardar customerId en Firestore
        await admin.firestore().collection('users').doc(userId).update({
          stripeCustomerId: customerId,
        });
      }

      // Determinar precio según plan
      // IMPORTANTE: Ambos planes se pagan mensualmente
      const prices: Record<string, { monthly: number; yearly: number }> = {
        standard: {
          monthly: 5.95,  // Plan mensual: 5.95 CHF/mes
          yearly: 4.95,   // Plan anual: 4.95 CHF/mes
        },
      };

      const planPrices = prices.standard || { monthly: 5.95, yearly: 4.95 };
      const price = planType === 'monthly' 
        ? planPrices.monthly 
        : planPrices.yearly;

      // Crear precio en Stripe primero con reintentos
      // AMBOS planes se pagan mensualmente (interval: 'month')
      const priceObj = await retryWithBackoff(async () => {
        return await stripe.prices.create({
          currency: 'chf',
          unit_amount: Math.round(price * 100),
          recurring: {
            interval: 'month', // Ambos planes se pagan mensualmente
          },
          product_data: {
            name: `LUCA App - ${planType === 'monthly' ? 'Plan Mensuel' : 'Plan Annuel'}`,
          },
        });
      }, 3, 2000);

      // Crear suscripción en Stripe con métodos de pago habilitados (con reintentos)
      const subscription = await retryWithBackoff(async () => {
        return await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceObj.id }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
          payment_settings: {
            // Habilitar métodos de pago automáticamente para suscripciones
            // Los métodos específicos (card, twint, apple_pay) se configuran en el PaymentIntent
          },
        });
      }, 3, 2000);

      // Obtener client secret del PaymentIntent (con reintentos)
      // El invoice ya está expandido, pero necesitamos obtener el payment_intent
      const invoiceId = typeof subscription.latest_invoice === 'string'
        ? subscription.latest_invoice
        : subscription.latest_invoice?.id;
      
      if (!invoiceId) {
        throw new Error('No se pudo obtener el invoice');
      }

      const invoice = await retryWithBackoff(async () => {
        return await stripe.invoices.retrieve(invoiceId, {
          expand: ['payment_intent'],
        });
      }, 3, 2000);

      const paymentIntent = (invoice as any).payment_intent;
      if (!paymentIntent || typeof paymentIntent === 'string') {
        throw new Error('No se pudo obtener el payment intent');
      }

      // Obtener el ID del PaymentIntent
      const paymentIntentId = typeof paymentIntent === 'string' 
        ? paymentIntent 
        : paymentIntent.id;

      // Actualizar el PaymentIntent para incluir todos los métodos de pago (con reintentos)
      // Nota: automatic_payment_methods solo se puede configurar al crear, no al actualizar
      const updatedPaymentIntent = await retryWithBackoff(async () => {
        return await stripe.paymentIntents.update(paymentIntentId, {
          payment_method_types: ['card', 'twint', 'apple_pay', 'google_pay', 'link', 'klarna'],
        });
      }, 3, 2000);

      return {
        subscriptionId: subscription.id,
        clientSecret: updatedPaymentIntent.client_secret,
      };
    } catch (error: any) {
      console.error('❌ Error creando suscripción:', {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
      });
      
      // Detectar errores de conexión específicos
      if (isStripeConnectionError(error)) {
        throw new functions.https.HttpsError(
          'unavailable',
          'An error occurred with our connection to Stripe. Request was retried 2 times. Please try again in a moment.'
        );
      }
      
      // Otros errores de Stripe
      if (error.type && error.type.startsWith('Stripe')) {
        throw new functions.https.HttpsError(
          'internal',
          error.message || 'Error al crear la suscripción con Stripe'
        );
      }
      
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
  .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB' as const,
  })
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const stripe = getStripeInstance();
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
// VERIFICAR ESTADO DE PAGO
// ========================================

export const checkPaymentStatus = functions
  .region('europe-west1')
  .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB' as const,
  })
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const stripe = getStripeInstance();
    try {
      // Verificar autenticación
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuario no autenticado'
        );
      }

      const { paymentIntentId } = data;

      if (!paymentIntentId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'ID de Payment Intent no proporcionado'
        );
      }

      // Obtener Payment Intent desde Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        lastPaymentError: paymentIntent.last_payment_error?.message || null,
        transactionId: paymentIntent.latest_charge ? 
          (typeof paymentIntent.latest_charge === 'string' 
            ? paymentIntent.latest_charge 
            : paymentIntent.latest_charge.id) 
          : null,
      };
    } catch (error: any) {
      console.error('Error verificando estado de pago:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Error al verificar el estado del pago'
      );
    }
  });

// ========================================
// WEBHOOK DE STRIPE
// ========================================

export const stripeWebhook = functions
  .region('europe-west1')
  .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB' as const,
  })
  .https.onRequest(async (req: any, res: any) => {
    const stripe = getStripeInstance();
    const sig = req.headers['stripe-signature'];

    if (!sig || typeof sig !== 'string') {
      res.status(400).send('No signature');
      return;
    }

    let event: Stripe.Event;

    // Obtener webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET no configurada');
      res.status(500).send('Webhook secret not configured');
      return;
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
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
  
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id || '';
  
  // Obtener subscriptionId desde el invoice, puede estar expandido o ser un string
  let subscriptionId = '';
  const invoiceSubscription = (invoice as any).subscription;
  if (invoiceSubscription) {
    subscriptionId = typeof invoiceSubscription === 'string' 
      ? invoiceSubscription 
      : invoiceSubscription.id || '';
  }

  if (!customerId || !subscriptionId) {
    console.error('Missing customerId or subscriptionId in invoice');
    return;
  }

  // Buscar usuario por customerId
  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) {
    console.error('Usuario no encontrado para customerId:', customerId);
    return;
  }

  const userDoc = snapshot.docs[0];
  if (!userDoc) return;

  const userId = userDoc.id;

  // Obtener detalles de la suscripción desde Stripe
  const stripe = getStripeInstance();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

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
  
  const customerId = typeof invoice.customer === 'string' 
    ? invoice.customer 
    : invoice.customer?.id || '';

  if (!customerId) return;

  // Buscar usuario
  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) return;

  const userDoc = snapshot.docs[0];
  if (!userDoc) return;

  const userId = userDoc.id;

  // Actualizar estado (período de gracia)
  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: 'past_due',
    lastPaymentError: invoice.last_finalization_error?.message || 'Payment failed',
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id || '';

  if (!customerId) return;

  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) return;

  const userDoc = snapshot.docs[0];
  if (!userDoc) return;

  const userId = userDoc.id;

  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  await admin.firestore().collection('users').doc(userId).update({
    subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status,
    subscriptionEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id || '';

  if (!customerId) return;

  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

  if (snapshot.empty) return;

  const userDoc = snapshot.docs[0];
  if (!userDoc) return;

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

app.post('/create-payment-intent', async (req: express.Request, res: express.Response) => {
  try {
    const { amount, currency = 'chf', metadata } = req.body;
    const stripe = getStripeInstance();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      // Métodos de pago explícitos: Card, TWINT, Apple Pay, Google Pay, Link y Klarna
      payment_method_types: ['card', 'twint', 'apple_pay', 'google_pay', 'link', 'klarna'],
      // Habilitar métodos de pago automáticos para asegurar que todos estén disponibles
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
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
  .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB' as const,
  })
  .https.onRequest(app);

// ========================================
// CREAR ADMINISTRADOR
// ========================================

export const createAdmin = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB' as const,
  })
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
      // Verificar autenticación
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuario no autenticado'
        );
      }

      const { email } = data;

      if (!email || typeof email !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Email es requerido'
        );
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Formato de email inválido'
        );
      }

      const db = admin.firestore();
      
      // Buscar usuario por email en la colección 'users'
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      
      if (snapshot.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          `Usuario con email ${email} no encontrado. El usuario debe estar registrado en la app primero.`
        );
      }
      
      const userDoc = snapshot.docs[0];
      if (!userDoc) {
        throw new functions.https.HttpsError(
          'not-found',
          `Usuario con email ${email} no encontrado.`
        );
      }
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Verificar si ya es admin
      if (userData.isAdmin === true) {
        return {
          success: true,
          message: `El usuario ${email} ya es administrador`,
          userId,
          alreadyAdmin: true,
        };
      }
      
      // Actualizar usuario para hacerlo admin
      await usersRef.doc(userId).update({
        isAdmin: true,
        isPartner: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Usuario ${email} convertido a administrador. UID: ${userId}`);
      
      return {
        success: true,
        message: `Usuario ${email} ahora es administrador`,
        userId,
        alreadyAdmin: false,
      };
    } catch (error: any) {
      console.error('❌ Error creando administrador:', error);
      
      // Si ya es un HttpsError, re-lanzarlo
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Error al crear el administrador'
      );
    }
  });
