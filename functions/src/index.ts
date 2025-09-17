import * as functions from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors from 'cors';
import Stripe from 'stripe';

admin.initializeApp();

// Env vars expected: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const app = express();
app.use(cors({ origin: true }));

// Stripe webhook must receive the raw body
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      // TODO: actualizar Firestore usando pi.metadata
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

// JSON parser for the rest of endpoints
app.use(express.json());

// Create Payment Intent (CHF)
app.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amountCents, currency = 'chf', metadata } = req.body as {
      amountCents: number;
      currency?: string;
      metadata?: Record<string, string>;
    };

    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      // Enable automatic methods, including TWINT if enabled in Stripe
      automatic_payment_methods: { enabled: true },
      metadata: metadata as any,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    console.error('create-payment-intent error', err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook to confirm payment
// ---- Payrexx endpoints ----
const PAYREXX_INSTANCE = defineSecret('PAYREXX_INSTANCE');
const PAYREXX_API_KEY = defineSecret('PAYREXX_API_KEY');

app.post('/create-payrexx-gateway', async (req: Request, res: Response) => {
  try {
    const { amountCents, currency = 'CHF', referenceId, purpose = 'LUCA Payment', pm = ['applepay'], successUrl, failedUrl, cancelUrl } = req.body as any;

    if (!amountCents || !referenceId) {
      return res.status(400).json({ error: 'amountCents and referenceId are required' });
    }

    const instance = process.env.PAYREXX_INSTANCE as string;
    const apiKey = process.env.PAYREXX_API_KEY as string;

    const url = `https://${instance}.payrexx.com/api/v1.0/Gateway`; 
    const payload = {
      amount: amountCents,
      currency,
      referenceId,
      purpose,
      successRedirectUrl: successUrl,
      failedRedirectUrl: failedUrl,
      cancelRedirectUrl: cancelUrl,
      pm,
    } as any;

    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) {
      if (Array.isArray(v)) {
        v.forEach((vv) => form.append(`${k}[]`, String(vv)));
      } else if (v !== undefined && v !== null) {
        form.append(k, String(v));
      }
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const data = await resp.json();
    if (!data || !data.data || !data.data[0] || !data.data[0].link) {
      console.error('Unexpected Payrexx response', data);
      return res.status(500).json({ error: 'Payrexx error', details: data });
    }
    const link = data.data[0].link as string;
    res.json({ checkoutUrl: link });
  } catch (err: any) {
    console.error('create-payrexx-gateway error', err);
    res.status(500).json({ error: err.message });
  }
});

export const api = functions.https.onRequest({ region: 'europe-west4', secrets: [PAYREXX_INSTANCE, PAYREXX_API_KEY] }, app);


