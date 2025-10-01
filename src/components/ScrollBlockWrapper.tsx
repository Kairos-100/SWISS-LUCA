import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface ScrollBlockWrapperProps {
  children: React.ReactNode;
  isBlocked: boolean;
  offerId: string;
}

export const ScrollBlockWrapper: React.FC<ScrollBlockWrapperProps> = ({
  children,
  isBlocked,
  offerId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isBlocked || !containerRef.current) return;

    const container = containerRef.current;
    
    // Prevenir scroll en el contenedor
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevenir scroll con rueda del mouse
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevenir scroll con touch
    const preventTouch = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevenir scroll con teclado
    const preventKeyboard = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Aplicar estilos para bloquear scroll
    container.style.overflow = 'hidden';
    container.style.position = 'relative';
    container.style.pointerEvents = 'none';

    // Agregar event listeners
    container.addEventListener('wheel', preventWheel, { passive: false });
    container.addEventListener('touchmove', preventTouch, { passive: false });
    container.addEventListener('keydown', preventKeyboard, { passive: false });
    container.addEventListener('scroll', preventScroll, { passive: false });

    // Bloquear scroll en el body también
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      // Remover event listeners
      container.removeEventListener('wheel', preventWheel);
      container.removeEventListener('touchmove', preventTouch);
      container.removeEventListener('keydown', preventKeyboard);
      container.removeEventListener('scroll', preventScroll);

      // Restaurar estilos
      container.style.overflow = '';
      container.style.position = '';
      container.style.pointerEvents = '';
      
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isBlocked, offerId]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...(isBlocked && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            pointerEvents: 'none'
          }
        })
      }}
    >
      {children}
    </Box>
  );
};

