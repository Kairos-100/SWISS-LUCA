import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  Close,
  Lock,
  FlashOn,
  AccessTime,
  CheckCircle,
  LocalOffer
} from '@mui/icons-material';
import { SlideToConfirmButton } from './SlideToConfirmButton';

interface BlockedOfferModalProps {
  open: boolean;
  onClose: () => void;
  onActivate: () => void;
  onUse?: () => void;
  offer: {
    id: string;
    name: string;
    description: string;
    discount: string;
    originalPrice: number;
    discountedPrice: number;
    image?: string;
    category: string;
    location: string;
    rating: number;
  };
  isActivated?: boolean;
  isUsed?: boolean;
  activationTime?: number; // Tiempo de activación en segundos
}

export const BlockedOfferModal: React.FC<BlockedOfferModalProps> = ({
  open,
  onClose,
  onActivate,
  onUse,
  offer,
  isActivated = false,
  isUsed = false,
  activationTime = 600 // 10 minutos por defecto
}) => {
  const [timeLeft, setTimeLeft] = useState(activationTime);
  const [showActivation, setShowActivation] = useState(false);
  const [lightningAnimation, setLightningAnimation] = useState(false);

  // Efecto para el temporizador
  useEffect(() => {
    if (!open || isActivated || isUsed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowActivation(true);
          setLightningAnimation(true);
          // Después de 2 segundos, activar la oferta automáticamente
          setTimeout(() => {
            onActivate();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, isActivated, isUsed, onActivate]);

  // Resetear estado al abrir/cerrar
  useEffect(() => {
    if (open) {
      setTimeLeft(activationTime);
      setShowActivation(false);
      setLightningAnimation(false);
    }
  }, [open, activationTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((activationTime - timeLeft) / activationTime) * 100;

  const handleActivateNow = () => {
    setLightningAnimation(true);
    setTimeout(() => {
      onActivate();
    }, 1000);
  };

  return (
    <Dialog
      open={open}
      onClose={isActivated ? onClose : undefined} // No permitir cerrar si está bloqueada
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      {/* Efecto de lightning cuando se activa */}
      {lightningAnimation && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, #FFD700, #FFA000, #FFD700)',
            opacity: 0.3,
            zIndex: 1,
            animation: 'lightning 0.5s ease-in-out'
          }}
        />
      )}

      <DialogContent sx={{ p: 0, position: 'relative', zIndex: 2 }}>
        {/* Header con botón de cerrar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)'
        }}>
          <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
            {offer.name}
          </Typography>
          {isActivated && (
            <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          )}
        </Box>

        {/* Imagen de la oferta */}
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          {offer.image ? (
            <img
              src={offer.image}
              alt={offer.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <Box sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #333 0%, #555 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LocalOffer sx={{ fontSize: 60, color: '#FFD700', opacity: 0.5 }} />
            </Box>
          )}
          
          {/* Overlay con información de la oferta */}
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            p: 2
          }}>
            <Typography variant="h5" sx={{ 
              color: '#FFD700', 
              fontWeight: 'bold',
              mb: 0.5
            }}>
              {offer.discount}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
              {offer.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#bbb' }}>
                ⭐ {offer.rating}
              </Typography>
              <Typography variant="body2" sx={{ color: '#bbb' }}>
                📍 {offer.location}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Contenido principal */}
        <Box sx={{ p: 3 }}>
          {isUsed ? (
            <Fade in={isUsed} timeout={500}>
              <Box sx={{ textAlign: 'center' }}>
                {/* Estado utilizado */}
                <Zoom in={isUsed} timeout={800}>
                  <Box sx={{ mb: 3 }}>
                    <CheckCircle sx={{ 
                      fontSize: 80, 
                      color: '#ff6b6b',
                      mb: 2
                    }} />
                    <Typography variant="h5" sx={{ 
                      color: '#ff6b6b', 
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      Oferta Utilizada
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#bbb', mb: 3 }}>
                      Esta oferta ya ha sido utilizada y no se puede volver a usar
                    </Typography>
                  </Box>
                </Zoom>

                {/* Información de la oferta utilizada */}
                <Card sx={{ 
                  background: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid #ff6b6b',
                  mb: 3
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 1 }}>
                      {offer.name}
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      color: '#ff6b6b', 
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      {offer.discount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bbb' }}>
                      {offer.description}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Botón de cerrar */}
                <Button
                  variant="contained"
                  onClick={onClose}
                  sx={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8a80 100%)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e55a5a 0%, #ff6b6b 100%)',
                    }
                  }}
                >
                  Fermer
                </Button>
              </Box>
            </Fade>
          ) : !isActivated ? (
            <Fade in={!showActivation} timeout={500}>
              <Box>
                {/* Estado bloqueado */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mb: 3,
                  p: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid #333'
                }}>
                  <Lock sx={{ color: '#ff6b6b', fontSize: 32, mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      Oferta Bloqueada
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bbb' }}>
                      Espera a que se active automáticamente
                    </Typography>
                  </Box>
                </Box>

                {/* Temporizador */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h4" sx={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    mb: 1
                  }}>
                    {formatTime(timeLeft)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bbb', mb: 2 }}>
                    Tiempo restante para activación
                  </Typography>
                  
                  {/* Barra de progreso */}
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#333',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #FFD700, #FFA000)',
                          borderRadius: 4
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block' }}>
                      {Math.round(progressPercentage)}% completado
                    </Typography>
                  </Box>
                </Box>

                {/* Botón de activación inmediata (opcional) */}
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={handleActivateNow}
                    startIcon={<FlashOn />}
                    sx={{
                      borderColor: '#FFD700',
                      color: '#FFD700',
                      px: 3,
                      py: 1,
                      '&:hover': {
                        borderColor: '#FFA000',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)'
                      }
                    }}
                  >
                    Activar Ahora
                  </Button>
                </Box>
              </Box>
            </Fade>
          ) : (
            <Fade in={showActivation} timeout={500}>
              <Box sx={{ textAlign: 'center' }}>
                {/* Estado activado */}
                <Zoom in={showActivation} timeout={800}>
                  <Box sx={{ mb: 3 }}>
                    <CheckCircle sx={{ 
                      fontSize: 80, 
                      color: '#4caf50',
                      mb: 2
                    }} />
                    <Typography variant="h5" sx={{ 
                      color: '#4caf50', 
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      Offre Activée !
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#bbb', mb: 3 }}>
                      Montrez cet écran au personnel pour utiliser votre réduction
                    </Typography>
                  </Box>
                </Zoom>

                {/* Información de la oferta activada */}
                <Card sx={{ 
                  background: 'rgba(25, 118, 210, 0.1)',
                  border: '1px solid #FFD700',
                  mb: 3
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#FFD700', mb: 1 }}>
                      {offer.name}
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      color: '#FFD700', 
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      {offer.discount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#bbb' }}>
                      {offer.description}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Botón de slide para usar oferta */}
                <Box sx={{ mb: 3 }}>
                  <SlideToConfirmButton
                    onConfirm={() => {
                      if (onUse) {
                        onUse();
                      }
                    }}
                    text="← Glisser pour utiliser l'offre"
                  />
                </Box>

                {/* Temporizador de uso */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 1,
                  p: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2
                }}>
                  <AccessTime sx={{ color: '#FFD700' }} />
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    Tiempo de uso: 10 minutos
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
