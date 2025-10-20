/**
 * @deprecated Este archivo está DEPRECADO
 * 
 * Usar en su lugar: src/services/paymentService.ts
 * 
 * Este archivo se mantiene solo por compatibilidad temporal,
 * pero NO debe usarse en nuevo código.
 */

// Servicio de integración con TWINT para pagos
// Integración real con Stripe + TWINT

export interface TwintPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface TwintPaymentResponse {
  success: boolean;
  paymentId: string;
  qrCode?: string;
  redirectUrl?: string;
  error?: string;
}

export interface TwintPaymentStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  timestamp: Date;
  transactionId?: string;
}

class TwintService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Simular creación de pago TWINT
  async createPayment(request: TwintPaymentRequest): Promise<TwintPaymentResponse> {
    try {
      // En desarrollo, simulamos la respuesta
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePayment(request);
      }

      // En producción, hacer llamada real a la API
      const response = await fetch(`${this.baseUrl}/api/create-payment-intent`, {
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
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating TWINT payment:', error);
      return {
        success: false,
        paymentId: '',
        error: 'Error al crear el pago con TWINT'
      };
    }
  }

  // Simular verificación de estado de pago
  async checkPaymentStatus(paymentId: string): Promise<TwintPaymentStatus> {
    try {
      // En desarrollo, simulamos el estado
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePaymentStatus(paymentId);
      }

      // En producción, hacer llamada real a la API
      const response = await fetch(`${this.baseUrl}/api/payment-status/${paymentId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking TWINT payment status:', error);
      return {
        paymentId,
        status: 'failed',
        amount: 0,
        currency: 'CHF',
        timestamp: new Date(),
      };
    }
  }

  // Simular pago para desarrollo
  private simulatePayment(_request: TwintPaymentRequest): TwintPaymentResponse {
    const paymentId = `twint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simular diferentes escenarios
    const scenarios = [
      { success: true, hasQrCode: true },
      { success: true, hasQrCode: false },
      { success: false, error: 'Fondos insuficientes' },
    ];
    
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    if (scenario.success) {
      return {
        success: true,
        paymentId,
        qrCode: scenario.hasQrCode ? this.generateQRCode(paymentId) : undefined,
        redirectUrl: scenario.hasQrCode ? undefined : `${this.baseUrl}/pay/${paymentId}`,
      };
    } else {
      return {
        success: false,
        paymentId: '',
        error: scenario.error,
      };
    }
  }

  // Simular estado de pago para desarrollo
  private simulatePaymentStatus(paymentId: string): TwintPaymentStatus {
    const statuses: Array<'pending' | 'completed' | 'failed' | 'cancelled'> = 
      ['pending', 'completed', 'failed', 'cancelled'];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      paymentId,
      status,
      amount: 9.99, // Monto de ejemplo
      currency: 'CHF',
      timestamp: new Date(),
      transactionId: status === 'completed' ? `txn_${Date.now()}` : undefined,
    };
  }

  // Generar código QR simulado
  private generateQRCode(paymentId: string): string {
    // En desarrollo, devolvemos un QR code simulado
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">
          TWINT QR: ${paymentId}
        </text>
        <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="10">
          Escanea con TWINT
        </text>
      </svg>
    `)}`;
  }

  // Validar si TWINT está disponible
  isAvailable(): boolean {
    return true; // En desarrollo siempre disponible
  }

  // Obtener métodos de pago TWINT disponibles
  getAvailablePaymentMethods() {
    return [
      {
        id: 'twint_qr',
        name: 'TWINT QR Code',
        description: 'Escanea el código QR con la app TWINT',
        icon: '📱',
      },
      {
        id: 'twint_redirect',
        name: 'TWINT Web',
        description: 'Paga directamente en la web de TWINT',
        icon: '🌐',
      },
    ];
  }
}

export const twintService = new TwintService();
