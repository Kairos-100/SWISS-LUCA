import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CheckCircle, ArrowForward } from '@mui/icons-material';

interface SlideToConfirmButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  text?: string;
}

export const SlideToConfirmButton: React.FC<SlideToConfirmButtonProps> = ({
  onConfirm,
  disabled = false,
  text = 'Desliza para confirmar'
}) => {
  const [slideState, setSlideState] = useState({
    translateX: 0,
    isSliding: false,
    startX: 0
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    setSlideState(prev => ({
      ...prev,
      startX: touch.clientX,
      isSliding: true
    }));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !slideState.isSliding) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - slideState.startX;

    // Solo permitir deslizar a la derecha
    if (deltaX > 0) {
      const maxSlide = 250; // Ancho máximo del slide
      const newTranslateX = Math.min(maxSlide, Math.max(0, deltaX));
      
      setSlideState(prev => ({
        ...prev,
        translateX: newTranslateX
      }));
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    const threshold = 230; // Umbral para confirmar (92% del ancho - casi completo)
    
    // Si se deslizó más del umbral, confirmar
    if (slideState.translateX > threshold) {
      // Vibrar si está disponible
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // Completar el slide
      setSlideState({
        translateX: 250,
        isSliding: false,
        startX: 0
      });

      // Ejecutar confirmación después de la animación
      setTimeout(() => {
        onConfirm();
        // Resetear el estado
        setSlideState({
          translateX: 0,
          isSliding: false,
          startX: 0
        });
      }, 300);
    } else {
      // Volver a la posición original
      setSlideState({
        translateX: 0,
        isSliding: false,
        startX: 0
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setSlideState(prev => ({
      ...prev,
      startX: e.clientX,
      isSliding: true
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !slideState.isSliding) return;

    const deltaX = e.clientX - slideState.startX;

    // Solo permitir deslizar a la derecha
    if (deltaX > 0) {
      const maxSlide = 250;
      const newTranslateX = Math.min(maxSlide, Math.max(0, deltaX));
      
      setSlideState(prev => ({
        ...prev,
        translateX: newTranslateX
      }));
    }
  };

  const handleMouseUp = () => {
    if (disabled) return;

    const threshold = 230; // Umbral para confirmar (92% del ancho - casi completo)
    
    if (slideState.translateX > threshold) {
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      setSlideState({
        translateX: 250,
        isSliding: false,
        startX: 0
      });

      setTimeout(() => {
        onConfirm();
        setSlideState({
          translateX: 0,
          isSliding: false,
          startX: 0
        });
      }, 300);
    } else {
      setSlideState({
        translateX: 0,
        isSliding: false,
        startX: 0
      });
    }
  };

  const progressPercentage = (slideState.translateX / 250) * 100;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 60,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: disabled ? '#555' : '#333',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background track */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: progressPercentage > 92
            ? `linear-gradient(90deg, rgba(76, 175, 80, ${progressPercentage / 100}) 0%, rgba(76, 175, 80, 0) 100%)`
            : progressPercentage > 70
            ? `linear-gradient(90deg, rgba(255, 215, 0, ${progressPercentage / 100}) 0%, rgba(255, 215, 0, 0) 100%)`
            : `linear-gradient(90deg, rgba(255, 193, 7, ${progressPercentage / 100}) 0%, rgba(255, 193, 7, 0) 100%)`,
          transition: slideState.isSliding ? 'none' : 'background 0.3s ease'
        }}
      />

      {/* Text */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'white',
            fontWeight: 'bold',
            opacity: 1 - (progressPercentage / 100) * 0.5
          }}
        >
          {text}
        </Typography>
      </Box>

      {/* Slider button */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 60,
          transform: `translateX(${slideState.translateX}px)`,
          transition: slideState.isSliding ? 'none' : 'transform 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: progressPercentage > 92 
            ? 'linear-gradient(135deg, #4caf50, #66bb6a)' 
            : progressPercentage > 70
            ? 'linear-gradient(135deg, #FFD700, #FFA000)'
            : 'linear-gradient(135deg, #FFF176, #FFEB3B)',
          borderRadius: 2,
          cursor: disabled ? 'not-allowed' : 'grab',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          '&:active': {
            cursor: disabled ? 'not-allowed' : 'grabbing'
          }
        }}
      >
        {progressPercentage > 92 ? (
          <CheckCircle sx={{ color: 'white', fontSize: 32 }} />
        ) : (
          <ArrowForward sx={{ color: '#333', fontSize: 32 }} />
        )}
      </Box>

      {/* Progress indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 4,
          width: `${progressPercentage}%`,
          background: progressPercentage > 92
            ? 'linear-gradient(90deg, #4caf50, #66bb6a)'
            : progressPercentage > 70
            ? 'linear-gradient(90deg, #FFD700, #FFA000)'
            : 'linear-gradient(90deg, #FFF176, #FFEB3B)',
          transition: slideState.isSliding ? 'none' : 'width 0.3s ease'
        }}
      />
    </Box>
  );
};

