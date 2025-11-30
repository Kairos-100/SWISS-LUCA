import type { Offer, FlashDeal } from '../types';

// Función para verificar si una oferta está disponible según su calendario y horario
export const isOfferAvailable = (offer: Offer | FlashDeal): boolean => {
  // Si no tiene horario configurado, está disponible siempre
  if (!offer.availabilitySchedule || !offer.availabilitySchedule.days || offer.availabilitySchedule.days.length === 0) {
    return true;
  }

  const now = new Date();
  // Obtener el día de la semana en inglés en minúsculas
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // 'HH:mm' formato

  // Verificar si el día actual está en los días disponibles
  const isDayAvailable = offer.availabilitySchedule.days.includes(currentDay);
  if (!isDayAvailable) {
    return false;
  }

  // Verificar si la hora actual está dentro del rango de horarios
  const startTime = offer.availabilitySchedule.startTime;
  const endTime = offer.availabilitySchedule.endTime;

  // Comparar horas (formato 'HH:mm')
  return currentTime >= startTime && currentTime <= endTime;
};

// Función para obtener el texto de disponibilidad de una oferta
export const getAvailabilityText = (offer: Offer | FlashDeal): string => {
  if (!offer.availabilitySchedule || !offer.availabilitySchedule.days || offer.availabilitySchedule.days.length === 0) {
    return 'Disponible 24/7';
  }

  const dayNames: { [key: string]: string } = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  const days = offer.availabilitySchedule.days.map(d => dayNames[d] || d).join(', ');
  const timeRange = `${offer.availabilitySchedule.startTime} - ${offer.availabilitySchedule.endTime}`;
  
  return `${days}: ${timeRange}`;
};

