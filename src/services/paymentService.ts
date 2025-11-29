/**
 * SERVICIO UNIFICADO DE PAGOS - LUCA APP
 * 
 * Este servicio unifica todos los métodos de pago en un solo lugar.
 * Soporta Stripe (con TWINT) como método principal.
 * 
 * IMPORTANTE: Configurar las claves de Stripe en .env
 */

import { loadStripe, type Stripe, type StripeElements, type StripePaymentElement } from '@stripe/stripe-js';

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  userId: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  clientSecret?: string;
  error?: string;
  errorCode?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  timestamp: Date;
  transactionId?: string;
  errorMessage?: string;
}

export interface SubscriptionRequest {
  userId: string;
  planId: string;
  planType: 'monthly' | 'yearly';
  customerEmail: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  clientSecret?: string;
  error?: string;
}

// ========================================
// CONFIGURACIÓN
// ========================================

const config = {
  stripePublishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  isTestMode: process.env.REACT_APP_PAYMENT_TEST_MODE === 'true',
};

// ========================================
// CLASE PRINCIPAL
// ========================================

class PaymentService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;
  private initialized = false;

  /**
   * Inicializar Stripe
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (!config.stripePublishableKey) {
        console.error('❌ Stripe publishable key no configurada');
        console.error('Por favor, configura REACT_APP_STRIPE_PUBLISHABLE_KEY en tu archivo .env');
        return false;
      }

      this.stripe = await loadStripe(config.stripePublishableKey);
      
      if (!this.stripe) {
        console.error('❌ Error al cargar Stripe');
        return false;
      }

      this.initialized = true;
      console.log('✅ Stripe inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar Stripe:', error);
      return false;
    }
  }

  /**
   * Crear Payment Intent para una compra única
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // En modo de prueba, simular
      if (config.isTestMode && process.env.NODE_ENV === 'development') {
        console.log('🧪 Modo de prueba: Simulando pago');
        return this.simulatePayment(request);
      }

      // Validar que el servicio esté inicializado
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: 'Servicio de pagos no disponible'
          };
        }
      }

      // Llamar al backend para crear el PaymentIntent
      const response = await fetch(`${config.apiUrl}/api/create-payment-intent`, {
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
            userId: request.userId,
            ...request.metadata,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        paymentId: data.paymentIntentId,
        clientSecret: data.clientSecret,
      };
    } catch (error) {
      console.error('❌ Error al crear pago:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear el pago'
      };
    }
  }

  /**
   * Crear suscripción mensual o anual
   */
  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    try {
      // En modo de prueba, simular
      if (config.isTestMode && process.env.NODE_ENV === 'development') {
        console.log('🧪 Modo de prueba: Simulando suscripción');
        return this.simulateSubscription(request);
      }

      // Validar que el servicio esté inicializado
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) {
          return {
            success: false,
            error: 'Servicio de pagos no disponible'
          };
        }
      }

      // Llamar al backend para crear la suscripción
      const response = await fetch(`${config.apiUrl}/api/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        subscriptionId: data.subscriptionId,
        clientSecret: data.clientSecret,
      };
    } catch (error) {
      console.error('❌ Error al crear suscripción:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear la suscripción'
      };
    }
  }

  /**
   * Configurar elementos de pago de Stripe
   */
  async setupPaymentElements(containerId: string, clientSecret: string): Promise<boolean> {
    if (!this.stripe) {
      console.error('❌ Stripe no inicializado');
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
      console.error('❌ Error al configurar elementos de pago:', error);
      return false;
    }
  }

  /**
   * Confirmar pago
   */
  async confirmPayment(returnUrl?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.stripe || !this.elements) {
      return { success: false, error: 'Stripe no inicializado' };
    }

    try {
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error al confirmar pago:', error);
      return { success: false, error: 'Error al confirmar el pago' };
    }
  }

  /**
   * Verificar estado de un pago
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // En modo de prueba, simular
      if (config.isTestMode && process.env.NODE_ENV === 'development') {
        return this.simulatePaymentStatus(paymentId);
      }

      const response = await fetch(`${config.apiUrl}/api/payment-status/${paymentId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        paymentId: data.paymentId,
        status: data.status,
        amount: data.amount / 100, // Convertir de centavos
        currency: data.currency,
        timestamp: new Date(data.timestamp),
        transactionId: data.transactionId,
        errorMessage: data.errorMessage,
      };
    } catch (error) {
      console.error('❌ Error al verificar estado de pago:', error);
      return {
        paymentId,
        status: 'failed',
        amount: 0,
        currency: 'chf',
        timestamp: new Date(),
        errorMessage: 'Error al verificar el estado del pago',
      };
    }
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${config.apiUrl}/api/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error al cancelar suscripción:', error);
      return false;
    }
  }

  /**
   * Limpiar elementos
   */
  cleanup() {
    if (this.paymentElement) {
      this.paymentElement.unmount();
      this.paymentElement = null;
    }
    if (this.elements) {
      this.elements = null;
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  isAvailable(): boolean {
    return !!config.stripePublishableKey && this.initialized;
  }

  /**
   * Obtener métodos de pago disponibles
   */
  getAvailablePaymentMethods() {
    return [
      {
        id: 'card',
        name: 'Carte de crédit',
        description: 'Visa, Mastercard, Amex',
        icon: '💳',
        supported: true,
      },
      {
        id: 'twint',
        name: 'TWINT',
        description: 'Paiement mobile suisse',
        icon: '📱',
        supported: true,
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        description: 'Paiement rapide et sécurisé',
        icon: '🍎',
        supported: true,
      },
    ];
  }

  // ========================================
  // MÉTODOS PRIVADOS (SIMULACIÓN)
  // ========================================

  private simulatePayment(_request: PaymentRequest): PaymentResponse {
    const paymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${paymentId}_secret_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🧪 Pago simulado creado:', { paymentId, clientSecret });
    
    return {
      success: true,
      paymentId,
      clientSecret,
    };
  }

  private simulateSubscription(_request: SubscriptionRequest): SubscriptionResponse {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${subscriptionId}_secret_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🧪 Suscripción simulada creada:', { subscriptionId, clientSecret });
    
    return {
      success: true,
      subscriptionId,
      clientSecret,
    };
  }

  private simulatePaymentStatus(paymentId: string): PaymentStatus {
    const statuses: Array<'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'> = 
      ['pending', 'processing', 'succeeded'];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      paymentId,
      status,
      amount: 9.99,
      currency: 'chf',
      timestamp: new Date(),
      transactionId: status === 'succeeded' ? `txn_${Date.now()}` : undefined,
    };
  }
}

// ========================================
// EXPORTAR INSTANCIA SINGLETON
// ========================================

export const paymentService = new PaymentService();

// Inicializar automáticamente
if (typeof window !== 'undefined') {
  paymentService.initialize().catch(console.error);
}

export default paymentService;

