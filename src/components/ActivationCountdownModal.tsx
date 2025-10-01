import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  FlashOn,
  AccessTime
} from '@mui/icons-material';

interface ActivationCountdownModalProps {
  open: boolean;
  onClose: () => void;
  onActivationComplete: () => void;
  offerName: string;
  countdownSeconds?: number; // Por defecto 60 segundos (1 minuto)
}

export const ActivationCountdownModal: React.FC<ActivationCountdownModalProps> = ({
  open,
  onClose,
  onActivationComplete,
  offerName,
  countdownSeconds = 60
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [showLightning, setShowLightning] = useState(false);

  // Efecto para el temporizador
  useEffect(() => {
    if (!open) return;

    setTimeLeft(countdownSeconds);
    setShowLightning(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowLightning(true);
          // Después de 2 segundos de lightning, completar la activación
          setTimeout(() => {
            onActivationComplete();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, countdownSeconds, onActivationComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((countdownSeconds - timeLeft) / countdownSeconds) * 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      {/* Efecto de lightning cuando se completa */}
      {showLightning && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, #ffeb3b, #fff176, #ffeb3b)',
            opacity: 0.8,
            zIndex: 1,
            animation: 'lightning 0.5s ease-in-out'
          }}
        />
      )}

      <DialogContent sx={{ p: 0, position: 'relative', zIndex: 2 }}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          {/* Icono de lightning */}
          <Zoom in={!showLightning} timeout={500}>
            <Box sx={{ mb: 3 }}>
              <FlashOn sx={{ 
                fontSize: 80, 
                color: '#ffeb3b',
                filter: 'drop-shadow(0 0 20px #ffeb3b)',
                animation: 'pulse 1s ease-in-out infinite'
              }} />
            </Box>
          </Zoom>

          {/* Título */}
          <Typography variant="h4" sx={{ 
            color: '#ffeb3b', 
            fontWeight: 'bold', 
            mb: 2
          }}>
            {showLightning ? '¡Activando!' : 'Preparando Oferta'}
          </Typography>

          {/* Nombre de la oferta */}
          <Typography variant="h6" sx={{ 
            color: 'white', 
            mb: 3,
            opacity: 0.9
          }}>
            {offerName}
          </Typography>

          {/* Temporizador */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" sx={{ 
              color: '#ffeb3b', 
              fontWeight: 'bold',
              fontFamily: 'monospace',
              mb: 2,
              textShadow: '0 0 10px #ffeb3b'
            }}>
              {formatTime(timeLeft)}
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: '#bbb', 
              mb: 3
            }}>
              {showLightning ? 'Procesando activación...' : 'Tiempo restante para activación'}
            </Typography>

            {/* Barra de progreso circular */}
            <Box sx={{ 
              position: 'relative', 
              display: 'inline-flex',
              mb: 2
            }}>
              <CircularProgress
                variant="determinate"
                value={progressPercentage}
                size={120}
                thickness={4}
                sx={{
                  color: '#ffeb3b',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" sx={{ 
                  color: '#ffeb3b', 
                  fontWeight: 'bold'
                }}>
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
            </Box>

            {/* Barra de progreso lineal */}
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              backgroundColor: '#333', 
              borderRadius: 4,
              overflow: 'hidden',
              mb: 2
            }}>
              <Box sx={{ 
                width: `${progressPercentage}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #ffeb3b, #fff176)',
                transition: 'width 0.3s ease',
                borderRadius: 4
              }} />
            </Box>
          </Box>

          {/* Estado de activación */}
          <Fade in={showLightning} timeout={500}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2,
              p: 3,
              background: 'rgba(255, 235, 59, 0.1)',
              borderRadius: 2,
              border: '1px solid #ffeb3b'
            }}>
              <AccessTime sx={{ color: '#ffeb3b', fontSize: 32 }} />
              <Typography variant="h6" sx={{ 
                color: '#ffeb3b', 
                fontWeight: 'bold'
              }}>
                ¡Oferta Activada!
              </Typography>
            </Box>
          </Fade>
        </Box>
      </DialogContent>

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes lightning {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Dialog>
  );
};

