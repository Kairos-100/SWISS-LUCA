import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { Timestamp } from 'firebase/firestore';

interface BlockedOfferTimerProps {
  blockedUntil: Timestamp;
  onExpire?: () => void;
}

export const BlockedOfferTimer: React.FC<BlockedOfferTimerProps> = ({ 
  blockedUntil, 
  onExpire 
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const blockedDate = blockedUntil.toDate();
      const diff = Math.max(0, Math.floor((blockedDate.getTime() - now.getTime()) / 1000));
      
      if (diff <= 0) {
        onExpire?.();
        return 0;
      }
      
      return diff;
    };

    // Calcular tiempo inicial
    setTimeLeft(calculateTimeLeft());

    // Actualizar cada segundo
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil, onExpire]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0min 0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}min ${remainingSeconds}s`;
  };

  if (timeLeft <= 0) {
    return null; // No mostrar nada si el tiempo expiró
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'rgba(76, 175, 80, 0.95)',
        color: 'white',
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontWeight: 'bold',
        fontSize: '0.85rem',
        zIndex: 3
      }}
    >
      <Lock sx={{ fontSize: 16 }} />
      <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
        {formatTime(timeLeft)}
      </Typography>
    </Box>
  );
};
