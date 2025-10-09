import React, { memo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Star,
  CheckCircle
} from '@mui/icons-material';
import { LocationIcon, LockIcon, TimeIcon } from './ProfessionalIcons';
import { ScrollBlockWrapper } from './ScrollBlockWrapper';
import { SlideToConfirmButton } from './SlideToConfirmButton';

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

interface FlashDealCardProps {
  deal: FlashDeal;
  timeRemaining: { hours: number; minutes: number; seconds: number };
  progressPercentage: number;
  isBlocked: boolean;
  timeLeft: number;
  canScroll: boolean;
  offerStatus: 'available' | 'blocked' | 'activated' | 'used' | 'locked_after_use';
  onOfferClick: (deal: FlashDeal) => void;
  onStartCountdown: (deal: FlashDeal) => void;
  onActivateOffer: (dealId: string) => void;
  onUseOffer: (dealId: string) => void;
  formatTime: (seconds: number) => string;
}

export const FlashDealCard = memo<FlashDealCardProps>(({
  deal,
  timeRemaining,
  progressPercentage,
  isBlocked,
  timeLeft,
  canScroll,
  offerStatus,
  onOfferClick,
  onStartCountdown,
  onActivateOffer,
  onUseOffer: _onUseOffer,
  formatTime
}) => {
  const handleCardClick = () => {
    if (canScroll) {
      onOfferClick(deal);
    }
  };

  const handleActivateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActivateOffer(deal.id);
  };


  const handleBlockedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOfferClick(deal);
  };

  return (
    <ScrollBlockWrapper isBlocked={isBlocked && !canScroll} offerId={deal.id}>
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
            boxShadow: canScroll ? '0 8px 25px rgba(25, 118, 210, 0.3)' : 'none',
            borderColor: canScroll ? '#FFD700' : '#333'
          }
        }}
        onClick={handleCardClick}
      >
        {/* Badge de descuento */}
        <Box sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'linear-gradient(45deg, #FFD700, #FFA000)',
          color: 'white',
          px: 2,
          py: 0.5,
          borderRadius: 2,
          fontWeight: 'bold',
          fontSize: '0.875rem',
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)'
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
            <LockIcon sx={{ fontSize: 16 }} />
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
              onClick={handleActivateClick}
            >
              ✅ USAR
            </Button>
          </Box>
        ) : offerStatus === 'blocked' && (
          <Box sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            zIndex: 2
          }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#1e40af',
                color: 'white',
                fontSize: '0.75rem',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#1d4ed8'
                }
              }}
              onClick={handleBlockedClick}
            >
              🔒 BLOQUEADA
            </Button>
          </Box>
        )}

        {/* Imagen estática */}
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <img 
            src={deal.image} 
            alt={deal.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
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
              <TimeIcon sx={{ fontSize: '1rem' }} />
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
                background: 'rgba(25, 118, 210, 0.9)',
                color: 'white',
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
                background: 'rgba(25, 118, 210, 0.9)',
                color: 'white',
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
                background: 'rgba(25, 118, 210, 0.9)',
                color: 'white',
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
              color: '#FFD700', 
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
                color: '#FFD700', 
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
                    background: 'linear-gradient(90deg, #FFD700, #FFA000)',
                    borderRadius: 3
                  }
                }}
              />
            </Box>
          )}

          {/* Rating y ubicación */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <Star sx={{ color: '#FFD700', fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ color: '#bbb' }}>
              {deal.rating}
            </Typography>
            <LocationIcon sx={{ color: '#888', fontSize: '1rem', ml: 1 }} />
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
                <Typography variant="caption" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
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
                  background: 'linear-gradient(90deg, #FFD700, #FFA000)',
                  transition: 'width 0.3s ease'
                }} />
              </Box>
            </Box>
          )}

          {/* Botón de slide para activar oferta (solo si está disponible) */}
          {(offerStatus === 'available' || (!isBlocked && offerStatus !== 'activated' && offerStatus !== 'used')) && (
            <Box sx={{ mt: 2 }}>
              <SlideToConfirmButton
                onConfirm={() => onStartCountdown(deal)}
                text="Desliza para activar"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </ScrollBlockWrapper>
  );
});

FlashDealCard.displayName = 'FlashDealCard';
