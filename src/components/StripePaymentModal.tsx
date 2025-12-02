import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close,
  Payment,
  CheckCircle,
} from '@mui/icons-material';
import { paymentService } from '../services/paymentService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';
import { useTranslation } from 'react-i18next';

interface StripePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  userId: string;
  customerEmail?: string;
  type: 'payment' | 'subscription';
  planType?: 'monthly' | 'yearly';
  planId?: string;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  open,
  onClose,
  onSuccess,
  amount,
  currency,
  description,
  orderId,
  userId,
  customerEmail,
  type,
  planType,
  planId,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [paymentElementMounted, setPaymentElementMounted] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Limpiar estado al abrir/cerrar modal
  useEffect(() => {
    if (open) {
      setError('');
      setClientSecret('');
      setPaymentId('');
      setPaymentElementMounted(false);
      setPaymentConfirmed(false);
      paymentService.cleanup();
    } else {
      paymentService.cleanup();
    }
  }, [open]);

  // Crear Payment Intent o Subscription
  useEffect(() => {
    if (!open || !userId) return;

    const createPayment = async () => {
      setLoading(true);
      setError('');

      try {
        // Inicializar Stripe
        const initialized = await paymentService.initialize();
        if (!initialized) {
          // Check if Stripe key is configured
          const stripeKey = (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY || 
                          (import.meta as any)?.env?.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
                          (typeof process !== 'undefined' ? process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY : '');
          if (!stripeKey) {
            throw new Error(t('stripeKeyNotConfigured'));
          }
          throw new Error(t('cannotInitializePayment'));
        }

        let response: {
          success: boolean;
          clientSecret?: string;
          paymentId?: string;
          error?: string;
        };

        if (type === 'subscription') {
          // Crear suscripción usando Firebase Functions (región europe-west1)
          const functions = getFunctions(app, 'europe-west1');
          const createSubscription = httpsCallable(functions, 'createSubscription');
          
          const result = await createSubscription({
            planId: planId || 'standard',
            planType: planType || 'monthly',
            customerEmail: customerEmail,
          });

          const data = result.data as { subscriptionId: string; clientSecret: string };
          response = {
            success: true,
            clientSecret: data.clientSecret,
            paymentId: data.subscriptionId,
          };
        } else {
          // Crear Payment Intent usando Firebase Functions (región europe-west1)
          const functions = getFunctions(app, 'europe-west1');
          const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
          
          const result = await createPaymentIntent({
            amount: Math.round(amount * 100), // Convertir a centavos
            currency: currency.toLowerCase(),
            description: description,
            metadata: {
              orderId: orderId,
              offerId: orderId,
            },
          });

          const data = result.data as { clientSecret: string; paymentIntentId: string };
          response = {
            success: true,
            clientSecret: data.clientSecret,
            paymentId: data.paymentIntentId,
          };
        }

        if (response.success && response.clientSecret && response.paymentId) {
          setClientSecret(response.clientSecret);
          setPaymentId(response.paymentId);
          
          // Configurar elementos de pago de Stripe
          const containerId = 'stripe-payment-element';
          const mounted = await paymentService.setupPaymentElements(containerId, response.clientSecret);
          
          if (mounted) {
            setPaymentElementMounted(true);
          } else {
            throw new Error(t('cannotSetupPaymentForm'));
          }
        } else {
          throw new Error(response.error || t('errorCreatingPayment'));
        }
      } catch (err: any) {
        console.error('Error creando pago:', err);
        setError(err.message || t('errorProcessingPayment'));
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [open, userId, type, amount, currency, description, orderId, customerEmail, planType, planId, t]);

  const handleConfirmPayment = async () => {
    if (!clientSecret) {
      setError(t('paymentNotConfigured'));
      return;
    }

    if (!paymentId) {
      setError(t('paymentIdNotAvailable'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await paymentService.confirmPayment(
        `${window.location.origin}/payment/success?payment_intent=${paymentId}`
      );

      if (result.success) {
        setPaymentConfirmed(true);
        // Verificar el estado del pago antes de cerrar
        try {
          const status = await paymentService.checkPaymentStatus(paymentId);
          if (status.status === 'succeeded' || status.status === 'processing') {
            // Esperar un momento antes de cerrar y llamar onSuccess
            setTimeout(() => {
              onSuccess(paymentId);
              onClose();
            }, 1500);
          } else {
            // Si el pago no se completó, mostrar error
            setError(t('paymentNotCompleted'));
            setPaymentConfirmed(false);
            setLoading(false);
          }
        } catch (statusError) {
          // Si no se puede verificar el estado, asumir éxito (puede ser un problema de red)
          console.warn(t('cannotVerifyPaymentStatus'), statusError);
          setTimeout(() => {
            onSuccess(paymentId);
            onClose();
          }, 1500);
        }
      } else {
        setError(result.error || t('errorConfirmingPayment'));
      }
    } catch (err: any) {
      console.error('Error confirmando pago:', err);
      setError(err.message || t('errorConfirmingPayment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
        color: '#000000',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {t('securePayment')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Información del pago */}
        <Card sx={{ 
          mb: 3, 
          background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
              {t('paymentSummary')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: '#FFFFFF' }}>{t('description')}</Typography>
              <Typography sx={{ color: '#FFFFFF' }}>{description}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: '#FFFFFF' }}>{t('orderId')}</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#FFFFFF' }}>
                {orderId.substring(0, 20)}...
              </Typography>
            </Box>
            <Divider sx={{ my: 1, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: '#FFD700' }}>{t('total')}</Typography>
              <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                {amount.toFixed(2)} {currency.toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Formulario de pago Stripe */}
        {loading && !paymentElementMounted && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: '#FFD700' }} />
          </Box>
        )}

        {paymentElementMounted && !paymentConfirmed && (
          <Box>
            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
              {t('selectPaymentMethod')}
            </Typography>
            <Box 
              id="stripe-payment-element"
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  borderColor: 'rgba(255, 215, 0, 0.5)',
                },
                '&:focus-within': {
                  borderColor: '#FFD700',
                  boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.2)',
                }
              }}
            />
          </Box>
        )}

        {/* Estado de confirmación */}
        {paymentConfirmed && (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <CheckCircle sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#4CAF50' }}>
              {t('paymentSuccessful')}
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={loading || paymentConfirmed}
          sx={{ 
            borderColor: '#FFD700',
            color: '#FFD700',
            '&:hover': {
              borderColor: '#FFA000',
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              boxShadow: '0 8px 25px rgba(255, 215, 0, 0.2)',
            }
          }}
        >
          {t('annuler')}
        </Button>
        
        {paymentElementMounted && !paymentConfirmed && (
          <Button
            onClick={handleConfirmPayment}
            disabled={loading || !clientSecret}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
              color: '#000000',
              px: 4,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
                boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#B0B0B0'
              }
            }}
          >
            {loading ? t('processing') : t('confirmPayment')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
