import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerReturn {
  timeRemaining: { hours: number; minutes: number; seconds: number };
  isExpired: boolean;
  formatTime: (seconds: number) => string;
}

export const useTimer = (endTime: Date): UseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateTimeRemaining = useCallback((endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, isExpired: false };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    // Calcular tiempo inicial
    const initialTime = calculateTimeRemaining(endTime);
    setTimeRemaining({ 
      hours: initialTime.hours, 
      minutes: initialTime.minutes, 
      seconds: initialTime.seconds 
    });
    setIsExpired(initialTime.isExpired);

    // Si ya expiró, no iniciar el intervalo
    if (initialTime.isExpired) {
      return;
    }

    // Configurar intervalo optimizado
    intervalRef.current = setInterval(() => {
      const time = calculateTimeRemaining(endTime);
      
      setTimeRemaining({ 
        hours: time.hours, 
        minutes: time.minutes, 
        seconds: time.seconds 
      });
      
      if (time.isExpired) {
        setIsExpired(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000); // Actualizar cada segundo

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endTime, calculateTimeRemaining]);

  return {
    timeRemaining,
    isExpired,
    formatTime
  };
};

