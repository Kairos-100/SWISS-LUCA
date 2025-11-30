import React, { useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import { ActivationCountdownModal } from './ActivationCountdownModal';
import { BlockedOfferModal } from './BlockedOfferModal';
import { FlashDealCard } from './FlashDealCard';
import { useBlockedOffers } from '../hooks/useBlockedOffers';
import { isOfferAvailable } from '../utils/availabilityUtils';

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

  const { 
    isOfferBlocked, 
    getOfferTimeLeft, 
    canScrollOffer, 
    getOfferStatus,
    activateOffer,
    useOffer
  } = useBlockedOffers();

  // Función para calcular tiempo restante de la oferta - memoizada
  const getTimeRemaining = useCallback((endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  }, []);

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

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

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
        {flashDeals
          .filter(deal => isOfferAvailable(deal)) // Filtrar por disponibilidad según calendario y horario
          .map((deal) => {
          // Memoizar cálculos costosos para evitar re-renderizados innecesarios
          const dealData = useMemo(() => {
            const timeRemaining = getTimeRemaining(deal.endTime);
            const progressPercentage = deal.maxQuantity 
              ? ((deal.soldQuantity || 0) / deal.maxQuantity) * 100 
              : 0;
            const isBlocked = isOfferBlocked(deal.id);
            const timeLeft = getOfferTimeLeft(deal.id);
            const canScroll = canScrollOffer(deal.id);
            const offerStatus = getOfferStatus(deal.id);
            
            return {
              timeRemaining,
              progressPercentage,
              isBlocked,
              timeLeft,
              canScroll,
              offerStatus
            };
          }, [deal.endTime, deal.maxQuantity, deal.soldQuantity, deal.id, getTimeRemaining, isOfferBlocked, getOfferTimeLeft, canScrollOffer, getOfferStatus]);
          
          const { timeRemaining, progressPercentage, isBlocked, timeLeft, canScroll, offerStatus } = dealData;

          return (
            <FlashDealCard
              key={deal.id}
              deal={deal}
              timeRemaining={timeRemaining}
              progressPercentage={progressPercentage}
              isBlocked={isBlocked}
              timeLeft={timeLeft}
              canScroll={canScroll}
              offerStatus={offerStatus}
              onOfferClick={onOfferClick}
              onStartCountdown={handleStartCountdown}
              onActivateOffer={() => {
                setSelectedOffer(deal);
                setModalOpen(true);
              }}
              onUseOffer={() => {
                setSelectedOffer(deal);
                setModalOpen(true);
              }}
              formatTime={formatTime}
            />
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
