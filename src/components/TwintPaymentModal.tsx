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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close,
  QrCode,
  Payment,
  CheckCircle,
  Error,
  AccessTime,
} from '@mui/icons-material';
import { twintService, type TwintPaymentRequest, type TwintPaymentStatus } from '../services/twintService';

interface TwintPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
}

export const TwintPaymentModal: React.FC<TwintPaymentModalProps> = ({
  open,
  onClose,
  onSuccess,
  amount,
  currency,
  description,
  orderId,
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
        const status = await twintService.checkPaymentStatus(paymentId);
        setPaymentStatus(status);

        if (status.status === 'completed') {
          setPolling(false);
          onSuccess(paymentId);
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          setPolling(false);
          setError('Le paiement a été annulé ou a échoué');
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
      setError('Veuillez sélectionner un mode de paiement');
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
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      };

      const response = await twintService.createPayment(paymentRequest);

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
        setError(response.error || 'Erreur lors de la création du paiement');
      }
    } catch (err) {
      setError('Erreur lors du traitement du paiement');
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
    if (!paymentStatus) return 'Préparation du paiement...';
    
    switch (paymentStatus.status) {
      case 'pending':
        return 'En attente de confirmation...';
      case 'completed':
        return 'Paiement terminé !';
      case 'failed':
        return 'Le paiement a échoué';
      case 'cancelled':
        return 'Paiement annulé';
      default:
        return 'État inconnu';
    }
  };

  const availableMethods = twintService.getAvailablePaymentMethods();

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
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          💳 Paiement avec TWINT
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
              Résumé du paiement
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Description :</Typography>
              <Typography>{description}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>ID de commande :</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{orderId}</Typography>
            </Box>
            <Divider sx={{ my: 1, bgcolor: '#333' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: '#FFD700' }}>Total :</Typography>
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
              Sélectionnez votre mode de paiement TWINT
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
              Ouvrez l'application TWINT et scannez ce code QR
            </Typography>
          </Box>
        )}

        {/* Redirect URL */}
        {redirectUrl && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
              Paiement Web TWINT
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
              Ouvrir TWINT Web
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
          Annuler
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
            {loading ? 'Traitement...' : 'Payer avec TWINT'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
