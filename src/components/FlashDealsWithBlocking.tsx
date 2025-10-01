import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Lock,
  AccessTime,
  Star,
  LocationOn,
  CheckCircle,
  FlashOn
} from '@mui/icons-material';
import { ActivationCountdownModal } from './ActivationCountdownModal';
import { BlockedOfferModal } from './BlockedOfferModal';
import { ScrollBlockWrapper } from './ScrollBlockWrapper';
import { useBlockedOffers } from '../hooks/useBlockedOffers';

interface FlashDeal {
  id: string;
  name: string;
  image: string;
  category: string;
  subCategory: string;
  discount: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  price: string;
  oldPrice: string;
  originalPrice: number;
  discountedPrice: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  maxQuantity?: number;
  soldQuantity?: number;
}

interface FlashDealsWithBlockingProps {
  flashDeals: FlashDeal[];
  onOfferClick: (deal: FlashDeal) => void;
  activatedFlashDeals: Set<string>;
  flashActivationTimes: {[key: string]: Date};
  onActivateFlashDeal: (dealId: string) => void;
}

export const FlashDealsWithBlocking: React.FC<FlashDealsWithBlockingProps> = ({
  flashDeals,
  onOfferClick,
  onActivateFlashDeal
}) => {
  const [selectedOffer, setSelectedOffer] = useState<FlashDeal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [countdownModalOpen, setCountdownModalOpen] = useState(false);
  const [offerToActivate, setOfferToActivate] = useState<FlashDeal | null>(null);
  const [swipeStates, setSwipeStates] = useState<{[key: string]: { translateX: number; isSliding: boolean; startX?: number }}>({});

  const { 
    isOfferBlocked, 
    getOfferTimeLeft, 
    canScrollOffer, 
    getOfferStatus,
    activateOffer,
    useOffer
  } = useBlockedOffers();

  // Función para calcular tiempo restante de la oferta
  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  };

  const handleActivateOffer = (dealId: string) => {
    activateOffer(dealId);
    onActivateFlashDeal(dealId);
    setModalOpen(false);
  };

  const handleUseOffer = (dealId: string) => {
    useOffer(dealId);
    setModalOpen(false);
  };

  const handleStartCountdown = (deal: FlashDeal) => {
    setOfferToActivate(deal);
    setCountdownModalOpen(true);
  };

  const handleCountdownComplete = () => {
    if (offerToActivate) {
      handleActivateOffer(offerToActivate.id);
    }
    setCountdownModalOpen(false);
    setOfferToActivate(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Funciones de swipe para activar ofertas
  const handleTouchStart = (dealId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeStates(prev => ({
      ...prev,
      [dealId]: {
        ...prev[dealId],
        startX: touch.clientX,
        translateX: 0,
        isSliding: false
      }
    }));
  };

  const handleTouchMove = (dealId: string, e: React.TouchEvent) => {
    const state = swipeStates[dealId];
    if (!state || state.startX === undefined) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;

    // Solo permitir deslizar a la izquierda
    if (deltaX < 0) {
      const newTranslateX = Math.min(0, Math.max(-150, deltaX));
      
      setSwipeStates(prev => ({
        ...prev,
        [dealId]: {
          ...prev[dealId],
          translateX: newTranslateX,
          isSliding: true
        }
      }));
    }
  };

  const handleTouchEnd = async (dealId: string) => {
    const state = swipeStates[dealId];
    if (!state) return;

    // Si se deslizó más de 80px a la izquierda, activar
    if (state.translateX < -80) {
      const deal = flashDeals.find(d => d.id === dealId);
      if (deal) {
        // Vibrar si está disponible
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Mostrar modal de countdown de activación
        handleStartCountdown(deal);
        
        // Resetear estado de swipe
        setSwipeStates(prev => ({
          ...prev,
          [dealId]: { translateX: 0, isSliding: false }
        }));
      }
    } else {
      // Volver a la posición original
      setSwipeStates(prev => ({
        ...prev,
        [dealId]: { translateX: 0, isSliding: false }
      }));
    }
  };

  return (
    <>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        }, 
        gap: 3 
      }}>
        {flashDeals.map((deal) => {
          const timeRemaining = getTimeRemaining(deal.endTime);
          const progressPercentage = deal.maxQuantity 
            ? ((deal.soldQuantity || 0) / deal.maxQuantity) * 100 
            : 0;
          const isBlocked = isOfferBlocked(deal.id);
          const timeLeft = getOfferTimeLeft(deal.id);
          const canScroll = canScrollOffer(deal.id);
          const offerStatus = getOfferStatus(deal.id);

          return (
            <ScrollBlockWrapper key={deal.id} isBlocked={isBlocked && !canScroll} offerId={deal.id}>
              <Card 
                sx={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  border: '1px solid #333',
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: canScroll ? 'pointer' : 'not-allowed',
                  opacity: isBlocked ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: canScroll ? 'translateY(-4px)' : 'none',
                    boxShadow: canScroll ? '0 8px 25px rgba(255, 107, 53, 0.3)' : 'none',
                    borderColor: canScroll ? '#ffeb3b' : '#333'
                  }
                }}
                onClick={() => {
                  if (canScroll) {
                    onOfferClick(deal);
                  }
                }}
              >
                {/* Badge de descuento */}
                <Box sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'linear-gradient(45deg, #ffeb3b, #fff176)',
                  color: '#333',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)'
                }}>
                  {deal.discount}
                </Box>

                {/* Indicador de estado */}
                {offerStatus === 'blocked' && !canScroll && (
                  <Box sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(255, 107, 107, 0.9)',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    zIndex: 2
                  }}>
                    <Lock sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      BLOQUEADA
                    </Typography>
                  </Box>
                )}
                
                {offerStatus === 'used' && (
                  <Box sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(255, 107, 107, 0.9)',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    zIndex: 2
                  }}>
                    <CheckCircle sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      USADA
                    </Typography>
                  </Box>
                )}

                {/* Botón de activación o estado */}
                {offerStatus === 'used' ? (
                  <Box sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <CheckCircle sx={{ fontSize: 16 }} />
                    USADA
                  </Box>
                ) : offerStatus === 'activated' ? (
                  <Box sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    zIndex: 2
                  }}>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        fontSize: '0.75rem',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        '&:hover': {
                          backgroundColor: '#388e3c'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOffer(deal);
                        setModalOpen(true);
                      }}
                    >
                      ✅ USAR
                    </Button>
                  </Box>
                ) : offerStatus === 'blocked' ? (
                  <Box sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    zIndex: 2
                  }}>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: '#ff6b35',
                        color: 'white',
                        fontSize: '0.75rem',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        '&:hover': {
                          backgroundColor: '#e55a2b'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOffer(deal);
                        setModalOpen(true);
                      }}
                    >
                      🔒 BLOQUEADA
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    zIndex: 2
                  }}>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: '#ff6b35',
                        color: 'white',
                        fontSize: '0.75rem',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        '&:hover': {
                          backgroundColor: '#e55a2b'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCountdown(deal);
                      }}
                    >
                      ⚡ ACTIVAR
                    </Button>
                  </Box>
                )}

                {/* Imagen con funcionalidad de swipe */}
                <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                  {/* Slider track background */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, rgba(255, 235, 59, 0.3) 0%, rgba(255, 235, 59, 0.6) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {'<<<'}
                      </Typography>
                      <FlashOn sx={{ color: 'white', fontSize: '1.5rem' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Desliza para activar
                      </Typography>
                    </Box>
                  </Box>

                  {/* Slidable image */}
                  <Box
                    onTouchStart={(e) => handleTouchStart(deal.id, e)}
                    onTouchMove={(e) => handleTouchMove(deal.id, e)}
                    onTouchEnd={() => handleTouchEnd(deal.id)}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      transform: `translateX(${(swipeStates[deal.id]?.translateX || 0)}px)`,
                      transition: (swipeStates[deal.id]?.isSliding) ? 'none' : 'transform 0.3s ease-out',
                      zIndex: 2,
                      cursor: 'grab',
                      '&:active': {
                        cursor: 'grabbing'
                      }
                    }}
                  >
                    <img 
                      src={deal.image} 
                      alt={deal.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        pointerEvents: 'none'
                      }}
                    />
                    
                    {/* Overlay para el temporizador */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      p: 2
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: 'white',
                        mb: 1
                      }}>
                        <AccessTime sx={{ fontSize: '1rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Temps restant :
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1,
                        justifyContent: 'center'
                      }}>
                        <Box sx={{ 
                          background: 'rgba(255, 215, 0, 0.9)',
                          color: '#333',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          textAlign: 'center',
                          minWidth: 40
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                            {timeRemaining.hours.toString().padStart(2, '0')}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            h
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          background: 'rgba(255, 215, 0, 0.9)',
                          color: '#333',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          textAlign: 'center',
                          minWidth: 40
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                            {timeRemaining.minutes.toString().padStart(2, '0')}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            m
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          background: 'rgba(255, 215, 0, 0.9)',
                          color: '#333',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          textAlign: 'center',
                          minWidth: 40
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                            {timeRemaining.seconds.toString().padStart(2, '0')}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            s
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Visual slider rail indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'rgba(255, 255, 255, 0.3)',
                      zIndex: 3
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.min(100, Math.abs((swipeStates[deal.id]?.translateX || 0) / 1.5))}%`,
                        background: 'linear-gradient(90deg, #ffeb3b, #4caf50)',
                        transition: (swipeStates[deal.id]?.isSliding) ? 'none' : 'width 0.3s ease-out'
                      }}
                    />
                  </Box>
                </Box>

                <CardContent sx={{ p: 2 }}>
                  {/* Nombre y categoría */}
                  <Typography variant="h6" sx={{ 
                    color: '#fff', 
                    fontWeight: 'bold', 
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {deal.name}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ 
                    color: '#888', 
                    mb: 2,
                    textTransform: 'capitalize'
                  }}>
                    {deal.category}
                  </Typography>

                  {/* Precios */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h5" sx={{ 
                      color: '#ffeb3b', 
                      fontWeight: 'bold' 
                    }}>
                      CHF {deal.discountedPrice}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#888', 
                      textDecoration: 'line-through' 
                    }}>
                      CHF {deal.originalPrice}
                    </Typography>
                  </Box>

                  {/* Estado de bloqueo con temporizador */}
                  {offerStatus === 'blocked' && !canScroll && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ 
                        color: '#ffeb3b', 
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        mb: 1
                      }}>
                        {formatTime(timeLeft)}
                      </Typography>
                      
                      <LinearProgress
                        variant="determinate"
                        value={((600 - timeLeft) / 600) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#333',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #ffeb3b, #fff176)',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  )}

                  {/* Rating y ubicación */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <Star sx={{ color: '#ffeb3b', fontSize: '1rem' }} />
                    <Typography variant="body2" sx={{ color: '#bbb' }}>
                      {deal.rating}
                    </Typography>
                    <LocationOn sx={{ color: '#888', fontSize: '1rem', ml: 1 }} />
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {deal.location.address}
                    </Typography>
                  </Box>

                  {/* Barra de progreso de ventas */}
                  {deal.maxQuantity && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 1
                      }}>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          Vendu : {deal.soldQuantity || 0} / {deal.maxQuantity}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ffeb3b', fontWeight: 'bold' }}>
                          {Math.round(progressPercentage)}% vendu
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 6, 
                        backgroundColor: '#333', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${Math.min(progressPercentage, 100)}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #ffeb3b, #fff176)',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </ScrollBlockWrapper>
          );
        })}
      </Box>

      {/* Modal de oferta bloqueada */}
      {selectedOffer && (
        <BlockedOfferModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onActivate={() => handleActivateOffer(selectedOffer.id)}
          onUse={() => handleUseOffer(selectedOffer.id)}
          offer={{
            id: selectedOffer.id,
            name: selectedOffer.name,
            description: selectedOffer.description,
            discount: selectedOffer.discount,
            originalPrice: selectedOffer.originalPrice,
            discountedPrice: selectedOffer.discountedPrice,
            image: selectedOffer.image,
            category: selectedOffer.category,
            location: selectedOffer.location.address,
            rating: selectedOffer.rating
          }}
          isActivated={getOfferStatus(selectedOffer.id) === 'activated'}
          isUsed={getOfferStatus(selectedOffer.id) === 'used'}
          activationTime={600}
        />
      )}

      {/* Modal de countdown de activación */}
      {offerToActivate && (
        <ActivationCountdownModal
          open={countdownModalOpen}
          onClose={() => setCountdownModalOpen(false)}
          onActivationComplete={handleCountdownComplete}
          offerName={offerToActivate.name}
          countdownSeconds={60}
        />
      )}
    </>
  );
};
