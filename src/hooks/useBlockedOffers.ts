import { useState, useEffect, useCallback } from 'react';

export interface BlockedOffer {
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
  blockedUntil: number; // Timestamp de cuándo se desbloquea
  isActivated: boolean;
  isUsed: boolean; // Si la oferta ya fue utilizada
  isLockedAfterUse: boolean; // Si está en lock de 14 minutos después de usar
  activationTime: number; // Tiempo de activación en segundos (por defecto 600 = 10 min)
  usedAt?: number; // Timestamp de cuándo se utilizó
  lockedAfterUseUntil?: number; // Timestamp de cuándo se desbloquea después de usar (14 min)
}

interface UseBlockedOffersReturn {
  blockedOffers: BlockedOffer[];
  activateOffer: (offerId: string) => void;
  blockOffer: (offer: Omit<BlockedOffer, 'blockedUntil' | 'isActivated' | 'isUsed' | 'isLockedAfterUse' | 'activationTime'>) => void;
  useOffer: (offerId: string) => void;
  isOfferBlocked: (offerId: string) => boolean;
  isOfferUsed: (offerId: string) => boolean;
  isOfferLockedAfterUse: (offerId: string) => boolean;
  canUseOffer: (offerId: string) => boolean;
  getOfferTimeLeft: (offerId: string) => number;
  getLockAfterUseTimeLeft: (offerId: string) => number;
  canScrollOffer: (offerId: string) => boolean;
  getOfferStatus: (offerId: string) => 'available' | 'blocked' | 'activated' | 'used' | 'locked_after_use';
}

export const useBlockedOffers = (): UseBlockedOffersReturn => {
  const [blockedOffers, setBlockedOffers] = useState<BlockedOffer[]>([]);

  // Cargar ofertas bloqueadas del localStorage al inicializar
  useEffect(() => {
    const savedOffers = localStorage.getItem('blockedOffers');
    if (savedOffers) {
      try {
        const offers = JSON.parse(savedOffers);
        setBlockedOffers(offers);
      } catch (error) {
        console.error('Error loading blocked offers:', error);
      }
    }
  }, []);

  // Guardar ofertas bloqueadas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('blockedOffers', JSON.stringify(blockedOffers));
  }, [blockedOffers]);

  // Verificar ofertas que ya no están bloqueadas
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBlockedOffers(prev => 
        prev.map(offer => {
          if (!offer.isActivated && offer.blockedUntil <= now) {
            return { ...offer, isActivated: true };
          }
          return offer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const activateOffer = useCallback((offerId: string) => {
    setBlockedOffers(prev => 
      prev.map(offer => 
        offer.id === offerId 
          ? { ...offer, isActivated: true }
          : offer
      )
    );
  }, []);

  const blockOffer = useCallback((offer: Omit<BlockedOffer, 'blockedUntil' | 'isActivated' | 'isUsed' | 'isLockedAfterUse' | 'activationTime'>) => {
    const activationTime = 600; // 10 minutos por defecto
    const blockedUntil = Date.now() + (activationTime * 1000);
    
    const blockedOffer: BlockedOffer = {
      ...offer,
      blockedUntil,
      isActivated: false,
      isUsed: false,
      isLockedAfterUse: false,
      activationTime
    };

    setBlockedOffers(prev => {
      // Remover oferta existente si existe
      const filtered = prev.filter(o => o.id !== offer.id);
      return [...filtered, blockedOffer];
    });
  }, []);

  const isOfferBlocked = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    return offer ? !offer.isActivated : false;
  }, [blockedOffers]);

  const getOfferTimeLeft = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    if (!offer || offer.isActivated) return 0;
    
    const now = Date.now();
    const timeLeft = Math.max(0, offer.blockedUntil - now);
    return Math.floor(timeLeft / 1000);
  }, [blockedOffers]);

  const getLockAfterUseTimeLeft = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    if (!offer || !offer.isLockedAfterUse || !offer.lockedAfterUseUntil) return 0;
    
    const now = Date.now();
    const timeLeft = Math.max(0, offer.lockedAfterUseUntil - now);
    return Math.floor(timeLeft / 1000);
  }, [blockedOffers]);

  const useOffer = useCallback((offerId: string) => {
    const now = Date.now();
    const lockedAfterUseUntil = now + (14 * 60 * 1000); // 14 minutos
    
    setBlockedOffers(prev => 
      prev.map(offer => 
        offer.id === offerId 
          ? { 
              ...offer, 
              isUsed: true, 
              isLockedAfterUse: true,
              usedAt: now,
              lockedAfterUseUntil
            }
          : offer
      )
    );
  }, []);

  const isOfferUsed = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    return offer ? offer.isUsed : false;
  }, [blockedOffers]);

  const isOfferLockedAfterUse = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    if (!offer || !offer.isLockedAfterUse || !offer.lockedAfterUseUntil) return false;
    
    const now = Date.now();
    if (now >= offer.lockedAfterUseUntil) {
      // Desbloquear automáticamente cuando expire el tiempo
      setBlockedOffers(prev => 
        prev.map(o => 
          o.id === offerId 
            ? { ...o, isLockedAfterUse: false, isUsed: false }
            : o
        )
      );
      return false;
    }
    return true;
  }, [blockedOffers]);

  const canUseOffer = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    return offer ? offer.isActivated && !offer.isUsed && !offer.isLockedAfterUse : true;
  }, [blockedOffers]);

  const canScrollOffer = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    return offer ? offer.isActivated || offer.isUsed : true;
  }, [blockedOffers]);

  const getOfferStatus = useCallback((offerId: string) => {
    const offer = blockedOffers.find(o => o.id === offerId);
    if (!offer) return 'available';
    if (offer.isLockedAfterUse) return 'locked_after_use';
    if (offer.isUsed) return 'used';
    if (offer.isActivated) return 'activated';
    return 'blocked';
  }, [blockedOffers]);

  return {
    blockedOffers,
    activateOffer,
    blockOffer,
    useOffer,
    isOfferBlocked,
    isOfferUsed,
    isOfferLockedAfterUse,
    canUseOffer,
    getOfferTimeLeft,
    getLockAfterUseTimeLeft,
    canScrollOffer,
    getOfferStatus
  };
};
