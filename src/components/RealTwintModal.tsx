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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close,
  QrCode,
  Payment,
  CheckCircle,
  Error,
  AccessTime,
  Smartphone,
} from '@mui/icons-material';
import { twintRealService, type TwintPaymentRequest, type TwintPaymentStatus } from '../services/twintRealService';

interface RealTwintModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  customerEmail?: string;
  customerPhone?: string;
}

export const RealTwintModal: React.FC<RealTwintModalProps> = ({
  open,
  onClose,
  onSuccess,
  amount,
  currency,
  description,
  orderId,
  customerEmail,
  customerPhone,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<TwintPaymentStatus | null>(null);
  const [polling, setPolling] = useState(false);

  // Limpiar estado al abrir/cerrar modal
  useEffect(() => {
    if (open) {
      setSelectedMethod('');
      setPaymentId('');
      setQrCode('');
      setRedirectUrl('');
      setError('');
      setPaymentStatus(null);
      setPolling(false);
    }
  }, [open]);

  // Polling para verificar estado del pago
  useEffect(() => {
    if (!polling || !paymentId) return;

    const interval = setInterval(async () => {
      try {
        const status = await twintRealService.checkPaymentStatus(paymentId);
        setPaymentStatus(status);

        if (status.status === 'completed') {
          setPolling(false);
          onSuccess(paymentId);
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          setPolling(false);
          setError('El pago fue cancelado o falló');
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }, 2000); // Verificar cada 2 segundos

    return () => clearInterval(interval);
  }, [polling, paymentId, onSuccess]);

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setError('');
  };

  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentRequest: TwintPaymentRequest = {
        amount,
        currency,
        orderId,
        description,
        customerEmail,
        customerPhone,
      };

      const response = await twintRealService.createPayment(paymentRequest);

      if (response.success) {
        setPaymentId(response.paymentId);
        
        if (response.qrCode) {
          setQrCode(response.qrCode);
        }
        
        if (response.redirectUrl) {
          setRedirectUrl(response.redirectUrl);
        }

        // Iniciar polling para verificar estado
        setPolling(true);
      } else {
        setError(response.error || 'Error al crear el pago');
      }
    } catch (err) {
      setError('Error al procesar el pago');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTwintApp = () => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
  };

  const getStatusIcon = () => {
    if (!paymentStatus) return <AccessTime />;
    
    switch (paymentStatus.status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
      case 'cancelled':
        return <Error color="error" />;
      default:
        return <AccessTime color="warning" />;
    }
  };

  const getStatusText = () => {
    if (!paymentStatus) return 'Preparando pago...';
    
    switch (paymentStatus.status) {
      case 'pending':
        return 'Esperando confirmación...';
      case 'completed':
        return '¡Pago completado!';
      case 'failed':
        return 'El pago falló';
      case 'cancelled':
        return 'Pago cancelado';
      default:
        return 'Estado desconocido';
    }
  };

  const availableMethods = twintRealService.getAvailablePaymentMethods();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #FFD700 0%, #FFFF00 100%)',
        color: 'black',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Smartphone />
          Pago con TWINT
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Información del pago */}
        <Card sx={{ 
          mb: 3, 
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #333'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
              Resumen del Pago
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Descripción:</Typography>
              <Typography>{description}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>ID de Pedido:</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{orderId}</Typography>
            </Box>
            <Divider sx={{ my: 1, bgcolor: '#333' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: '#FFD700' }}>Total:</Typography>
              <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                {amount} {currency}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Selección de método de pago */}
        {!paymentId && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#FFD700', mb: 2 }}>
              Selecciona tu método de pago TWINT
            </Typography>
            <List>
              {availableMethods.map((method) => (
                <ListItem
                  key={method.id}
                  component="div"
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  sx={{
                    border: selectedMethod === method.id ? '2px solid #FFD700' : '1px solid #333',
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: selectedMethod === method.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(255, 215, 0, 0.05)',
                    }
                  }}
                >
                  <ListItemIcon>
                    <Typography sx={{ fontSize: '1.5rem' }}>
                      {method.icon}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={method.name}
                    secondary={method.description}
                    primaryTypographyProps={{ color: 'white' }}
                    secondaryTypographyProps={{ color: '#bbb' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* QR Code */}
        {qrCode && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
              Escanea con TWINT
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              p: 2,
              bgcolor: 'white',
              borderRadius: 2,
              mb: 2
            }}>
              <img 
                src={qrCode} 
                alt="TWINT QR Code" 
                style={{ maxWidth: '200px', height: 'auto' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#bbb' }}>
              Abre la app TWINT y escanea este código QR
            </Typography>
          </Box>
        )}

        {/* Redirect URL */}
        {redirectUrl && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
              Pago Web TWINT
            </Typography>
            <Button
              variant="contained"
              onClick={handleOpenTwintApp}
              startIcon={<Payment />}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFFF00 100%)',
                color: 'black',
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
                }
              }}
            >
              Abrir TWINT Web
            </Button>
          </Box>
        )}

        {/* Estado del pago */}
        {paymentStatus && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              {getStatusIcon()}
              <Typography variant="h6" sx={{ ml: 1, color: 'white' }}>
                {getStatusText()}
              </Typography>
            </Box>
            {paymentStatus.status === 'pending' && (
              <CircularProgress size={24} sx={{ color: '#FFD700' }} />
            )}
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
          sx={{ 
            borderColor: '#666',
            color: 'white',
            '&:hover': {
              borderColor: '#FFD700',
              color: '#FFD700'
            }
          }}
        >
          Cancelar
        </Button>
        
        {!paymentId && (
          <Button
            onClick={handleCreatePayment}
            disabled={!selectedMethod || loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <QrCode />}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFFF00 100%)',
              color: 'black',
              px: 4,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFA500 0%, #FFD700 100%)',
              },
              '&:disabled': {
                background: '#666',
                color: '#999'
              }
            }}
          >
            {loading ? 'Procesando...' : 'Pagar con TWINT'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
