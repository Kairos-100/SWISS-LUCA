"use strict";
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
exports.api = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const stripe_1 = __importDefault(require("stripe"));
admin.initializeApp();
// Env vars expected: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Create Payment Intent (CHF)
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amountCents, currency = 'chf', metadata } = req.body;
        if (!amountCents || amountCents <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency,
            // Enable automatic methods, including TWINT if enabled in Stripe
            automatic_payment_methods: { enabled: true },
            metadata: metadata,
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    }
    catch (err) {
        console.error('create-payment-intent error', err);
        res.status(500).json({ error: err.message });
    }
});
// Stripe webhook to confirm payment
app.post('/stripe-webhook', express_1.default.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const pi = event.data.object;
            // Optionally update Firestore here using pi.metadata (offerId, userId, etc.)
            break;
        }
        default:
            break;
    }
    res.json({ received: true });
});
exports.api = functions.https.onRequest({ region: 'europe-west4' }, app);
//# sourceMappingURL=index.js.map