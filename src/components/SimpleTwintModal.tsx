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
  Error,
  Smartphone,
} from '@mui/icons-material';

interface SimpleTwintModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  customerEmail?: string;
}

export const SimpleTwintModal: React.FC<SimpleTwintModalProps> = ({
  open,
  onClose,
  onSuccess,
  amount,
  currency,
  description,
  orderId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Limpiar estado al abrir/cerrar modal
  useEffect(() => {
    if (open) {
      setError('');
      setStatus('idle');
    }
  }, [open]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    setStatus('processing');

    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus('success');
      
      // Simular éxito después de 2 segundos
      setTimeout(() => {
        onSuccess(`twint_${Date.now()}`);
      }, 2000);
    } catch (err) {
      setError('Error al procesar el pago');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (status === 'success') {
      return <CheckCircle color="success" sx={{ fontSize: 40 }} />;
    }
    if (status === 'error') {
      return <Error color="error" sx={{ fontSize: 40 }} />;
    }
    if (status === 'processing') {
      return <CircularProgress size={40} sx={{ color: '#FFD700' }} />;
    }
    return <Payment sx={{ fontSize: 40, color: '#FFD700' }} />;
  };

  const getStatusText = () => {
    if (status === 'idle') {
      return 'Listo para pagar con TWINT';
    }
    if (status === 'processing') {
      return 'Procesando pago...';
    }
    if (status === 'success') {
      return '¡Pago completado!';
    }
    if (status === 'error') {
      return 'Error en el pago';
    }
    return 'Estado desconocido';
  };

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
                {amount} {currency.toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Estado del pago */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            {getStatusIcon()}
          </Box>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            {getStatusText()}
          </Typography>
          {status === 'processing' && (
            <Typography variant="body2" sx={{ color: '#bbb' }}>
              Por favor espera mientras procesamos tu pago...
            </Typography>
          )}
          {status === 'success' && (
            <Typography variant="body2" sx={{ color: '#4caf50' }}>
              Tu suscripción se ha activado correctamente
            </Typography>
          )}
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Información TWINT */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'rgba(255, 215, 0, 0.1)', 
          borderRadius: 2, 
          border: '1px solid #FFD700',
          textAlign: 'center'
        }}>
          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold', mb: 1 }}>
            💳 Pago con TWINT
          </Typography>
          <Typography variant="body2" sx={{ color: '#bbb' }}>
            {status === 'idle' && 'Haz clic en "Pagar" para procesar tu pago con TWINT'}
            {status === 'processing' && 'Procesando tu pago de forma segura...'}
            {status === 'success' && '¡Pago completado exitosamente!'}
            {status === 'error' && 'Hubo un error al procesar el pago'}
          </Typography>
        </Box>
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
        
        {status === 'idle' && (
          <Button
            onClick={handlePayment}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
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