import React, { useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import { FlashDealCard } from './FlashDealCard';
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

interface VirtualizedFlashDealsProps {
  flashDeals: FlashDeal[];
  onOfferClick: (deal: FlashDeal) => void;
  onActivateFlashDeal: (dealId: string) => void;
}

export const VirtualizedFlashDeals: React.FC<VirtualizedFlashDealsProps> = ({
  flashDeals,
  onOfferClick,
  onActivateFlashDeal: _onActivateFlashDeal
}) => {
  const { 
    isOfferBlocked, 
    getOfferTimeLeft, 
    canScrollOffer, 
    getOfferStatus
  } = useBlockedOffers();

  // Memoizar la función de cálculo de tiempo restante
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

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoizar los datos de las ofertas para evitar recálculos innecesarios
  const memoizedDeals = useMemo(() => {
    return flashDeals.map(deal => {
      const timeRemaining = getTimeRemaining(deal.endTime);
      const progressPercentage = deal.maxQuantity 
        ? ((deal.soldQuantity || 0) / deal.maxQuantity) * 100 
        : 0;
      const isBlocked = isOfferBlocked(deal.id);
      const timeLeft = getOfferTimeLeft(deal.id);
      const canScroll = canScrollOffer(deal.id);
      const offerStatus = getOfferStatus(deal.id);
      
      return {
        deal,
        timeRemaining,
        progressPercentage,
        isBlocked,
        timeLeft,
        canScroll,
        offerStatus
      };
    });
  }, [flashDeals, getTimeRemaining, isOfferBlocked, getOfferTimeLeft, canScrollOffer, getOfferStatus]);

  const handleStartCountdown = useCallback((deal: FlashDeal) => {
    // Implementar lógica de countdown si es necesario
    console.log('Starting countdown for deal:', deal.id);
  }, []);

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: '1fr', 
        sm: 'repeat(2, 1fr)', 
        md: 'repeat(3, 1fr)' 
      }, 
      gap: 3 
    }}>
      {memoizedDeals.map(({ deal, timeRemaining, progressPercentage, isBlocked, timeLeft, canScroll, offerStatus }) => (
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
            onOfferClick(deal);
          }}
          onUseOffer={() => {
            onOfferClick(deal);
          }}
          formatTime={formatTime}
        />
      ))}
    </Box>
  );
};
