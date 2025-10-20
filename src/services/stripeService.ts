/**
 * @deprecated Este archivo está DEPRECADO
 * 
 * Usar en su lugar: src/services/paymentService.ts
 * 
 * Este archivo se mantiene solo por compatibilidad temporal,
 * pero NO debe usarse en nuevo código.
 */

// Servicio de integración con Stripe para pagos TWINT
import { loadStripe, type Stripe, type StripeElements, type StripePaymentElement } from '@stripe/stripe-js';

export interface StripePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  customerEmail?: string;
}

export interface StripePaymentResponse {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export interface StripePaymentStatus {
  paymentIntentId: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  amount: number;
  currency: string;
  lastPaymentError?: string;
}

class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;
  private publishableKey: string;

  constructor() {
    // En producción, esto debería venir de variables de entorno
    this.publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo_key';
  }

  // Inicializar Stripe
  async initialize(): Promise<boolean> {
    try {
      this.stripe = await loadStripe(this.publishableKey);
      return this.stripe !== null;
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return false;
    }
  }

  // Crear Payment Intent con TWINT
  async createPaymentIntent(request: StripePaymentRequest): Promise<StripePaymentResponse> {
    try {
      // En desarrollo, simulamos la respuesta
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePaymentIntent(request);
      }

      // En producción, hacer llamada real a tu backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(request.amount * 100), // Convertir a centavos
          currency: request.currency.toLowerCase(),
          description: request.description,
          metadata: {
            orderId: request.orderId,
            customerEmail: request.customerEmail,
          },
          payment_method_types: ['twint'],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        paymentIntentId: data.paymentIntentId,
        clientSecret: data.clientSecret,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: 'Error al crear el pago con TWINT'
      };
    }
  }

  // Configurar Elements para TWINT
  async setupElements(containerId: string, clientSecret: string): Promise<boolean> {
    if (!this.stripe) {
      console.error('Stripe not initialized');
      return false;
    }

    try {
      this.elements = this.stripe.elements({
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#FFD700',
            colorBackground: '#1a1a1a',
            colorText: '#ffffff',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      });

      this.paymentElement = this.elements.create('payment', {
        layout: 'tabs',
      });

      this.paymentElement.mount(`#${containerId}`);
      return true;
    } catch (error) {
      console.error('Error setting up elements:', error);
      return false;
    }
  }

  // Confirmar pago
  async confirmPayment(): Promise<{ success: boolean; error?: string }> {
    if (!this.stripe || !this.elements) {
      return { success: false, error: 'Stripe not initialized' };
    }

    try {
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/return`,
        },
        redirect: 'if_required',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: 'Error al confirmar el pago' };
    }
  }

  // Verificar estado del pago
  async checkPaymentStatus(paymentIntentId: string): Promise<StripePaymentStatus> {
    try {
      // En desarrollo, simulamos el estado
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePaymentStatus(paymentIntentId);
      }

      // En producción, hacer llamada real a tu backend
      const response = await fetch(`/api/payment-status/${paymentIntentId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        paymentIntentId,
        status: 'canceled',
        amount: 0,
        currency: 'chf',
        lastPaymentError: 'Error al verificar el estado del pago',
      };
    }
  }

  // Limpiar elementos
  cleanup() {
    if (this.paymentElement) {
      this.paymentElement.unmount();
      this.paymentElement = null;
    }
    if (this.elements) {
      this.elements = null;
    }
  }

  // Simular Payment Intent para desarrollo
  private simulatePaymentIntent(_request: StripePaymentRequest): StripePaymentResponse {
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      paymentIntentId,
      clientSecret,
    };
  }

  // Simular estado de pago para desarrollo
  private simulatePaymentStatus(paymentIntentId: string): StripePaymentStatus {
    const statuses: Array<'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'> = 
      ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled'];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      paymentIntentId,
      status,
      amount: 999, // 9.99 CHF en centavos
      currency: 'chf',
      lastPaymentError: status === 'canceled' ? 'Pago cancelado por el usuario' : undefined,
    };
  }

  // Verificar si TWINT está disponible
  isTwintAvailable(): boolean {
    return this.stripe !== null;
  }

  // Obtener métodos de pago disponibles
  getAvailablePaymentMethods() {
    return [
      {
        id: 'twint',
        name: 'TWINT',
        description: 'Paga con tu app TWINT',
        icon: '📱',
        supported: true,
      },
    ];
  }
}

export const stripeService = new StripeService();
