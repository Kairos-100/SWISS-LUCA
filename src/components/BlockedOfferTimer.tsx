import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { LockIcon } from './ProfessionalIcons';
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
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        px: 2,
        py: 1,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        fontWeight: 'bold',
        fontSize: '0.9rem',
        zIndex: 3,
        boxShadow: '0 4px 15px rgba(44, 62, 80, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%': {
            boxShadow: '0 4px 15px rgba(44, 62, 80, 0.3)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 6px 20px rgba(44, 62, 80, 0.5)',
            transform: 'scale(1.02)'
          },
          '100%': {
            boxShadow: '0 4px 15px rgba(44, 62, 80, 0.3)',
            transform: 'scale(1)'
          }
        }
      }}
    >
      <LockIcon sx={{ 
        fontSize: 18,
        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
      }} />
      <Typography 
        variant="body2" 
        sx={{ 
          fontSize: '0.9rem', 
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          letterSpacing: '0.5px'
        }}
      >
        {formatTime(timeLeft)}
      </Typography>
    </Box>
  );
};
