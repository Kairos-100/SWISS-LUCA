// Servicio de integración directa con TWINT
// Integración real con TWINT a través de Datatrans

export interface TwintPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
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

class TwintRealService {
  private baseUrl = process.env.REACT_APP_TWINT_API_URL || 'https://api.datatrans.com';
  private merchantId = process.env.REACT_APP_TWINT_MERCHANT_ID || '';
  private apiKey = process.env.REACT_APP_TWINT_API_KEY || '';

  // Crear pago TWINT real
  async createPayment(request: TwintPaymentRequest): Promise<TwintPaymentResponse> {
    try {
      // En desarrollo, simulamos la respuesta
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePayment(request);
      }

      // En producción, hacer llamada real a la API de TWINT
      const response = await fetch(`${this.baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.merchantId}:${this.apiKey}`)}`,
        },
        body: JSON.stringify({
          amount: Math.round(request.amount * 100), // Convertir a centavos
          currency: request.currency.toUpperCase(),
          orderId: request.orderId,
          description: request.description,
          paymentMethod: 'TWINT',
          customer: {
            email: request.customerEmail,
            phone: request.customerPhone,
          },
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        paymentId: data.paymentId,
        qrCode: data.qrCode,
        redirectUrl: data.redirectUrl,
      };
    } catch (error) {
      console.error('Error creating TWINT payment:', error);
      return {
        success: false,
        paymentId: '',
        error: 'Error al crear el pago con TWINT'
      };
    }
  }

  // Verificar estado del pago TWINT
  async checkPaymentStatus(paymentId: string): Promise<TwintPaymentStatus> {
    try {
      // En desarrollo, simulamos el estado
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePaymentStatus(paymentId);
      }

      // En producción, hacer llamada real a la API de TWINT
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.merchantId}:${this.apiKey}`)}`,
        },
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
      };
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
      amount: 9.99,
      currency: 'CHF',
      timestamp: new Date(),
      transactionId: status === 'completed' ? `txn_${Date.now()}` : undefined,
    };
  }

  // Generar código QR simulado
  private generateQRCode(paymentId: string): string {
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
    return this.merchantId !== '' && this.apiKey !== '';
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

export const twintRealService = new TwintRealService();
