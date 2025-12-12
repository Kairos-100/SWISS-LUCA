/**
 * FIREBASE CLOUD FUNCTIONS - LUCA APP
 *
 * Funciones para procesar pagos, suscripciones y webhooks de Stripe
 */
import * as functions from 'firebase-functions/v1';
export declare const createPaymentIntent: functions.HttpsFunction & functions.Runnable<any>;
export declare const createSubscription: functions.HttpsFunction & functions.Runnable<any>;
export declare const cancelSubscription: functions.HttpsFunction & functions.Runnable<any>;
export declare const checkPaymentStatus: functions.HttpsFunction & functions.Runnable<any>;
export declare const stripeWebhook: functions.HttpsFunction;
export declare const checkExpiredSubscriptions: functions.CloudFunction<unknown>;
export declare const api: functions.HttpsFunction;
export declare const createAdmin: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=index.d.ts.map