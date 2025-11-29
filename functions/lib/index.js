"use strict";
/**
 * FIREBASE CLOUD FUNCTIONS - LUCA APP
 *
 * Funciones para procesar pagos, suscripciones y webhooks de Stripe
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.checkExpiredSubscriptions = exports.stripeWebhook = exports.cancelSubscription = exports.createSubscription = exports.createPaymentIntent = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const express = __importStar(require("express"));
const cors = __importStar(require("cors"));
// Inicializar Firebase Admin
admin.initializeApp();
// Obtener clave secreta de Stripe desde Secrets
const getStripeSecretKey = () => {
    // Firebase Secrets están disponibles automáticamente en process.env cuando se despliega
    if (process.env.STRIPE_SECRET_KEY) {
        return process.env.STRIPE_SECRET_KEY;
    }
    // Fallback: intentar obtener de Firebase Functions Config (deprecated)
    const config = functions.config();
    if (config?.stripe?.secret_key) {
        return config.stripe.secret_key;
    }
    console.error('❌ STRIPE_SECRET_KEY no configurada');
    return '';
};
// Inicializar Stripe
const getStripeInstance = () => {
    const secretKey = getStripeSecretKey();
    if (!secretKey) {
        throw new Error('Stripe secret key not configured');
    }
    return new stripe_1.default(secretKey, {
        apiVersion: '2025-07-30.basil',
    });
};
// Configurar Express app para endpoints HTTP
const app = express.default();
app.use(cors.default({ origin: true }));
app.use(express.json());
// ========================================
// CREAR PAYMENT INTENT (Pago único)
// ========================================
exports.createPaymentIntent = functions
    .region('europe-west1')
    .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB',
})
    .https.onCall(async (data, context) => {
    const stripe = getStripeInstance();
    try {
        // Verificar autenticación
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }
        const { amount, currency = 'chf', description, metadata } = data;
        // Validar datos
        if (!amount || amount <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Monto inválido');
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
            // Habilitar métodos de pago automáticamente
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    }
    catch (error) {
        console.error('Error creando PaymentIntent:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error al crear el pago');
    }
});
// ========================================
// CREAR SUSCRIPCIÓN
// ========================================
exports.createSubscription = functions
    .region('europe-west1')
    .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB',
})
    .https.onCall(async (data, context) => {
    const stripe = getStripeInstance();
    try {
        // Verificar autenticación
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }
        const { planId, planType, customerEmail } = data;
        // Validar datos
        if (!planId || !planType) {
            throw new functions.https.HttpsError('invalid-argument', 'Datos de suscripción inválidos');
        }
        const userId = context.auth.uid;
        // Obtener o crear cliente de Stripe
        let customerId;
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (userData?.stripeCustomerId) {
            customerId = userData.stripeCustomerId;
        }
        else {
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
        const prices = {
            standard: {
                monthly: 9.99,
                yearly: 99.99,
            },
        };
        const planPrices = prices.standard || { monthly: 9.99, yearly: 99.99 };
        const price = planType === 'monthly'
            ? planPrices.monthly
            : planPrices.yearly;
        // Crear precio en Stripe primero
        const priceObj = await stripe.prices.create({
            currency: 'chf',
            unit_amount: Math.round(price * 100),
            recurring: {
                interval: planType === 'monthly' ? 'month' : 'year',
            },
            product_data: {
                name: `LUCA App - ${planType === 'monthly' ? 'Plan Mensuel' : 'Plan Annuel'}`,
            },
        });
        // Crear suscripción en Stripe
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceObj.id }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
        });
        // Obtener client secret del PaymentIntent
        // El invoice ya está expandido, pero necesitamos obtener el payment_intent
        const invoiceId = typeof subscription.latest_invoice === 'string'
            ? subscription.latest_invoice
            : subscription.latest_invoice?.id;
        if (!invoiceId) {
            throw new Error('No se pudo obtener el invoice');
        }
        const invoice = await stripe.invoices.retrieve(invoiceId, {
            expand: ['payment_intent'],
        });
        const paymentIntent = invoice.payment_intent;
        if (!paymentIntent || typeof paymentIntent === 'string') {
            throw new Error('No se pudo obtener el payment intent');
        }
        return {
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
        };
    }
    catch (error) {
        console.error('Error creando suscripción:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error al crear la suscripción');
    }
});
// ========================================
// CANCELAR SUSCRIPCIÓN
// ========================================
exports.cancelSubscription = functions
    .region('europe-west1')
    .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB',
})
    .https.onCall(async (data, context) => {
    const stripe = getStripeInstance();
    try {
        // Verificar autenticación
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }
        const { subscriptionId } = data;
        if (!subscriptionId) {
            throw new functions.https.HttpsError('invalid-argument', 'ID de suscripción no proporcionado');
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
    }
    catch (error) {
        console.error('Error cancelando suscripción:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Error al cancelar la suscripción');
    }
});
// ========================================
// WEBHOOK DE STRIPE
// ========================================
exports.stripeWebhook = functions
    .region('europe-west1')
    .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB',
})
    .https.onRequest(async (req, res) => {
    const stripe = getStripeInstance();
    const sig = req.headers['stripe-signature'];
    if (!sig || typeof sig !== 'string') {
        res.status(400).send('No signature');
        return;
    }
    let event;
    // Obtener webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
        console.error('❌ STRIPE_WEBHOOK_SECRET no configurada');
        res.status(500).send('Webhook secret not configured');
        return;
    }
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Procesar evento
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                await handlePaymentIntentSucceeded(paymentIntent);
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                await handlePaymentIntentFailed(paymentIntent);
                break;
            }
            case 'invoice.paid': {
                const invoice = event.data.object;
                await handleInvoicePaid(invoice);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handleInvoicePaymentFailed(invoice);
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdated(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionDeleted(subscription);
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send(`Webhook Error: ${error.message}`);
    }
});
// ========================================
// FUNCIONES AUXILIARES PARA WEBHOOKS
// ========================================
async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);
    const userId = paymentIntent.metadata.userId;
    const offerId = paymentIntent.metadata.offerId;
    if (!userId)
        return;
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
async function handlePaymentIntentFailed(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);
    const userId = paymentIntent.metadata.userId;
    if (!userId)
        return;
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
async function handleInvoicePaid(invoice) {
    console.log('Invoice paid:', invoice.id);
    const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id || '';
    // Obtener subscriptionId desde el invoice, puede estar expandido o ser un string
    let subscriptionId = '';
    const invoiceSubscription = invoice.subscription;
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
    if (!userDoc)
        return;
    const userId = userDoc.id;
    // Obtener detalles de la suscripción desde Stripe
    const stripe = getStripeInstance();
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
async function handleInvoicePaymentFailed(invoice) {
    console.log('Invoice payment failed:', invoice.id);
    const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id || '';
    if (!customerId)
        return;
    // Buscar usuario
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
    if (snapshot.empty)
        return;
    const userDoc = snapshot.docs[0];
    if (!userDoc)
        return;
    const userId = userDoc.id;
    // Actualizar estado (período de gracia)
    await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: 'past_due',
        lastPaymentError: invoice.last_finalization_error?.message || 'Payment failed',
    });
}
async function handleSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', subscription.id);
    const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || '';
    if (!customerId)
        return;
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
    if (snapshot.empty)
        return;
    const userDoc = snapshot.docs[0];
    if (!userDoc)
        return;
    const userId = userDoc.id;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status,
        subscriptionEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
    });
}
async function handleSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id);
    const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id || '';
    if (!customerId)
        return;
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
    if (snapshot.empty)
        return;
    const userDoc = snapshot.docs[0];
    if (!userDoc)
        return;
    const userId = userDoc.id;
    await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: 'cancelled',
        subscriptionEnd: admin.firestore.FieldValue.serverTimestamp(),
    });
}
// ========================================
// TAREA PROGRAMADA: VERIFICAR SUSCRIPCIONES EXPIRADAS
// ========================================
exports.checkExpiredSubscriptions = functions
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
    }
    else {
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
        const stripe = getStripeInstance();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
            metadata,
        });
        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.api = functions
    .region('europe-west1')
    .runWith({
    secrets: ['STRIPE_SECRET_KEY'],
    timeoutSeconds: 300,
    memory: '256MB',
})
    .https.onRequest(app);
//# sourceMappingURL=index.js.map