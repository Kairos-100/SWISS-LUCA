import React, { useEffect, useRef, useCallback } from 'react';
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
  const isScrollBlocked = useRef(false);

  // Memoizar las funciones de prevención para evitar recrearlas en cada render
  const preventScroll = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const preventWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const preventTouch = useCallback((e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const preventKeyboard = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => {
    if (!isBlocked || !containerRef.current) {
      // Si no está bloqueado, restaurar scroll si estaba bloqueado
      if (isScrollBlocked.current) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        isScrollBlocked.current = false;
      }
      return;
    }

    const container = containerRef.current;
    
    // Solo aplicar bloqueo si no está ya bloqueado
    if (!isScrollBlocked.current) {
      // Aplicar estilos para bloquear scroll
      container.style.overflow = 'hidden';
      container.style.position = 'relative';
      container.style.pointerEvents = 'none';

      // Bloquear scroll en el body también
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      isScrollBlocked.current = true;
    }

    // Agregar event listeners solo una vez
    container.addEventListener('wheel', preventWheel, { passive: false });
    container.addEventListener('touchmove', preventTouch, { passive: false });
    container.addEventListener('keydown', preventKeyboard, { passive: false });
    container.addEventListener('scroll', preventScroll, { passive: false });

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
      
      isScrollBlocked.current = false;
    };
  }, [isBlocked, offerId, preventScroll, preventWheel, preventTouch, preventKeyboard]);

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

