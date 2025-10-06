import { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from './firebase';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { getAuthErrorMessage, validateEmail, validatePassword, validateName } from './utils/authUtils';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './components/LanguageSelector';
import { FlashDealsWithBlocking } from './components/FlashDealsWithBlocking';
import { SlideToConfirmButton } from './components/SlideToConfirmButton';
import { BlockedOfferTimer } from './components/BlockedOfferTimer';
import './i18n';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  CssBaseline, 
  Card, 
  CardContent, 
  CardMedia, 
  IconButton, 
  Chip,
  Box,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { 
  AttachMoney,
  Person,
  Star,
  Phone,
  Directions,
  Close,
  Add,
  ContentCut,
  Store,
  Checkroom,
  LocalGroceryStore,
  FitnessCenter,
  LocalPharmacy,
  Movie,
  LocalPrintshop,
  LocalTaxi,
  Hotel,
  AccessTime,
  FlashOn,
  AccountBalanceWallet,
  MonetizationOn
} from '@mui/icons-material';
import { 
  MapIcon,
  RestaurantIcon,
  BarIcon,
  BakeryIcon,
  ShopIcon,
  ListIcon,
  FlashIcon,
  ProfileIcon,
  LocationIcon,
  MyLocationIcon,
  LockIcon
} from './components/ProfessionalIcons';
import professionalTheme from './theme/professionalTheme';
import './styles/professionalStyles.css';
import './App.css';

// Declaraciones de tipos para Google Maps
declare global {
  interface Window {
    google: any;
  }
}

// Google Maps API Key - En producción, esto debería estar en variables de entorno
const GOOGLE_MAPS_API_KEY = 'AIzaSyBbnCxckdR0XrhYorXJHXPlIx-58MPcva0';

// Plans d'abonnement
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Plan Mensuel',
    price: 9.99,
    duration: 30,
    type: 'monthly',
    features: ['Accès complet à l\'app', 'Offres illimitées', 'Support prioritaire']
  },
  {
    id: 'yearly',
    name: 'Plan Annuel',
    price: 99.99,
    duration: 365,
    type: 'yearly',
    features: ['Accès complet à l\'app', 'Offres illimitées', 'Support prioritaire', '2 mois gratuits']
  }
];

// Prix par utilisation d'offres
const OFFER_USAGE_PERCENTAGE = 0.05; // 5% del coste de la oferta

// User Profile data type
interface UserProfile {
  uid: string;
  email: string;
  name: string;
  city: string;
  activatedOffers: {
    offerId: string;
    activatedAt: Timestamp;
    savedAmount: number;
    paidAmount?: number; // Cantidad pagada por usar la oferta
    offerName?: string; // Nombre de la oferta para historial
    category?: string; // Categoría de la oferta
    blockedUntil?: Timestamp; // Tiempo hasta que la oferta se desbloquee
  }[];
  totalSaved: number;
  points: number;
  level: number;
  achievements: string[];
  subscriptionEnd: Timestamp;
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial';
  subscriptionPlan: 'monthly' | 'yearly' | 'none';
  paymentMethod?: string;
  lastPaymentDate?: Timestamp;
  nextPaymentDate?: Timestamp;
  totalPaid: number;
  
  // Nuevos campos para datos individuales más detallados
  personalStats: {
    joinDate: Timestamp;
    lastLoginDate: Timestamp;
    totalOffersViewed: number;
    favoriteCategories: string[];
    preferredLanguage: string;
    notificationsEnabled: boolean;
  };
  
  financialHistory: {
    monthlyExpenses: { [month: string]: number }; // "2024-01": 150.50
    subscriptionHistory: {
      plan: string;
      startDate: Timestamp;
      endDate?: Timestamp;
      amount: number;
      status: string;
    }[];
    offerPayments: {
      offerId: string;
      amount: number;
      date: Timestamp;
      offerName: string;
    }[];
  };
  
  preferences: {
    favoriteLocations: string[];
    priceRange: { min: number; max: number };
    notificationSettings: {
      newOffers: boolean;
      flashDeals: boolean;
      subscriptionReminders: boolean;
    };
  };
  
  activityLog: {
    action: string;
    timestamp: Timestamp;
    details?: any;
  }[];
}

// Payment and Subscription interfaces
interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'offer_usage';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: Timestamp;
  createdAt: Timestamp;
  offerId?: string; // Para pagos de ofertas
  subscriptionPlan?: string; // Para pagos de suscripción
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // en días
  type: 'monthly' | 'yearly';
  features: string[];
}

// Offer data type
interface Offer {
  id: string;
  name: string;
  image: string;
  category: string;
  subCategory: string;
  discount: string;
  usagePrice?: number; // Precio por usar la oferta
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  isNew: boolean;
  price?: string;
  oldPrice?: string;
}

// Flash Deal interface
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
  discountedPrice: number; // Cambiado de flashPrice a discountedPrice
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  maxQuantity?: number;
  soldQuantity?: number;
}

// Category type
interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  subCategories: string[];
}

const categories: Category[] = [
  {
    id: 'restaurants',
    name: 'Restaurants',
    icon: <RestaurantIcon sx={{ fontSize: 28 }} />,
    subCategories: ['Vegan', 'Grill', 'Salad', 'Pizza', 'Fastfood', 'Italien', 'Chinois', 'Japonais', 'Indien', 'Mexicain', 'Français']
  },
  {
    id: 'bars',
    name: 'Bars',
    icon: <BarIcon sx={{ fontSize: 28 }} />,
    subCategories: ['Cocktails', 'Beers', 'Wines', 'Coffee', 'Tea', 'Pubs', 'Clubs', 'Lounge']
  },
  {
    id: 'bakeries',
    name: 'Bakeries',
    icon: <BakeryIcon sx={{ fontSize: 28 }} />,
    subCategories: ['Bread', 'Pastries', 'Sandwiches', 'Croissants', 'Cakes', 'Pies']
  },
  {
    id: 'shops',
    name: 'Shops',
    icon: <ShopIcon sx={{ fontSize: 28 }} />,
    subCategories: ['Clothing', 'Shoes', 'Accessories', 'Electronics', 'Home', 'Toys', 'Books', 'Music']
  },
  {
    id: 'clothing',
    name: 'Clothing',
    icon: <Checkroom />,
    subCategories: ['Men', 'Women', 'Kids', 'Sportswear', 'Formal', 'Casual', 'Luxury', 'Second-hand']
  },
  {
    id: 'grocery',
    name: 'Supermarkets',
    icon: <LocalGroceryStore />,
    subCategories: ['Fruits', 'Vegetables', 'Meat', 'Dairy', 'Bakery', 'Drinks', 'Frozen', 'Organic']
  },
  {
    id: 'beauty',
    name: 'Beauty',
    icon: <ContentCut />,
    subCategories: ['Hairdresser', 'Barbershop', 'Aesthetics', 'Manicure', 'Makeup', 'Perfumes', 'Cosmetics', 'Spa']
  },
  {
    id: 'health',
    name: 'Health',
    icon: <LocalPharmacy />,
    subCategories: ['Pharmacy', 'Optician', 'Dentist', 'Doctor', 'Physiotherapy', 'Psychology', 'Nutrition', 'Yoga']
  },
  {
    id: 'fitness',
    name: 'Sports',
    icon: <FitnessCenter />,
    subCategories: ['Gym', 'Pool', 'Tennis', 'Football', 'Basketball', 'Yoga', 'Pilates', 'CrossFit']
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: <Movie />,
    subCategories: ['Cinema', 'Theater', 'Museums', 'Parks', 'Bowling', 'Karaoke', 'Escape Room', 'Arcade']
  },
  {
    id: 'services',
    name: 'Services',
    icon: <LocalPrintshop />,
    subCategories: ['Laundry', 'Dry cleaner', 'Hairdresser', 'Workshop', 'Gas station', 'Bank', 'Post office', 'Copy shop']
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: <LocalTaxi />,
    subCategories: ['Taxi', 'Bus', 'Train', 'Car rental', 'Bicycles', 'Parking', 'Gas station', 'Workshop']
  },
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: <Hotel />,
    subCategories: ['Hotels', 'Hostels', 'Apartments', 'Camping', 'Resorts', 'B&B', 'Hostels']
  }
];

const initialOffers: Offer[] = [
  {
    id: '1',
    name: 'Pretty Patty Plainpalais',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80',
    category: 'restaurants',
    subCategory: 'Fastfood',
    discount: '20% sur toute la carte!',
    description: 'Délicieux burgers et frites dans un cadre moderne et convivial.',
    location: { lat: 46.2306, lng: 7.3590, address: 'Avenue de la Gare, Sion' },
    rating: 4.5,
    isNew: true,
    price: 'CHF 15',
    oldPrice: 'CHF 18'
  },
  {
    id: '2',
    name: 'Le Petit Bistrot',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
    category: 'restaurants',
    subCategory: 'Italien',
    discount: '15% sur les pizzas',
    description: 'Authentique cuisine italienne avec des ingrédients frais et locaux.',
    location: { lat: 46.2275, lng: 7.3593, address: 'Rue de Lausanne, Sion' },
    rating: 4.2,
    isNew: false,
    price: 'CHF 25',
    oldPrice: 'CHF 30'
  },
  {
    id: '3',
    name: 'Café Cuba',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
    category: 'bars',
    subCategory: 'Cocktails',
    discount: '2 pour 1 sur les cocktails',
    description: 'Ambiance cubaine avec des cocktails exotiques et de la musique live.',
    location: { lat: 46.2056, lng: 7.3011, address: 'Route de Verbier, Martigny' },
    rating: 4.7,
    isNew: true,
    price: 'CHF 12',
    oldPrice: 'CHF 24'
  },
  {
    id: '4',
    name: 'Boulangerie du Centre',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    category: 'bakeries',
    subCategory: 'Pain',
    discount: '30% sur les viennoiseries après 18h',
    description: 'Pain frais et viennoiseries traditionnelles faites maison.',
    location: { lat: 46.1627, lng: 7.2292, address: 'Avenue du Général-Guisan, Monthey' },
    rating: 4.3,
    isNew: false,
    price: 'CHF 3',
    oldPrice: 'CHF 4.50'
  },
  {
    id: '5',
    name: 'Sushi Master',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=400&q=80',
    category: 'restaurants',
    subCategory: 'Chinois',
    discount: 'Menu déjeuner à CHF 18',
    description: 'Sushi frais et cuisine japonaise authentique dans un cadre élégant.',
    location: { lat: 46.3023, lng: 7.5289, address: 'Bahnhofstrasse, Visp' },
    rating: 4.6,
    isNew: true,
    price: 'CHF 18',
    oldPrice: 'CHF 25'
  },
  {
    id: '6',
    name: 'Le Moulin Rouge',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=80',
    category: 'bars',
    subCategory: 'Vins',
    discount: 'Dégustation gratuite de vins',
    description: 'Cave à vin avec une sélection exceptionnelle de vins français et suisses.',
    location: { lat: 46.2044, lng: 6.1462, address: 'Rue du Diorama, Genève' },
    rating: 4.4,
    isNew: false,
    price: 'CHF 8',
    oldPrice: 'CHF 12'
  },
  {
    id: '7',
    name: 'Salon de Beauté Élégance',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
    category: 'beauty',
    subCategory: 'Peluquería',
    discount: '20% en cortes y coloración',
    description: 'Salón de belleza profesional con los mejores productos y técnicas.',
    location: { lat: 46.2014, lng: 6.1442, address: 'Rue de la Croix-d\'Or, Genève' },
    rating: 4.8,
    isNew: true,
    price: 'CHF 45',
    oldPrice: 'CHF 56'
  },
  {
    id: '8',
    name: 'Fitness Center Plus',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
    category: 'fitness',
    subCategory: 'Gimnasio',
    discount: 'Primer mes gratis',
    description: 'Gimnasio moderno con equipos de última generación y clases personalizadas.',
    location: { lat: 46.2034, lng: 6.1412, address: 'Rue du Mont-Blanc, Genève' },
    rating: 4.6,
    isNew: true,
    price: 'CHF 89',
    oldPrice: 'CHF 120'
  },
  {
    id: '9',
    name: 'Coop Supermercado',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    category: 'grocery',
    subCategory: 'Supermercado',
    discount: '10% en productos orgánicos',
    description: 'Supermercado con amplia selección de productos frescos y orgánicos.',
    location: { lat: 46.1994, lng: 6.1472, address: 'Rue du Marché, Genève' },
    rating: 4.2,
    isNew: false,
    price: 'CHF 25',
    oldPrice: 'CHF 28'
  },
  {
    id: '10',
    name: 'Cine Pathé Balexert',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
    category: 'entertainment',
    subCategory: 'Cine',
    discount: 'Entradas a mitad de precio los martes',
    description: 'Cine moderno con las últimas películas y la mejor calidad de imagen.',
    location: { lat: 46.2054, lng: 6.1492, address: 'Avenue Louis-Casaï, Genève' },
    rating: 4.5,
    isNew: false,
    price: 'CHF 15',
    oldPrice: 'CHF 30'
  },
  {
    id: '11',
    name: 'Farmacia Central',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80',
    category: 'health',
    subCategory: 'Farmacia',
    discount: '15% en productos de belleza',
    description: 'Farmacia con amplia gama de medicamentos y productos de cuidado personal.',
    location: { lat: 46.1974, lng: 6.1432, address: 'Rue du Rhône, Genève' },
    rating: 4.3,
    isNew: false,
    price: 'CHF 35',
    oldPrice: 'CHF 41'
  },
  {
    id: '12',
    name: 'Boutique Fashion',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    category: 'clothing',
    subCategory: 'Ropa',
    discount: '30% en toda la colección de verano',
    description: 'Boutique de moda con las últimas tendencias y marcas exclusivas.',
    location: { lat: 46.2024, lng: 6.1452, address: 'Rue de la Corraterie, Genève' },
    rating: 4.7,
    isNew: true,
    price: 'CHF 120',
    oldPrice: 'CHF 170'
  }
];

// Datos de ejemplo para ofertas flash
const initialFlashDeals: FlashDeal[] = [
  {
    id: 'flash1',
    name: 'Pizza Margherita Flash',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80',
    category: 'restaurants',
    subCategory: 'Italien',
    discount: '50% OFF',
    description: 'Pizza Margherita authentique avec des ingrédients frais. Offre limitée !',
    location: { lat: 46.2275, lng: 7.3593, address: 'Rue de Lausanne, Sion' },
    rating: 4.8,
    price: 'CHF 8',
    oldPrice: 'CHF 16',
    originalPrice: 16,
    discountedPrice: 8,
    startTime: new Date(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas desde ahora
    isActive: true,
    maxQuantity: 20,
    soldQuantity: 5
  },
  {
    id: 'flash2',
    name: 'Cocktail Mojito Flash',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
    category: 'bars',
    subCategory: 'Cocktails',
    discount: '60% OFF',
    description: 'Mojito cubain authentique avec du rhum premium. Seulement pour un temps limité !',
    location: { lat: 46.2056, lng: 7.3011, address: 'Route de Verbier, Martigny' },
    rating: 4.9,
    price: 'CHF 6',
    oldPrice: 'CHF 15',
    originalPrice: 15,
    discountedPrice: 6,
    startTime: new Date(),
    endTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 horas desde ahora
    isActive: true,
    maxQuantity: 15,
    soldQuantity: 8
  },
  {
    id: 'flash3',
    name: 'Croissant au Beurre Flash',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    category: 'bakeries',
    subCategory: 'Viennoiseries',
    discount: '40% OFF',
    description: 'Croissant artisanal au beurre français. Fraîchement cuit !',
    location: { lat: 46.2306, lng: 7.3590, address: 'Avenue de la Gare, Sion' },
    rating: 4.6,
    price: 'CHF 1.50',
    oldPrice: 'CHF 2.50',
    originalPrice: 2.5,
    discountedPrice: 1.5,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 horas desde ahora
    isActive: true,
    maxQuantity: 30,
    soldQuantity: 12
  }
];

// Funciones de utilidad para suscripciones y pagos
const checkSubscriptionStatus = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  const now = new Date();
  const subscriptionEnd = userProfile.subscriptionEnd.toDate();
  
  // Permitir acceso si está en período de prueba activo O si tiene suscripción activa
  return (userProfile.subscriptionStatus === 'trial' && subscriptionEnd > now) || 
         (userProfile.subscriptionStatus === 'active' && subscriptionEnd > now);
};

const checkTrialStatus = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  const now = new Date();
  const subscriptionEnd = userProfile.subscriptionEnd.toDate();
  
  return userProfile.subscriptionStatus === 'trial' && subscriptionEnd > now;
};

const getTrialDaysRemaining = (userProfile: UserProfile | null): number => {
  if (!userProfile || userProfile.subscriptionStatus !== 'trial') return 0;
  
  const now = new Date();
  const subscriptionEnd = userProfile.subscriptionEnd.toDate();
  const diffTime = subscriptionEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

const calculateNextPaymentDate = (planType: 'monthly' | 'yearly'): Date => {
  const now = new Date();
  if (planType === 'monthly') {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  }
};

const processSubscriptionPayment = async (userId: string, planId: string): Promise<boolean> => {
  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return false;

    // Simular procesamiento de pago (aquí integrarías con Stripe, PayPal, etc.)
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear registro de pago
    const paymentRef = doc(db, 'payments', paymentId);
    const payment: Payment = {
      id: paymentId,
      userId,
      amount: plan.price,
      currency: 'CHF',
      type: 'subscription',
      status: 'completed',
      date: Timestamp.now(),
      createdAt: Timestamp.now(),
      subscriptionPlan: planId
    };
    
    await setDoc(paymentRef, payment);
    
    // Actualizar perfil del usuario
    const userRef = doc(db, 'users', userId);
    const nextPaymentDate = calculateNextPaymentDate(plan.type);
    
    await updateDoc(userRef, {
      subscriptionStatus: 'active',
      subscriptionPlan: plan.type,
      subscriptionEnd: Timestamp.fromDate(nextPaymentDate),
      lastPaymentDate: Timestamp.now(),
      nextPaymentDate: Timestamp.fromDate(nextPaymentDate),
      totalPaid: plan.price
    });
    
    return true;
  } catch (error) {
    console.error('Error procesando pago de suscripción:', error);
    return false;
  }
};


const processOfferPayment = async (userId: string, offerId: string, offerPrice: number): Promise<boolean> => {
  try {
    // Calcular el precio basado en el coste de la oferta
    const usagePrice = offerPrice * OFFER_USAGE_PERCENTAGE;
    
    // Simular procesamiento de pago por uso de oferta
    const paymentId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear registro de pago
    const paymentRef = doc(db, 'payments', paymentId);
    const payment: Payment = {
      id: paymentId,
      userId,
      amount: usagePrice,
      currency: 'CHF',
      type: 'offer_usage',
      status: 'completed',
      date: Timestamp.now(),
      createdAt: Timestamp.now(),
      offerId
    };
    
    await setDoc(paymentRef, payment);
    
    // Actualizar perfil del usuario
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentProfile = userDoc.data() as UserProfile;
      await updateDoc(userRef, {
        totalPaid: currentProfile.totalPaid + usagePrice
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error procesando pago de oferta:', error);
    return false;
  }
};

// Datos de socios (como amigos en Snap) - Ya no se usa, ahora es dinámico
/*
const partnersData = [
  {
    id: 'mcdonalds',
    name: 'McDonald\'s',
    icon: '🍽️',
    location: { lat: 46.2306, lng: 7.3590 },
    address: 'Rue du Simplon, Sion',
    discount: '20% OFF'
  },
  {
    id: 'burger_king',
    name: 'Burger King',
    icon: '🍽️',
    location: { lat: 46.2310, lng: 7.3600 },
    address: 'Avenue de la Gare, Sion',
    discount: '15% OFF'
  },
  {
    id: 'kfc',
    name: 'KFC',
    icon: '🍽️',
    location: { lat: 46.2320, lng: 7.3610 },
    address: 'Rue du Rhône, Sion',
    discount: '25% OFF'
  },
  {
    id: 'subway',
    name: 'Subway',
    icon: '🍽️',
    location: { lat: 46.2330, lng: 7.3620 },
    address: 'Place de la Planta, Sion',
    discount: '30% OFF'
  }
];
*/

function MapView({ offers, flashDeals, selectedCategory, onOfferClick, onFlashDealClick, userLocation, getUserLocation, calculateDistance }: { 
  offers: Offer[], 
  flashDeals: FlashDeal[],
  selectedCategory: string, 
  onOfferClick: (offer: Offer) => void,
  onFlashDealClick: (deal: FlashDeal) => void,
  userLocation: {lat: number, lng: number} | null,
  getUserLocation: () => void,
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: ''
  });
  const [newOffer, setNewOffer] = useState({
    name: '',
    category: 'restaurants',
    subCategory: '',
    discount: '',
    description: '',
    address: '',
    rating: 4.5,
    price: '',
    oldPrice: ''
  });

  // Location state for UI
  const [locationError, setLocationError] = useState<string | null>(null);

  // Enhanced getUserLocation that also centers the map
  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        getUserLocation(); // Call the parent function
        
        // Center map on user location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(12);
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied by user.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  
  // Combinar ofertas de List y Flash, y filtrar por categoría
  const filteredOffers = useMemo(() => {
    // Convertir FlashDeals a formato compatible con Offer para el mapa
    const flashOffersAsOffers: Offer[] = flashDeals.map(deal => ({
      id: deal.id,
      name: deal.name,
      image: deal.image,
      category: deal.category,
      subCategory: deal.subCategory,
      discount: deal.discount,
      description: deal.description,
      location: deal.location,
      rating: deal.rating,
      isNew: true, // Las ofertas flash siempre son nuevas
      price: `CHF ${deal.discountedPrice}`,
      oldPrice: `CHF ${deal.originalPrice}`,
      usagePrice: deal.discountedPrice
    }));

    // Combinar ofertas regulares y flash
    const allOffers = [...offers, ...flashOffersAsOffers];
    
    let filtered = selectedCategory === 'all' 
      ? allOffers 
      : allOffers.filter(offer => offer.category === selectedCategory);

    // Sort by distance if user location is available
    if (userLocation) {
      filtered = filtered
        .map(offer => ({
          ...offer,
          distance: calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            offer.location.lat, 
            offer.location.lng
          )
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    return filtered;
  }, [offers, selectedCategory, userLocation]);

  useEffect(() => {
    // Cargar Google Maps API
    const loadGoogleMaps = async () => {
      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        if (mapRef.current && !mapInstanceRef.current && window.google) {
          // Centrar el mapa en Valais (coordenadas del cantón)
          const valaisCenter = { lat: 46.2097, lng: 7.6056 };
          // Aproximación de límites del cantón du Valais
          const valaisBounds = new window.google.maps.LatLngBounds(
            { lat: 45.8, lng: 6.8 }, // Sudoeste
            { lat: 46.6, lng: 8.7 }  // Noreste
          );
          
          const map = new window.google.maps.Map(mapRef.current, {
            center: valaisCenter,
            zoom: 10,
            // Restringir ligeramente la navegación a la zona de Valais
            restriction: { latLngBounds: { north: 46.6, south: 45.8, west: 6.8, east: 8.7 }, strictBounds: false },
            disableDefaultUI: true,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            styles: []
          });

          // Encajar el mapa a los límites del Valais
          map.fitBounds(valaisBounds);
          
          mapInstanceRef.current = map;
          setMapLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError(true);
      }
    };

    // Timeout para detectar si Google Maps no carga
    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        console.log('Google Maps timeout - showing fallback');
        setMapError(true);
      }
    }, 10000); // 10 segundos

    loadGoogleMaps();

    return () => clearTimeout(timeout);
  }, [mapLoaded]);

  // Actualizar marcadores cuando cambian las ofertas filtradas
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Agregar nuevos marcadores
    filteredOffers.forEach((offer) => {
      if (!window.google) return;
      
      // Determinar si es una oferta flash o regular
      const isFlashDeal = flashDeals.some(deal => deal.id === offer.id);
      
      const marker = new window.google.maps.Marker({
        position: { lat: offer.location.lat, lng: offer.location.lng },
        map: mapInstanceRef.current,
        title: offer.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad${offer.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:${isFlashDeal ? '#FF6B35' : '#FFD700'};stop-opacity:1" />
                  <stop offset="100%" style="stop-color:${isFlashDeal ? '#FF4500' : '#FFA000'};stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="18" fill="url(#grad${offer.id})" stroke="white" stroke-width="2" opacity="0.95"/>
              <circle cx="20" cy="20" r="14" fill="rgba(26, 26, 26, 0.9)" stroke="white" stroke-width="1"/>
              ${isFlashDeal ? `
                <path d="M16 12h8l-2 6h6l-8 8 2-6h-6z" fill="white" transform="translate(4, 4) scale(1.2)"/>
              ` : offer.category === 'restaurants' ? `
                <path d="M12 16h16v2H12zm0 4h16v2H12zm0 4h12v2H12z" fill="white" transform="translate(4, 4) scale(1.5)"/>
                <path d="M14 18h12v1H14z" fill="#FFD700" transform="translate(4, 4) scale(1.5)"/>
              ` : offer.category === 'bars' ? `
                <path d="M16 14h8v8h-8z" fill="white" transform="translate(4, 4) scale(1.2)"/>
                <path d="M17 15h6v6h-6z" fill="#FFD700" transform="translate(4, 4) scale(1.2)"/>
                <path d="M20 12v2" stroke="white" stroke-width="1" transform="translate(4, 4) scale(1.2)"/>
              ` : offer.category === 'shops' ? `
                <path d="M12 14h16v8H12z" fill="white" transform="translate(4, 4) scale(1.2)"/>
                <path d="M14 16h12v4H14z" fill="#FFD700" transform="translate(4, 4) scale(1.2)"/>
                <path d="M18 14v8M22 14v8" stroke="white" stroke-width="1" transform="translate(4, 4) scale(1.2)"/>
              ` : offer.category === 'beauty' ? `
                <path d="M16 14c0-2 2-4 4-4s4 2 4 4v2h-8v-2z" fill="white" transform="translate(4, 4) scale(1.2)"/>
                <path d="M14 18h12v4H14z" fill="#FFD700" transform="translate(4, 4) scale(1.2)"/>
              ` : offer.category === 'fitness' ? `
                <path d="M16 12h8v8h-8z" fill="white" transform="translate(4, 4) scale(1.2)"/>
                <path d="M18 14h4v4h-4z" fill="#FFD700" transform="translate(4, 4) scale(1.2)"/>
                <circle cx="20" cy="16" r="1" fill="white" transform="translate(4, 4) scale(1.2)"/>
              ` : `
                <path d="M14 14h12v8H14z" fill="white" transform="translate(4, 4) scale(1.2)"/>
                <path d="M16 16h8v4H16z" fill="#FFD700" transform="translate(4, 4) scale(1.2)"/>
              `}
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      });

      // Info window con información de la oferta
      const distanceText = (offer as any).distance ? `📍 ${(offer as any).distance.toFixed(1)} km` : '';
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
              <h3 style="margin: 0; color: #333;">${offer.name}</h3>
              ${isFlashDeal ? '<span style="background: #FF6B35; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">FLASH</span>' : ''}
            </div>
            <p style="margin: 0 0 5px 0; color: #e74c3c; font-weight: bold;">${offer.discount}</p>
            <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${offer.description}</p>
            <p style="margin: 0; color: #999; font-size: 11px;">⭐ ${offer.rating} • ${offer.location.address}</p>
            ${distanceText ? `<p style="margin: 5px 0 0 0; color: #4caf50; font-size: 11px; font-weight: bold;">${distanceText}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        if (isFlashDeal) {
          onFlashDealClick(offer as any);
        } else {
          onOfferClick(offer);
        }
      });

      markersRef.current.push(marker);
    });
  }, [filteredOffers, flashDeals, onOfferClick, onFlashDealClick, mapLoaded]);

  // Auto-request location when map loads
  useEffect(() => {
    if (mapLoaded && !userLocation && !locationError) {
      handleGetUserLocation();
    }
  }, [mapLoaded]);

  // (Eliminado) Lógica de búsqueda de lugares y handlers

  // Función para manejar el login
  const handleLogin = () => {
    // Credenciales de admin (en producción esto debería estar en Firebase)
    const adminCredentials = {
      username: 'admin',
      password: 'luca2024'
    };

    if (loginCredentials.username === adminCredentials.username && 
        loginCredentials.password === adminCredentials.password) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginCredentials({ username: '', password: '' });
      alert('¡Bienvenido, Admin!');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  // Función para manejar el logout
  const handleLogout = () => {
    setIsAdmin(false);
    alert('Sesión cerrada');
  };

  // Función para agregar nueva oferta
  const handleAddOffer = async () => {
    if (!newOffer.name || !newOffer.address) {
      alert('Por favor completa el nombre y la dirección');
      return;
    }

    try {
      // Geocodificar la dirección para obtener coordenadas
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: newOffer.address + ', Valais, Switzerland' }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          
          const offer: Offer = {
            id: Date.now().toString(),
            name: newOffer.name,
            image: '/api/placeholder/150/150',
            category: newOffer.category,
            subCategory: newOffer.subCategory,
            discount: newOffer.discount,
            description: newOffer.description,
            location: {
              lat: location.lat(),
              lng: location.lng(),
              address: newOffer.address
            },
            rating: newOffer.rating,
            isNew: true,
            price: newOffer.price,
            oldPrice: newOffer.oldPrice
          };

          // Aquí guardaríamos en Firebase
          console.log('Nueva oferta:', offer);
          
          // Limpiar formulario y cerrar modal
          setNewOffer({
            name: '',
            category: 'restaurants',
            subCategory: '',
            discount: '',
            description: '',
            address: '',
            rating: 4.5,
            price: '',
            oldPrice: ''
          });
          setShowAddModal(false);
          
          // Recargar el mapa con la nueva oferta
          window.location.reload();
    } else {
          alert('No se pudo encontrar la dirección. Intenta con una dirección más específica.');
        }
      });
    } catch (error) {
      console.error('Error adding offer:', error);
      alert('Error al agregar la oferta');
    }
  };

  return (
    <Box 
      id="map"
      data-map-container
      className="map-container no-select"
      sx={{ 
        height: { xs: 'calc(100vh - 300px)', sm: 'calc(100vh - 350px)' }, 
        position: 'relative', 
        borderRadius: { xs: 0, sm: 2 }, 
        overflow: 'hidden',
        width: '100%',
        touchAction: 'pan-x pan-y',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: { xs: '20px', sm: '20px' }
      }}
    >
      {/* (Eliminada) Barra de búsqueda */}

      {/* (Eliminados) Resultados de búsqueda */}

      {/* Botones de control del mapa */}
      <Box sx={{
        position: 'absolute',
        bottom: { xs: 10, sm: 20 },
        right: { xs: 10, sm: 20 },
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 1 }, // Aumentado el gap en móvil de 1 a 2
        minWidth: { xs: '100px', sm: '120px' }
      }}>

        {/* Debug info - Solo en desktop */}
        <Box sx={{
          display: { xs: 'none', sm: 'block' },
          bgcolor: 'rgba(0,0,0,0.8)',
          color: 'white',
          p: 1,
          borderRadius: 1,
          fontSize: '10px',
          textAlign: 'center'
        }}>
          Admin: {isAdmin ? 'Sí' : 'No'}
        </Box>
        {/* Botón para agregar nueva oferta (solo admin) */}
        {isAdmin && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1 },
            bgcolor: '#2196f3',
            color: 'white',
            borderRadius: { xs: 1, sm: 2 },
            px: { xs: 2, sm: 2 },
            py: { xs: 1, sm: 1 },
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#45a049',
            }
          }}
          onClick={() => setShowAddModal(true)}
          >
            <Add sx={{ fontSize: { xs: 16, sm: 20 } }} />
            <Typography variant="body2" sx={{ 
              fontWeight: 'bold', 
              fontSize: { xs: '10px', sm: '12px' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Add
            </Typography>
          </Box>
        )}

        {/* Botón de logout (solo si es admin) */}
        {isAdmin && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1 },
            bgcolor: '#2196f3',
            color: 'white',
            borderRadius: { xs: 1, sm: 2 },
            px: { xs: 2, sm: 2 },
            py: { xs: 1, sm: 1 },
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#fbc02d',
            }
          }}
          onClick={handleLogout}
          >
            <Close sx={{ fontSize: { xs: 16, sm: 20 } }} />
            <Typography variant="body2" sx={{ 
              fontWeight: 'bold', 
              fontSize: { xs: '10px', sm: '12px' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Logout
            </Typography>
          </Box>
        )}

        {/* Botón de ubicación actual */}
        <IconButton
          size={window.innerWidth < 600 ? 'small' : 'medium'}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            width: { xs: 36, sm: 48 },
            height: { xs: 36, sm: 48 },
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 1)',
            }
          }}
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };
                  mapInstanceRef.current.setCenter(pos);
                  mapInstanceRef.current.setZoom(15);
                },
                () => {
                  console.log('Error getting location');
                }
              );
            }
          }}
                  >
            <MyLocationIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
          </IconButton>
      </Box>

      {mapError ? (
        // Fallback cuando Google Maps no carga
        <Box sx={{ 
          height: '100%', 
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: '8px'
        }}>
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              🗺️ <span style={{ color: '#ffeb3b' }}>FLASH</span> Map
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
              Vue interactive des offres <span style={{ color: '#ffeb3b' }}>FLASH</span>
            </Typography>
            
            {/* Marcadores simulados */}
            {filteredOffers.map((offer, index) => (
              <Box
                key={offer.id}
                sx={{
                  position: 'absolute',
                  left: `${20 + (index * 15)}%`,
                  top: `${30 + (index * 10)}%`,
                  cursor: 'pointer',
                  zIndex: 2
                }}
                onClick={() => onOfferClick(offer)}
              >
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: offer.isNew ? '#2196f3' : '#2196f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    transition: 'transform 0.2s'
                  }
                }}>
                  {offer.category === 'restaurants' ? '🍽️' : 
                   offer.category === 'bars' ? '🍷' : '🥖'}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            borderRadius: '8px',
            background: '#ffffff'
          }} 
        />
      )}

      {/* Modal para agregar nueva oferta */}
      <Dialog 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">➕ Add New Offer</Typography>
            <IconButton onClick={() => setShowAddModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Business name"
              value={newOffer.name}
              onChange={(e) => setNewOffer({...newOffer, name: e.target.value})}
              fullWidth
              required
            />
            
            <TextField
              label="Adresse"
              value={newOffer.address}
              onChange={(e) => setNewOffer({...newOffer, address: e.target.value})}
              fullWidth
              required
              placeholder="Ej: Rue du Rhône 1, Genève"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Categoría"
                value={newOffer.category}
                onChange={(e) => setNewOffer({...newOffer, category: e.target.value})}
                fullWidth
              >
                <option value="restaurants">Restaurantes</option>
                <option value="bars">Bares</option>
                <option value="bakeries">Boulangeries</option>
              </TextField>

              <TextField
                label="Subcategoría"
                value={newOffer.subCategory}
                onChange={(e) => setNewOffer({...newOffer, subCategory: e.target.value})}
                fullWidth
                placeholder="Ej: Pizza, Café, etc."
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Réduction/Offre"
                value={newOffer.discount}
                onChange={(e) => setNewOffer({...newOffer, discount: e.target.value})}
                fullWidth
                placeholder="Ej: -20% en pizzas"
              />

              <TextField
                label="Prix"
                value={newOffer.price}
                onChange={(e) => setNewOffer({...newOffer, price: e.target.value})}
                fullWidth
                placeholder="Ej: CHF 25"
              />
            </Box>

            <TextField
              label="Description"
              value={newOffer.description}
              onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe la oferta..."
            />

            <TextField
              label="Rating"
              type="number"
              value={newOffer.rating}
              onChange={(e) => setNewOffer({...newOffer, rating: parseFloat(e.target.value)})}
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddOffer}
            variant="contained"
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          >
            Ajouter Offre
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de login para admin */}
      <Dialog 
        open={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">🔐 Accès Administrateur</Typography>
            <IconButton onClick={() => setShowLoginModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Username"
              value={loginCredentials.username}
              onChange={(e) => setLoginCredentials({...loginCredentials, username: e.target.value})}
              fullWidth
              required
              placeholder="admin"
            />
            
            <TextField
              label="Password"
              type="password"
              value={loginCredentials.password}
              onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
              fullWidth
              required
              placeholder="••••••••"
            />

            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Test credentials:</strong><br/>
                User: <code>admin</code><br/>
                Password: <code>luca2024</code>
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoginModal(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleLogin}
            variant="contained"
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1565c0' } }}
          >
            Sign in
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

function OffersList({ offers, selectedCategory, selectedSubCategory, onOfferClick, currentUser, userProfile, setUserProfile, addNotification, userLocation, calculateDistance }: {
  offers: Offer[],
  selectedCategory: string,
  selectedSubCategory: string,
  onOfferClick: (offer: Offer) => void,
  currentUser: User | null,
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  addNotification: (type: 'success' | 'info' | 'warning', message: string) => void,
  userLocation: {lat: number, lng: number} | null,
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
}) {
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [swipedOffers, setSwipedOffers] = useState<Set<string>>(new Set());
  const [explosions, setExplosions] = useState<Set<string>>(new Set());

  // Función para limpiar ofertas expiradas del estado local
  const cleanupExpiredOffers = () => {
    if (!userProfile) return;
    
    const now = new Date();
    const expiredOfferIds = userProfile.activatedOffers
      .filter(ao => ao.blockedUntil && ao.blockedUntil.toDate() <= now)
      .map(ao => ao.offerId);
    
    if (expiredOfferIds.length > 0) {
      setSwipedOffers(prev => {
        const newSet = new Set(prev);
        expiredOfferIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  // Ejecutar limpieza cada minuto
  useEffect(() => {
    const interval = setInterval(cleanupExpiredOffers, 60000); // 60 segundos
    return () => clearInterval(interval);
  }, [userProfile]);

  const filteredOffers = useMemo(() => {
    let filtered = offers.filter(offer => {
      if (selectedCategory !== 'all' && offer.category !== selectedCategory) return false;
      if (selectedSubCategory !== 'all' && offer.subCategory !== selectedSubCategory) return false;
      return true;
    });

    // Sort by distance if user location is available
    if (userLocation) {
      filtered = filtered
        .map(offer => ({
          ...offer,
          distance: calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            offer.location.lat, 
            offer.location.lng
          )
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    return filtered;
  }, [offers, selectedCategory, selectedSubCategory, userLocation, calculateDistance]);

  const handleSlideToActivate = (offer: Offer) => {
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Show activation countdown modal
    setSelectedOffer(offer);
    setShowActivationModal(true);
  };

  const handleActivationComplete = async () => {
    if (!selectedOffer) return;
    
    const offerId = selectedOffer.id;
    
    // Trigger explosion effect
    setExplosions(prev => new Set([...prev, offerId]));
    
    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // Remove explosion after animation
    setTimeout(() => {
      setExplosions(prev => {
        const newSet = new Set(prev);
        newSet.delete(offerId);
        return newSet;
      });
    }, 1500);

    // Activar la oferta en el perfil del usuario
    if (selectedOffer.price && selectedOffer.oldPrice) {
      const savedAmount = parseFloat(selectedOffer.oldPrice.replace('CHF ', '')) - parseFloat(selectedOffer.price.replace('CHF ', ''));
      try {
        if (currentUser && userProfile) {
          const userRef = doc(db, 'users', currentUser.uid);
          // Calcular tiempo de bloqueo (15 minutos)
          const blockedUntil = new Date();
          blockedUntil.setMinutes(blockedUntil.getMinutes() + 15);
          
          const newActivation = {
            offerId,
            activatedAt: Timestamp.now(),
            savedAmount,
            blockedUntil: Timestamp.fromDate(blockedUntil)
          };

          // Calcular puntos (10 puntos por oferta + 1 punto por cada CHF ahorrado)
          const pointsEarned = 10 + Math.floor(savedAmount);
          const newPoints = userProfile.points + pointsEarned;
          const newLevel = Math.floor(newPoints / 100) + 1; // Nuevo nivel cada 100 puntos
          
          await updateDoc(userRef, {
            activatedOffers: arrayUnion(newActivation),
            totalSaved: userProfile.totalSaved + savedAmount,
            points: newPoints,
            level: newLevel
          });

          // Actualizar el estado local
          setUserProfile(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              activatedOffers: [...prev.activatedOffers, newActivation],
              totalSaved: prev.totalSaved + savedAmount,
              points: newPoints,
              level: newLevel
            };
          });
        }
        // Show activation message
        setTimeout(() => {
          addNotification('success', `Offre activée • Économie: ${savedAmount.toFixed(2)} CHF`);
        }, 800);
      } catch (error) {
        console.error('Error activating offer:', error);
        addNotification('warning', 'Erreur lors de l\'activation. Veuillez réessayer.');
      }
    }
    
    // Mark as activated
    setSwipedOffers(prev => new Set([...prev, offerId]));
    
    // Close modal
    setShowActivationModal(false);
    setSelectedOffer(null);
  };

  return (
    <>
      <Box sx={{ 
        height: { xs: 'calc(100vh - 120px)', sm: '70vh' },
        mb: 3, 
        overflow: 'auto',
        width: '100%'
      }}>
        {filteredOffers.map((offer) => {
          // Verificar si la oferta está activada localmente (swiped)
          const isSwiped = swipedOffers.has(offer.id);
          
          // Verificar si la oferta está bloqueada según el perfil del usuario
          const activatedOffer = userProfile?.activatedOffers.find(ao => ao.offerId === offer.id);
          const isBlocked = activatedOffer?.blockedUntil && activatedOffer.blockedUntil.toDate() > new Date();
          
          const isActivated = isSwiped || isBlocked;
          const isExploding = explosions.has(offer.id);
          
          return (
          <Box
            key={offer.id}
            className="offer-card"
            sx={{
              position: 'relative',
              mb: { xs: 3, sm: 4 },
              overflow: 'visible',
              borderRadius: { xs: 1, sm: 2 }
            }}
          >
            {/* Lightning Effect */}
            {isExploding && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'lightningBolt 1.2s ease-out forwards',
                  zIndex: 10000,
                  '@keyframes lightningBolt': {
                    '0%': {
                      transform: 'scale(0) rotate(0deg)',
                      opacity: 1
                    },
                    '20%': {
                      transform: 'scale(1.5) rotate(5deg)',
                      opacity: 1
                    },
                    '40%': {
                      transform: 'scale(2.2) rotate(-3deg)',
                      opacity: 0.9
                    },
                    '60%': {
                      transform: 'scale(2.8) rotate(2deg)',
                      opacity: 0.8
                    },
                    '80%': {
                      transform: 'scale(3.2) rotate(-1deg)',
                      opacity: 0.6
                    },
                    '100%': {
                      transform: 'scale(3.5) rotate(0deg)',
                      opacity: 0
                    }
                  }
                }}
              >
                <FlashOn sx={{ 
                  fontSize: { xs: 200, sm: 300, md: 400 },
                  color: '#2196f3',
                  filter: 'drop-shadow(0 0 20px #2196f3) drop-shadow(0 0 40px #2196f3) drop-shadow(0 0 60px #2196f3)',
                  width: '100vw',
                  height: '100vh',
                  objectFit: 'contain'
                }} />
              </Box>
            )}
            
            <Card 
              sx={{ 
                cursor: 'pointer',
                borderRadius: { xs: 1, sm: 2 },
                position: 'relative',
                zIndex: 2,
                opacity: isActivated ? 0.9 : 1,
                filter: isActivated ? 'grayscale(20%)' : 'none',
                overflow: 'hidden'
              }} 
              onClick={() => onOfferClick(offer)}
            >
              {/* Static Image */}
              <Box 
                sx={{ 
                  position: 'relative',
                  height: { xs: 150, sm: 200 },
                  overflow: 'hidden'
                }}
              >
                <CardMedia
                  component="img"
                  height="100%"
                  image={offer.image || 'https://via.placeholder.com/300x150/333333/FFFFFF?text=Restaurant'}
                  alt={offer.name}
                  sx={{ 
                    height: '100%',
                    backgroundColor: '#333333',
                    objectFit: 'cover'
                  }}
                />
                {offer.isNew && (
                  <Chip
                    label="Nouveau"
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontWeight: 'bold'
                    }}
                  />
                )}
                {isActivated && (
                  <>
                    {isBlocked && activatedOffer?.blockedUntil ? (
                      <BlockedOfferTimer 
                        blockedUntil={activatedOffer.blockedUntil}
                        onExpire={() => {
                          // Cuando expire el tiempo, remover de swipedOffers si está ahí
                          setSwipedOffers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(offer.id);
                            return newSet;
                          });
                        }}
                      />
                    ) : (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            background: 'rgba(76, 175, 80, 0.95)',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                          }}
                        >
                          <LockIcon sx={{ fontSize: 16 }} />
                          ACTIVÉE
                        </Box>
                        {userProfile?.activatedOffers?.find(activation => 
                          activation.offerId === offer.id && 
                          activation.blockedUntil && 
                          activation.blockedUntil.toDate() > new Date()
                        )?.blockedUntil && (
                          <BlockedOfferTimer
                            blockedUntil={userProfile.activatedOffers.find(activation => 
                              activation.offerId === offer.id && 
                              activation.blockedUntil && 
                              activation.blockedUntil.toDate() > new Date()
                            )!.blockedUntil!}
                            onExpire={() => {
                              // Refresh user profile to update UI
                              if (currentUser) {
                                // Force re-render by updating state
                                setUserProfile(prev => prev ? { ...prev } : null);
                              }
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                <Box sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1
                }}>
                  <Star sx={{ fontSize: 16, color: '#ffeb3b' }} />
                  <Typography variant="body2">{offer.rating}</Typography>
                </Box>
              </Box>
              
              <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {offer.name}
                </Typography>
                <Typography variant="body2" color="error" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {offer.discount}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 1, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: '-webkit-box',
                  WebkitLineClamp: { xs: 2, sm: 3 },
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {offer.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationIcon sx={{ fontSize: '1rem', color: '#888' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {offer.location.address}
                    </Typography>
                    {(offer as any).distance && (
                      <Typography variant="body2" color="primary" sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        fontWeight: 'bold',
                        ml: 1
                      }}>
                        📍 {(offer as any).distance.toFixed(1)} km
                      </Typography>
                    )}
                  </Box>
                  {offer.price && offer.oldPrice && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {offer.price}
                      </Typography>
                      <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                        {offer.oldPrice}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Slide button to activate offer (only if not activated) */}
                {!isActivated && (
                  <Box sx={{ mt: 2 }} onClick={(e) => e.stopPropagation()}>
                    <SlideToConfirmButton
                      onConfirm={() => handleSlideToActivate(offer)}
                      text="Glisse pour activer ⚡"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
          );
        })}
      </Box>
      
      {/* Activation Countdown Modal */}
      {selectedOffer && (
        <Dialog
          open={showActivationModal}
          onClose={() => {}}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
              borderRadius: 3,
              overflow: 'hidden'
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          <DialogContent sx={{ p: 4, textAlign: 'center' }}>
            {/* Lightning icon */}
            <Box sx={{ mb: 3 }}>
              <FlashOn sx={{ 
                fontSize: 80, 
                color: '#2196f3',
                filter: 'drop-shadow(0 0 20px #2196f3)',
                animation: 'pulse 1s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' }
                }
              }} />
            </Box>

            {/* Offer name */}
            <Typography variant="h4" sx={{ 
              color: '#2196f3', 
              fontWeight: 'bold', 
              mb: 2
            }}>
              {selectedOffer.name}
            </Typography>

            {/* Countdown timer - starts at 60 seconds */}
            <ActivationCountdownTimer 
              onComplete={handleActivationComplete}
              duration={60}
            />
            
            <Typography variant="body1" sx={{ 
              color: '#bbb', 
              mt: 3
            }}>
              Votre offre s'activera automatiquement
            </Typography>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Simple countdown timer component
function ActivationCountdownTimer({ onComplete, duration }: { onComplete: () => void, duration: number }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progressPercentage = ((duration - timeLeft) / duration) * 100;
  
  return (
    <Box>
      <Typography variant="h2" sx={{ 
        color: '#2196f3', 
        fontWeight: 'bold',
        fontFamily: 'monospace',
        mb: 2,
        textShadow: '0 0 10px #2196f3'
      }}>
        {formatTime(timeLeft)}
      </Typography>
      
      <Box sx={{ 
        width: '100%', 
        height: 8, 
        backgroundColor: '#333', 
        borderRadius: 4,
        overflow: 'hidden',
        mb: 2
      }}>
        <Box sx={{ 
          width: `${progressPercentage}%`, 
          height: '100%', 
          background: 'linear-gradient(90deg, #2196f3, #1976d2)',
          transition: 'width 0.3s ease',
          borderRadius: 4
        }} />
      </Box>
      
      <Box sx={{ 
        position: 'relative', 
        display: 'inline-flex',
        mb: 2
      }}>
        <CircularProgress
          variant="determinate"
          value={progressPercentage}
          size={120}
          thickness={4}
          sx={{
            color: '#2196f3',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" sx={{ 
            color: '#2196f3', 
            fontWeight: 'bold'
          }}>
            {Math.round(progressPercentage)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Componente para las ofertas flash con temporizador - ELIMINADO, ahora se usa FlashDealsWithBlocking



// Componente para gestión de prueba gratuita
function TrialModal({ 
  open, 
  onClose, 
  userProfile, 
  setUserProfile, 
  currentUser,
  addNotification
}: { 
  open: boolean, 
  onClose: () => void, 
  userProfile: UserProfile | null, 
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>, 
  currentUser: User | null,
  addNotification: (type: 'success' | 'info' | 'warning', message: string) => void
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const handleStartTrial = async () => {
    if (!currentUser || !userProfile) return;
    
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 días de prueba
      
      await updateDoc(userRef, {
        subscriptionStatus: 'trial',
        subscriptionEnd: Timestamp.fromDate(trialEndDate),
        subscriptionPlan: 'none',
        paymentMethod: 'card_on_file' // Indicar que tienen tarjeta registrada
      });
      
      // Actualizar el perfil local
      setUserProfile({
        ...userProfile,
        subscriptionStatus: 'trial',
        subscriptionEnd: Timestamp.fromDate(trialEndDate),
        subscriptionPlan: 'none'
      });
      
      onClose();
      addNotification('success', '🎉 Essai gratuit de 7 jours activé!');
    } catch (error) {
      console.error('Error starting trial:', error);
      addNotification('warning', 'Erreur lors de l\'activation de l\'essai gratuit');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          🎉 Essai Gratuit
        </Typography>
        <Typography variant="h6">
          7 jours d'accès complet à FLASH
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#4caf50' }}>
            Commencez votre essai gratuit maintenant!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Accédez à toutes les fonctionnalités de FLASH pendant 7 jours, 
            puis choisissez votre plan d'abonnement.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            💳 Informations de carte requises
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Nous avons besoin de votre carte pour commencer l'essai gratuit. 
            Vous ne serez pas facturé pendant la période d'essai.
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Numéro de carte"
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
              placeholder="1234 5678 9012 3456"
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Date d'expiration"
                value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                placeholder="MM/AA"
                sx={{ flex: 1 }}
              />
              <TextField
                label="CVV"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                placeholder="123"
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label="Nom du titulaire"
              value={cardDetails.cardholderName}
              onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
              placeholder="Jean Dupont"
              fullWidth
            />
          </Box>
        </Box>

        <Box sx={{ 
          bgcolor: '#f5f5f5', 
          p: 3, 
          borderRadius: 2,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            ✅ Ce qui est inclus dans votre essai:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" sx={{ mb: 1 }}>
              Accès complet à toutes les offres FLASH
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              Activation illimitée d'offres
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              Accès aux offres flash exclusives
            </Typography>
            <Typography component="li" sx={{ mb: 1 }}>
              Support client prioritaire
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="large"
          sx={{ flex: 1 }}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleStartTrial}
          variant="contained"
          size="large"
          disabled={isProcessing || !cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName}
          sx={{ 
            flex: 1,
            bgcolor: '#4caf50',
            '&:hover': { bgcolor: '#45a049' }
          }}
        >
          {isProcessing ? 'Activation...' : 'Commencer l\'essai gratuit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Componente para gestión de suscripciones
function SubscriptionModal({ 
  open, 
  onClose, 
  userProfile, 
  setUserProfile, 
  currentUser
}: { 
  open: boolean, 
  onClose: () => void, 
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  currentUser: User | null
}) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleSubscribe = async () => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    try {
      const success = await processSubscriptionPayment(currentUser.uid, selectedPlan);
      if (success) {
        const planPrice = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price || 0;
        
        // Registrar la suscripción
        // await recordSubscription(selectedPlan, planPrice); // TODO: Mover esta función al scope correcto
        
        // Actualizar el perfil local
        const updatedProfile = userProfile ? {
          ...userProfile,
          subscriptionStatus: 'active' as const,
          subscriptionPlan: selectedPlan as 'monthly' | 'yearly',
          subscriptionEnd: Timestamp.fromDate(calculateNextPaymentDate(selectedPlan as 'monthly' | 'yearly')),
          lastPaymentDate: Timestamp.now(),
          nextPaymentDate: Timestamp.fromDate(calculateNextPaymentDate(selectedPlan as 'monthly' | 'yearly')),
          totalPaid: userProfile.totalPaid + planPrice
        } : null;
        
        setUserProfile(updatedProfile);
        onClose();
        alert('Abonnement activé avec succès !');
      } else {
        alert('Erreur lors du traitement du paiement. Réessayez.');
      }
    } catch (error) {
      console.error('Error en suscripción:', error);
      alert('Erreur lors du traitement de l\'abonnement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentUser || !userProfile) return;
    
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        subscriptionStatus: 'cancelled',
        subscriptionEnd: Timestamp.now() // Terminar inmediatamente
      });
      
      // Actualizar el perfil local
      setUserProfile({
        ...userProfile,
        subscriptionStatus: 'cancelled',
        subscriptionEnd: Timestamp.now()
      });
      
      setShowCancelDialog(false);
      onClose();
      alert('Abonnement annulé avec succès. Votre accès se terminera à la fin de la période actuelle.');
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      alert('Erreur lors de l\'annulation de l\'abonnement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isSubscriptionActive = checkSubscriptionStatus(userProfile);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        color: '#333',
        textAlign: 'center',
        py: 3
      }}>
        {isSubscriptionActive ? t('gestionAbonnement') : t('activerAbonnement')}
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        {isSubscriptionActive ? (
          // Mostrar información de suscripción activa
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('abonnementActif')}
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body1">
                <strong>{t('plan')} :</strong> {userProfile?.subscriptionPlan === 'monthly' ? t('planMensuel') : t('planAnnuel')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('prochainPaiement')} :</strong> {userProfile?.nextPaymentDate?.toDate().toLocaleDateString()}
              </Typography>
              <Typography variant="body1">
                <strong>Total payé :</strong> CHF {userProfile?.totalPaid?.toFixed(2)}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('abonnementRenouvellement')}
              </Typography>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => setShowCancelDialog(true)}
                disabled={isProcessing}
              >
                {t('annulerAbonnement')}
              </Button>
            </Box>
          </Box>
        ) : (
          // Mostrar planes de suscripción
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('choisirPlanAbonnement')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('besoinAbonnementActif')}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <Card 
                  key={plan.id}
                  sx={{ 
                    flex: 1,
                    border: selectedPlan === plan.id ? '2px solid #ffeb3b' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffeb3b', fontWeight: 'bold' }}>
                      CHF {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.type === 'monthly' ? 'par mois' : 'par an'}
                    </Typography>
                    
                    <List dense>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Star sx={{ color: '#ffeb3b', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          {isSubscriptionActive ? t('fermer') : t('annuler')}
        </Button>
        {!isSubscriptionActive && (
          <Button 
            onClick={handleSubscribe}
            variant="contained"
            disabled={isProcessing}
            sx={{
              background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #fbc02d 0%, #fbc02d 100%)',
              }
            }}
          >
            {isProcessing ? 'Traitement...' : 'S\'abonner'}
          </Button>
        )}
      </DialogActions>

      {/* Dialogue de confirmation pour annuler l'abonnement */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>{t('annulerAbonnement')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {t('confirmerAnnulationAbonnement')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Votre accès à FLASH se terminera immédiatement et vous ne pourrez plus utiliser les offres jusqu'à ce que vous vous abonniez à nouveau.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)} color="inherit">
            {t('nonGarderAbonnement')}
          </Button>
          <Button 
            onClick={handleCancelSubscription}
            color="error"
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? t('annulationEnCours') : t('ouiAnnuler')}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}


// Modal de suscripción requerida (no se puede cerrar)
function SubscriptionRequiredModal({ 
  open, 
  onSubscribe 
}: { 
  open: boolean, 
  onSubscribe: () => void 
}) {
  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      onClose={() => {}} // No permitir cerrar el modal
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        color: '#333',
        textAlign: 'center',
        py: 4,
        position: 'relative'
      }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Typography variant="h4" sx={{ opacity: 0.3 }}>
            🔒
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Suscripción Requerida
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Necesitas una suscripción activa para acceder a FLASH
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#333' }}>
            ¡Desbloquea todas las ofertas!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Con una suscripción activa podrás acceder a cientos de ofertas exclusivas 
            y ahorrar dinero en tus compras favoritas.
          </Typography>
        </Box>

        {/* Características principales */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 2, 
          mb: 4 
        }}>
          <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#ffeb3b', mb: 1 }}>💎</Typography>
            <Typography variant="subtitle2" gutterBottom>Ofertas Exclusivas</Typography>
            <Typography variant="body2" color="text.secondary">
              Acceso a ofertas únicas no disponibles para usuarios gratuitos
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#ffeb3b', mb: 1 }}>⚡</Typography>
            <Typography variant="subtitle2" gutterBottom>Sin Límites</Typography>
            <Typography variant="body2" color="text.secondary">
              Usa todas las ofertas que quieras sin restricciones
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#ffeb3b', mb: 1 }}>🎯</Typography>
            <Typography variant="subtitle2" gutterBottom>Ahorro Garantizado</Typography>
            <Typography variant="body2" color="text.secondary">
              Ahorra dinero real en cada compra con nuestras ofertas
            </Typography>
          </Box>
        </Box>

        {/* Precios destacados */}
        <Box sx={{ 
          bgcolor: '#fff3e0', 
          p: 3, 
          borderRadius: 2, 
          border: '2px solid #ffeb3b',
          mb: 3
        }}>
          <Typography variant="h5" sx={{ color: '#e65100', fontWeight: 'bold', mb: 1 }}>
            Planes desde CHF 9.99/mes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Incluye 7 días de prueba gratuita
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          💡 <strong>Tip:</strong> El plan anual incluye 2 meses gratis
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
          💰 <strong>Pago por oferta:</strong> 5% del coste de cada oferta utilizada
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 4, justifyContent: 'center' }}>
        <Button 
          onClick={onSubscribe}
          variant="contained"
          size="large"
          sx={{
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            px: 6,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #fbc02d 0%, #fbc02d 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          🚀 Suscribirse Ahora
        </Button>
      </DialogActions>
    </Dialog>
  );
}


function OfferDetail({ offer, open, onClose }: { offer: Offer | null, open: boolean, onClose: () => void }) {
  if (!offer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{offer.name}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', mb: 2 }}>
          <CardMedia
            component="img"
            height="250"
            image={offer.image}
            alt={offer.name}
            sx={{ borderRadius: 1 }}
          />
          {offer.isNew && (
            <Chip
              label="Nouveau"
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontWeight: 'bold'
              }}
            />
          )}
        </Box>
        
        <Typography variant="h5" color="error" fontWeight="bold" gutterBottom>
          {offer.discount}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Star sx={{ color: '#ffeb3b', mr: 0.5 }} />
          <Typography variant="body1" sx={{ mr: 1 }}>{offer.rating}</Typography>
          <Typography variant="body2" color="text.secondary">
            {offer.location.address}
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {offer.description}
        </Typography>
        
        {offer.price && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ mr: 1 }}>{offer.price}</Typography>
            {offer.oldPrice && (
              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                {offer.oldPrice}
              </Typography>
            )}
          </Box>
        )}

        {/* Información de pago por uso */}
        {offer.usagePrice && (
          <Box sx={{ 
            bgcolor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1, 
            mb: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              💳 Coût pour utiliser cette offre :
            </Typography>
            <Typography variant="h6" sx={{ color: '#ffeb3b', fontWeight: 'bold' }}>
              CHF {offer.usagePrice}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ce coût sera facturé automatiquement lors de l'activation de l'offre
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button variant="contained" startIcon={<Phone />} fullWidth>
            Appeler
          </Button>
          <Button variant="outlined" startIcon={<Directions />} fullWidth>
            Itinéraire
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button 
            variant="outlined" 
            fullWidth
            onClick={() => {
              const shareText = `🎉 ¡Mira esta oferta increíble en FLASH!\n\n${offer.name}\n${offer.discount}\n\nDescarga FLASH: https://t4learningluca.web.app`;
              if (navigator.share) {
                navigator.share({
                  title: 'Oferta FLASH',
                  text: shareText,
                  url: 'https://t4learningluca.web.app'
                });
              } else {
                navigator.clipboard.writeText(shareText);
                // addNotification('success', '¡Enlace copiado al portapapeles!');
              }
            }}
            sx={{ borderColor: '#ffeb3b', color: '#ffeb3b' }}
          >
            📤 Partager
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  const { t } = useTranslation();
  const [offers] = useState<Offer[]>(initialOffers);
  const [selectedTab, setSelectedTab] = useState(1);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>(initialFlashDeals);
  const [activatedFlashDeals, setActivatedFlashDeals] = useState<Set<string>>(new Set());
  const [flashActivationTimes, setFlashActivationTimes] = useState<{[key: string]: Date}>({});
  const [partners, setPartners] = useState<any[]>([]); // Estado para socios dinámicos
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFlashModal, setShowAddFlashModal] = useState(false);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    icon: '',
    address: '',
    location: { lat: 46.2306, lng: 7.3590 },
    discount: '20% OFF'
  });
  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });
  
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSubscriptionRequiredModal, setShowSubscriptionRequiredModal] = useState(false);
  const [showSubscriptionOverlay, setShowSubscriptionOverlay] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [signupCredentials, setSignupCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    city: 'FLASH'
  });
  
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    city: ''
  });
  
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  
  const [adminLoginCredentials, setAdminLoginCredentials] = useState({
    email: '',
    password: ''
  });
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
  }>({
    open: false,
    type: 'success',
    message: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // User location state for distance-based sorting
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Distance calculation function using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Auto-request location when user enters map view
  useEffect(() => {
    if (selectedTab === 0 && !userLocation) {
      getUserLocation();
    }
  }, [selectedTab]);
  
  // Estados para funcionalidad de swipe estilo Instagram
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Función para manejar el inicio del toque
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('🔥 TOUCH START DETECTED!', e.touches);
    if (isTransitioning) {
      console.log('❌ Transitioning, ignoring touch start');
      return;
    }
    
    // Solo activar swipe global si no estamos en una tarjeta de oferta, mapa, o sección de partners
    const target = e.target as HTMLElement;
    if (target.closest('.offer-card') || 
        target.closest('.MuiCard-root') ||
        target.closest('#map') ||
        target.closest('.partners-section') ||
        target.closest('[data-map-container]')) {
      console.log('❌ Touch on interactive element, ignoring global swipe');
      return;
    }
    
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    console.log('✅ Touch start - Start X:', e.touches[0].clientX);
  };

  // Función para manejar el movimiento del toque
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const newCurrentX = e.touches[0].clientX;
    setCurrentX(newCurrentX);
    console.log('🔥 TOUCH MOVE - Current X:', newCurrentX);
  };

  // Función para manejar el final del toque
  const handleTouchEnd = () => {
    console.log('🔥 TOUCH END DETECTED!');
    if (!isDragging || isTransitioning) {
      console.log('❌ Not dragging or transitioning, ignoring touch end');
      return;
    }
    
    setIsDragging(false);
    setIsTransitioning(true);
    
    const deltaX = currentX - startX;
    const threshold = window.innerWidth * 0.25; // 25% del ancho de pantalla (menos sensible)
    
    console.log('📊 SWIPE CALCULATION:', {
      startX,
      currentX,
      deltaX,
      threshold,
      windowWidth: window.innerWidth,
      isLeftSwipe: deltaX < -threshold,
      isRightSwipe: deltaX > threshold,
      startedFromAnywhere: true
    });
    
    // Solo permitir swipe global si:
    // 1. El swipe es suficientemente largo
    // 2. Comenzó desde cualquier parte de la pantalla (pero excluyendo elementos interactivos)
    // 3. No estamos en una tarjeta de oferta, mapa o sección de partners
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swipe hacia la derecha - ir a pestaña anterior
        console.log('✅ SWIPING RIGHT - going to previous tab');
        setSelectedTab(prev => {
          const newTab = Math.max(0, prev - 1);
          console.log(`🔄 Changing from tab ${prev} to tab ${newTab}`);
          return newTab;
        });
      } else {
        // Swipe hacia la izquierda - pestaña siguiente
        console.log('✅ SWIPING LEFT - going to next tab');
        setSelectedTab(prev => {
          const newTab = Math.min(3, prev + 1);
          console.log(`🔄 Changing from tab ${prev} to tab ${newTab}`);
          return newTab;
        });
      }
    } else {
      console.log('❌ Swipe distance too small:', {
        deltaX: Math.abs(deltaX),
        threshold,
        startX
      });
    }
    
    // Resetear la posición
    setTimeout(() => {
      setIsTransitioning(false);
      console.log('🔄 Transition completed');
    }, 150);
  };

  // Hook para manejar swipe con eventos nativos del DOM
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      console.log('🔥 NATIVE TOUCH START!', e.touches);
      if (e.touches && e.touches.length > 0) {
        // Solo activar swipe global si no estamos en una tarjeta de oferta, mapa, o sección de partners
        const target = e.target as HTMLElement;
        if (target.closest('.offer-card') || 
            target.closest('.MuiCard-root') ||
            target.closest('#map') ||
            target.closest('.partners-section') ||
            target.closest('[data-map-container]')) {
          console.log('❌ Native touch on interactive element, ignoring global swipe');
          return;
        }
        
        const startX = e.touches[0].clientX;
        console.log('Native Start X position:', startX);
        setStartX(startX);
        setCurrentX(startX);
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || isTransitioning) return;
      
      if (e.touches && e.touches.length > 0) {
        const newCurrentX = e.touches[0].clientX;
        setCurrentX(newCurrentX);
        console.log('🔥 NATIVE TOUCH MOVE - Current X:', newCurrentX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      console.log('🔥 NATIVE TOUCH END!', e.changedTouches);
      
      if (!isDragging || isTransitioning) {
        console.log('❌ Not dragging or transitioning, ignoring native touch end');
        return;
      }
      
      setIsDragging(false);
      setIsTransitioning(true);
      
      const deltaX = currentX - startX;
      const threshold = window.innerWidth * 0.25; // 25% del ancho de pantalla (menos sensible)
      
      console.log('📊 NATIVE SWIPE CALCULATION:', {
        startX,
        currentX,
        deltaX,
        threshold,
        windowWidth: window.innerWidth,
        isLeftSwipe: deltaX < -threshold,
        isRightSwipe: deltaX > threshold
      });
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          // Swipe hacia la derecha - pestaña anterior
          console.log('✅ NATIVE SWIPING RIGHT - going to previous tab');
          setSelectedTab(prev => {
            const newTab = Math.max(0, prev - 1);
            console.log(`🔄 Native changing from tab ${prev} to tab ${newTab}`);
            return newTab;
          });
        } else {
          // Swipe hacia la izquierda - pestaña siguiente
          console.log('✅ NATIVE SWIPING LEFT - going to next tab');
          setSelectedTab(prev => {
            const newTab = Math.min(3, prev + 1);
            console.log(`🔄 Native changing from tab ${prev} to tab ${newTab}`);
            return newTab;
          });
        }
      } else {
        console.log('❌ Native swipe distance too small:', Math.abs(deltaX), 'threshold:', threshold);
      }
      
      // Resetear la posición
      setTimeout(() => {
        setIsTransitioning(false);
        console.log('🔄 Native transition completed');
      }, 150);
    };

    // Solo agregar listeners en móvil
    if (window.innerWidth <= 768) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, isTransitioning, startX, currentX]);

  // Listener de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowLoginModal(false);
        setShowSignupModal(false);
        await createOrUpdateUserProfile(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setShowLoginModal(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Mostrar modal de suscripción cuando el usuario no tenga suscripción activa
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      const isSubscriptionActive = checkSubscriptionStatus(userProfile);
      
      if (!isSubscriptionActive) {
        // Ya no mostramos el modal automáticamente - el usuario puede navegar libremente
        // Solo ocultamos el overlay si existe
        setShowSubscriptionOverlay(false);
      } else {
        // Ocultar modal si tiene suscripción activa
        setShowSubscriptionOverlay(false);
      }
    }
  }, [isAuthenticated, userProfile]);

  const [newOffer, setNewOffer] = useState({
    name: '',
    category: 'restaurants',
    subCategory: '',
    discount: '',
    description: '',
    address: '',
    rating: 4.5,
    price: '',
    oldPrice: ''
  });

  const [newFlashDeal, setNewFlashDeal] = useState({
    name: '',
    category: 'restaurants',
    subCategory: '',
    discount: '',
    description: '',
    address: '',
    rating: 4.5,
    price: '',
    oldPrice: '',
    originalPrice: 0,
    discountedPrice: 0,
    duration: 2, // horas
    maxQuantity: 20,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80'
  });

  const theme = professionalTheme;

  // Función para crear o actualizar el perfil de usuario
  const createOrUpdateUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Crear nuevo perfil con 7 días de prueba
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // Exactamente 7 días desde ahora
        
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          name: 'Usuario FLASH',
          city: 'FLASH',
          activatedOffers: [],
          totalSaved: 0,
          points: 0,
          level: 1,
          achievements: [],
          subscriptionEnd: Timestamp.fromDate(trialEndDate),
          subscriptionStatus: 'expired', // Sin acceso hasta que activen prueba o suscripción
          subscriptionPlan: 'none',
          totalPaid: 0,
          
          // Nuevos campos para datos individuales
          personalStats: {
            joinDate: Timestamp.now(),
            lastLoginDate: Timestamp.now(),
            totalOffersViewed: 0,
            favoriteCategories: [],
            preferredLanguage: 'fr',
            notificationsEnabled: true
          },
          
          financialHistory: {
            monthlyExpenses: {},
            subscriptionHistory: [],
            offerPayments: []
          },
          
          preferences: {
            favoriteLocations: [],
            priceRange: { min: 0, max: 1000 },
            notificationSettings: {
              newOffers: true,
              flashDeals: true,
              subscriptionReminders: true
            }
          },
          
          activityLog: [{
            action: 'account_created',
            timestamp: Timestamp.now(),
            details: { source: 'web' }
          }]
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } else {
        // Cargar perfil existente y migrar si es necesario
        const existingProfile = userDoc.data() as UserProfile;
        const migratedProfile = await migrateUserProfile(existingProfile);
        setUserProfile(migratedProfile);
      }
    } catch (error) {
      console.error('Error al cargar/crear perfil de usuario:', error);
      // Si hay error, crear un perfil básico en memoria
      // Crear perfil fallback con 7 días de prueba
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // Exactamente 7 días desde ahora
      
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: 'Usuario FLASH',
        city: 'FLASH',
        activatedOffers: [],
        totalSaved: 0,
        points: 0,
        level: 1,
        achievements: [],
        subscriptionEnd: Timestamp.fromDate(trialEndDate),
        subscriptionStatus: 'pending', // Estado de prueba
        subscriptionPlan: 'none',
        totalPaid: 0,
        
        // Nuevos campos para datos individuales
        personalStats: {
          joinDate: Timestamp.now(),
          lastLoginDate: Timestamp.now(),
          totalOffersViewed: 0,
          favoriteCategories: [],
          preferredLanguage: 'fr',
          notificationsEnabled: true
        },
        
        financialHistory: {
          monthlyExpenses: {},
          subscriptionHistory: [],
          offerPayments: []
        },
        
        preferences: {
          favoriteLocations: [],
          priceRange: { min: 0, max: 1000 },
          notificationSettings: {
            newOffers: true,
            flashDeals: true,
            subscriptionReminders: true
          }
        },
        
        activityLog: [{
          action: 'account_created_fallback',
          timestamp: Timestamp.now(),
          details: { source: 'web', fallback: true }
        }]
      };
      setUserProfile(fallbackProfile);
    }
  };

  // Función para manejar el registro de usuario
  const handleSignup = async () => {
    if (signupCredentials.password !== signupCredentials.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (signupCredentials.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupCredentials.email,
        signupCredentials.password
      );

      const user = userCredential.user;
      
      // Crear el perfil de usuario directamente
      const userRef = doc(db, 'users', user.uid);
      // Crear perfil con 7 días de prueba
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // Exactamente 7 días desde ahora
      
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: signupCredentials.name || 'Usuario FLASH',
        city: signupCredentials.city || 'FLASH',
        activatedOffers: [],
        totalSaved: 0,
        points: 0,
        level: 1,
        achievements: [],
        subscriptionEnd: Timestamp.fromDate(trialEndDate),
        subscriptionStatus: 'pending', // Estado de prueba
        subscriptionPlan: 'none',
        totalPaid: 0,
        
        // Nuevos campos para datos individuales
        personalStats: {
          joinDate: Timestamp.now(),
          lastLoginDate: Timestamp.now(),
          totalOffersViewed: 0,
          favoriteCategories: [],
          preferredLanguage: 'fr',
          notificationsEnabled: true
        },
        
        financialHistory: {
          monthlyExpenses: {},
          subscriptionHistory: [],
          offerPayments: []
        },
        
        preferences: {
          favoriteLocations: [],
          priceRange: { min: 0, max: 1000 },
          notificationSettings: {
            newOffers: true,
            flashDeals: true,
            subscriptionReminders: true
          }
        },
        
        activityLog: [{
          action: 'account_created_signup',
          timestamp: Timestamp.now(),
          details: { source: 'signup' }
        }]
      };
      
      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setShowSignupModal(false);
      setShowLoginModal(false);
      setSignupCredentials({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        city: 'FLASH'
      });
      addNotification('success', 'Account created successfully! Welcome to FLASH!');
    } catch (error: any) {
      console.error('Error en registro:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el login de usuario
  const handleUserLogin = async () => {
    if (!loginCredentials.email || !loginCredentials.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginCredentials.email,
        loginCredentials.password
      );

      const user = userCredential.user;
      setCurrentUser(user);
      await createOrUpdateUserProfile(user);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setLoginCredentials({ email: '', password: '' });
      addNotification('success', 'Welcome to FLASH!');
    } catch (error: any) {
      console.error('Error en login:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para autenticación con Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Crear o actualizar perfil de usuario
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Crear nuevo perfil para usuario de Google
        // Crear perfil con 7 días de prueba
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // Exactamente 7 días desde ahora
        
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'Usuario FLASH',
          city: 'Valais',
          activatedOffers: [],
          totalSaved: 0,
          points: 0,
          level: 1,
          achievements: [],
          subscriptionEnd: Timestamp.fromDate(trialEndDate),
          subscriptionStatus: 'expired', // Sin acceso hasta que activen prueba o suscripción
          subscriptionPlan: 'none',
          totalPaid: 0,
          
          // Nuevos campos para datos individuales
          personalStats: {
            joinDate: Timestamp.now(),
            lastLoginDate: Timestamp.now(),
            totalOffersViewed: 0,
            favoriteCategories: [],
            preferredLanguage: 'fr',
            notificationsEnabled: true
          },
          
          financialHistory: {
            monthlyExpenses: {},
            subscriptionHistory: [],
            offerPayments: []
          },
          
          preferences: {
            favoriteLocations: [],
            priceRange: { min: 0, max: 1000 },
            notificationSettings: {
              newOffers: true,
              flashDeals: true,
              subscriptionReminders: true
            }
          },
          
          activityLog: [{
            action: 'account_created_google',
            timestamp: Timestamp.now(),
            details: { source: 'google' }
          }]
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } else {
        // Cargar perfil existente
        setUserProfile(userDoc.data() as UserProfile);
      }
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setShowSignupModal(false);
      addNotification('success', 'Welcome to FLASH!');
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, not a real error
        console.log('User closed Google popup');
      } else {
        const errorMessage = getAuthErrorMessage(error.code);
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el login de admin
  const handleAdminLogin = async () => {
    if (!adminLoginCredentials.email || !adminLoginCredentials.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      // Intentar login con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        adminLoginCredentials.email,
        adminLoginCredentials.password
      );

      const user = userCredential.user;
      
      // Verificar si el usuario es admin (puedes agregar un campo 'isAdmin' en el perfil)
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isAdmin === true) {
          setIsAdmin(true);
          setShowAdminLoginModal(false);
          setAdminLoginCredentials({ email: '', password: '' });
          addNotification('success', '¡Bienvenido, Administrador!');
        } else {
          alert('No tienes permisos de administrador');
          await signOut(auth);
        }
      } else {
        alert('User not found');
        await signOut(auth);
      }
    } catch (error: any) {
      console.error('Error en login de admin:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para editar el perfil
  const handleEditProfile = async () => {
    if (!currentUser || !userProfile) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: editProfileData.name,
        city: editProfileData.city
      });

      // Actualizar el estado local
      setUserProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          name: editProfileData.name,
          city: editProfileData.city
        };
      });

      setShowEditProfileModal(false);
      addNotification('success', 'Perfil actualizado exitosamente!');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil');
    }
  };

  // Función para añadir notificaciones
  const addNotification = (type: 'success' | 'info' | 'warning', message: string) => {
    setSnackbar({
      open: true,
      type,
      message
    });
  };

  // Función para cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Función para abrir el modal de edición
  const openEditProfileModal = () => {
    if (userProfile) {
      setEditProfileData({
        name: userProfile.name,
        city: userProfile.city
      });
      setShowEditProfileModal(true);
    }
  };

  // Función para restablecer contraseña
  const handleResetPassword = async () => {
    if (!resetPasswordEmail) {
      alert('Por favor ingresa tu correo electrónico');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetPasswordEmail);
      setShowResetPasswordModal(false);
      setResetPasswordEmail('');
      addNotification('success', '¡Email de restablecimiento enviado! Revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Error al enviar email de restablecimiento:', error);
      if (error.code === 'auth/user-not-found') {
        alert('No existe una cuenta con este correo electrónico');
      } else if (error.code === 'auth/invalid-email') {
        alert('El formato del correo electrónico no es válido');
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setCurrentUser(null);
      setUserProfile(null);
      setShowLoginModal(true);
      alert('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión');
    }
  };

  // Función para agregar nueva oferta
  const handleAddOffer = async () => {
    if (!newOffer.name || !newOffer.address) {
      alert('Por favor completa el nombre y la dirección');
      return;
    }

    try {
      if (window.google) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: newOffer.address + ', Valais, Switzerland' }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            
            const offer = {
              id: Date.now().toString(),
              name: newOffer.name,
              image: '/api/placeholder/150/150',
              category: newOffer.category,
              subCategory: newOffer.subCategory,
              discount: newOffer.discount,
              description: newOffer.description,
              location: {
                lat: location.lat(),
                lng: location.lng(),
                address: newOffer.address
              },
              rating: newOffer.rating,
              isNew: true,
              price: newOffer.price,
              oldPrice: newOffer.oldPrice
            };

            console.log('Nueva oferta:', offer);
            
            setNewOffer({
              name: '',
              category: 'restaurants',
              subCategory: '',
              discount: '',
              description: '',
              address: '',
              rating: 4.5,
              price: '',
              oldPrice: ''
            });
            setShowAddModal(false);
            
            alert('Oferta agregada exitosamente!');
          } else {
            alert('No se pudo encontrar la dirección. Intenta con una dirección más específica.');
          }
        });
      } else {
        alert('Google Maps no está disponible. Intenta más tarde.');
      }
    } catch (error) {
      console.error('Error adding offer:', error);
      alert('Error al agregar la oferta');
    }
  };

  // Función para activar oferta Flash independientemente (como McDonald's)
  const handleActivateFlashDeal = async (dealId: string) => {
    const deal = flashDeals.find(d => d.id === dealId);
    if (!deal) return;

    // Simular el proceso de bloqueo con lightning
    addNotification('info', '⚡ Bloqueando oferta... Espera 10 minutos para la activación.');
    
    // Después de 2 segundos, mostrar el modal de oferta bloqueada
    setTimeout(() => {
      // Aquí se mostraría el modal de oferta bloqueada
      // Por ahora, activamos directamente después del lightning
      const activationTime = new Date();
      
      setActivatedFlashDeals(prev => new Set([...prev, dealId]));
      setFlashActivationTimes(prev => ({
        ...prev,
        [dealId]: activationTime
      }));
      
      addNotification('success', '¡Oferta Flash activada! Tienes 15 minutos para usarla.');
    }, 2000);
    
    // Auto-expirar después de 15 minutos
    setTimeout(() => {
      setActivatedFlashDeals(prev => {
        const newSet = new Set(prev);
        newSet.delete(dealId);
        return newSet;
      });
      setFlashActivationTimes(prev => {
        const newTimes = { ...prev };
        delete newTimes[dealId];
        return newTimes;
      });
      addNotification('warning', 'Tu oferta Flash ha expirado.');
    }, 15 * 60 * 1000);
  };

  // Función para agregar nueva oferta flash
  const handleAddFlashDeal = async () => {
    if (!newFlashDeal.name || !newFlashDeal.address) {
      alert('Por favor completa el nombre y la dirección');
      return;
    }

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + newFlashDeal.duration * 60 * 60 * 1000);
      
      // Calcular el descuento automáticamente
      const discountPercentage = Math.round(((newFlashDeal.originalPrice - newFlashDeal.discountedPrice) / newFlashDeal.originalPrice) * 100);
      
      const flashDealData: FlashDeal = {
        ...newFlashDeal,
        id: `flash_${Date.now()}`,
        discount: `${discountPercentage}% OFF`,
        price: `CHF ${newFlashDeal.discountedPrice}`,
        oldPrice: `CHF ${newFlashDeal.originalPrice}`,
        location: {
          lat: 46.2306,
          lng: 7.3590,
          address: newFlashDeal.address
        },
        startTime: now,
        endTime: endTime,
        isActive: true,
        soldQuantity: 0
      };

      // Aquí podrías agregar la lógica para guardar en Firebase
      console.log('Nueva oferta flash:', flashDealData);
      
      // Agregar a la lista local (en producción esto vendría de Firebase)
      setFlashDeals(prev => [...prev, flashDealData]);
      
      setNewFlashDeal({
        name: '',
        category: 'restaurants',
        subCategory: '',
        discount: '',
        description: '',
        address: '',
        rating: 4.5,
        price: '',
        oldPrice: '',
        originalPrice: 0,
        discountedPrice: 0,
        duration: 2,
        maxQuantity: 20,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80'
      });
      
      setShowAddFlashModal(false);
      alert('Offre flash créée avec succès');
    } catch (error) {
      console.error('Error adding flash deal:', error);
      alert('Erreur lors de la création de l\'offre flash');
    }
  };

  // Funciones para manejar datos individuales del usuario
  
  // Función para registrar actividad del usuario
  const logUserActivity = async (action: string, details?: any) => {
    if (!currentUser || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const newActivity = {
        action,
        timestamp: Timestamp.now(),
        details: details || {}
      };
      
      await updateDoc(userRef, {
        'activityLog': arrayUnion(newActivity),
        'personalStats.lastLoginDate': Timestamp.now()
      });
      
      // Actualizar el perfil local
      setUserProfile(prev => prev ? {
        ...prev,
        activityLog: [...prev.activityLog, newActivity],
        personalStats: {
          ...prev.personalStats,
          lastLoginDate: Timestamp.now()
        }
      } : null);
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  };
  
  // Función para actualizar estadísticas de ofertas vistas
  const updateOffersViewed = async (offerId: string, category: string) => {
    if (!currentUser || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Actualizar categorías favoritas
      const favoriteCategories = userProfile.personalStats.favoriteCategories;
      if (!favoriteCategories.includes(category)) {
        favoriteCategories.push(category);
      }
      
      await updateDoc(userRef, {
        'personalStats.totalOffersViewed': userProfile.personalStats.totalOffersViewed + 1,
        'personalStats.favoriteCategories': favoriteCategories.slice(-10) // Mantener solo las últimas 10
      });
      
      // Actualizar perfil local
      setUserProfile(prev => prev ? {
        ...prev,
        personalStats: {
          ...prev.personalStats,
          totalOffersViewed: prev.personalStats.totalOffersViewed + 1,
          favoriteCategories: favoriteCategories.slice(-10)
        }
      } : null);
      
      // Registrar actividad
      await logUserActivity('offer_viewed', { offerId, category });
    } catch (error) {
      console.error('Error updating offers viewed:', error);
    }
  };
  
  // Función para registrar pago de oferta
  const recordOfferPayment = async (offerId: string, offerName: string, amount: number) => {
    if (!currentUser || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const payment = {
        offerId,
        amount,
        date: Timestamp.now(),
        offerName
      };
      
      // Actualizar gastos mensuales
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyExpenses = { ...userProfile.financialHistory.monthlyExpenses };
      monthlyExpenses[currentMonth] = (monthlyExpenses[currentMonth] || 0) + amount;
      
      await updateDoc(userRef, {
        'financialHistory.offerPayments': arrayUnion(payment),
        'financialHistory.monthlyExpenses': monthlyExpenses,
        totalPaid: userProfile.totalPaid + amount
      });
      
      // Actualizar perfil local
      setUserProfile(prev => prev ? {
        ...prev,
        financialHistory: {
          ...prev.financialHistory,
          offerPayments: [...prev.financialHistory.offerPayments, payment],
          monthlyExpenses
        },
        totalPaid: prev.totalPaid + amount
      } : null);
      
      // Registrar actividad
      await logUserActivity('offer_payment', { offerId, offerName, amount });
    } catch (error) {
      console.error('Error recording offer payment:', error);
    }
  };
  
  // Función para registrar suscripción
  // const recordSubscription = async (plan: string, amount: number) => {
  //   if (!currentUser || !userProfile) return;
  //   
  //   try {
  //     const userRef = doc(db, 'users', currentUser.uid);
  //     const subscription = {
  //       plan,
  //       startDate: Timestamp.now(),
  //       amount,
  //       status: 'active'
  //     };
  //     
  //     await updateDoc(userRef, {
  //       'financialHistory.subscriptionHistory': arrayUnion(subscription)
  //     });
  //     
  //     // Actualizar perfil local
  //     setUserProfile(prev => prev ? {
  //       ...prev,
  //       financialHistory: {
  //         ...prev.financialHistory,
  //         subscriptionHistory: [...prev.financialHistory.subscriptionHistory, subscription]
  //       }
  //     } : null);
  //     
  //     // Registrar actividad
  //     await logUserActivity('subscription_purchased', { plan, amount });
  //   } catch (error) {
  //     console.error('Error recording subscription:', error);
  //   }
  // };
  
  // Función para actualizar preferencias del usuario
  // const updateUserPreferences = async (preferences: Partial<UserProfile['preferences']>) => {
  //   if (!currentUser || !userProfile) return;
  //   
  //   try {
  //     const userRef = doc(db, 'users', currentUser.uid);
  //     const updatedPreferences = { ...userProfile.preferences, ...preferences };
  //     
  //     await updateDoc(userRef, {
  //       preferences: updatedPreferences
  //     });
  //     
  //     // Actualizar perfil local
  //     setUserProfile(prev => prev ? {
  //       ...prev,
  //       preferences: updatedPreferences
  //     } : null);
  //     
  //     // Registrar actividad
  //     await logUserActivity('preferences_updated', preferences);
  //   } catch (error) {
  //     console.error('Error updating preferences:', error);
  //   }
  // };
  
  // Función para migrar perfiles existentes a la nueva estructura
  const migrateUserProfile = async (profile: UserProfile) => {
    if (!currentUser) return profile;
    
    try {
      // Verificar si necesita migración
      const needsMigration = !profile.personalStats || !profile.financialHistory || !profile.preferences || !profile.activityLog;
      
      if (needsMigration) {
        const migratedProfile: UserProfile = {
          ...profile,
          personalStats: profile.personalStats || {
            joinDate: Timestamp.now(),
            lastLoginDate: Timestamp.now(),
            totalOffersViewed: 0,
            favoriteCategories: [],
            preferredLanguage: 'fr',
            notificationsEnabled: true
          },
          financialHistory: profile.financialHistory || {
            monthlyExpenses: {},
            subscriptionHistory: [],
            offerPayments: []
          },
          preferences: profile.preferences || {
            favoriteLocations: [],
            priceRange: { min: 0, max: 1000 },
            notificationSettings: {
              newOffers: true,
              flashDeals: true,
              subscriptionReminders: true
            }
          },
          activityLog: profile.activityLog || [{
            action: 'profile_migrated',
            timestamp: Timestamp.now(),
            details: { source: 'migration' }
          }]
        };
        
        // Guardar perfil migrado
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, migratedProfile);
        setUserProfile(migratedProfile);
        
        return migratedProfile;
      }
      
      return profile;
    } catch (error) {
      console.error('Error migrating profile:', error);
      return profile;
    }
  };

  // Función para obtener estadísticas del usuario
  const getUserStats = () => {
    if (!userProfile) return null;
    
    // Asegurar que los campos existan
    const personalStats = userProfile.personalStats || {
      joinDate: Timestamp.now(),
      lastLoginDate: Timestamp.now(),
      totalOffersViewed: 0,
      favoriteCategories: [],
      preferredLanguage: 'fr',
      notificationsEnabled: true
    };
    
    const financialHistory = userProfile.financialHistory || {
      monthlyExpenses: {},
      subscriptionHistory: [],
      offerPayments: []
    };
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpense = financialHistory.monthlyExpenses[currentMonth] || 0;
    const totalSubscriptions = financialHistory.subscriptionHistory.reduce((sum, sub) => sum + sub.amount, 0);
    const totalOfferPayments = financialHistory.offerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    return {
      joinDate: personalStats.joinDate,
      totalOffersViewed: personalStats.totalOffersViewed,
      favoriteCategories: personalStats.favoriteCategories,
      monthlyExpense,
      totalSubscriptions,
      totalOfferPayments,
      totalSaved: userProfile.totalSaved,
      points: userProfile.points,
      level: userProfile.level,
      activatedOffersCount: userProfile.activatedOffers.length
    };
  };

  const handleFlashDealClick = async (deal: FlashDeal) => {
    // Ya no verificamos suscripción aquí - el usuario puede hacer clic libremente
    // El bloqueo individual de ofertas se maneja en el componente de la oferta

    // Registrar que el usuario vio esta oferta
    await updateOffersViewed(deal.id, deal.category);

    // Las ofertas flash se procesan directamente
    
    // Procesar pago por uso de oferta
    if (currentUser && deal.price) {
      const offerPrice = parseFloat(deal.price);
      const usageCost = offerPrice * OFFER_USAGE_PERCENTAGE;
      
      try {
        // Actualizar el perfil del usuario con el costo
        await updateDoc(doc(db, 'users', currentUser.uid), {
          totalSpent: arrayUnion(usageCost),
          lastOfferUsed: Timestamp.now()
        });
        
        addNotification('success', `Oferta flash utilizada! Costo: CHF ${usageCost.toFixed(2)}`);
      } catch (error) {
        console.error('Error updating user profile:', error);
        addNotification('warning', 'Error al procesar el uso de la oferta');
      }
    }
  };

  const handleOfferClick = async (offer: Offer | FlashDeal) => {
    // Ya no verificamos suscripción aquí - el usuario puede hacer clic libremente
    // El bloqueo individual de ofertas se maneja en el componente de la oferta

    // Registrar que el usuario vio esta oferta
    await updateOffersViewed(offer.id, offer.category);

    // Convertir FlashDeal a Offer si es necesario
    const offerData: Offer = {
      id: offer.id,
      name: offer.name,
      image: offer.image,
      category: offer.category,
      subCategory: offer.subCategory,
      discount: offer.discount,
      description: offer.description,
      location: offer.location,
      rating: offer.rating,
      isNew: true, // Las ofertas flash siempre son nuevas
      price: offer.price,
      oldPrice: offer.oldPrice,
      usagePrice: offer.price ? parseFloat(offer.price) * OFFER_USAGE_PERCENTAGE : 0
    };
    
    // Procesar pago por uso de oferta
    if (currentUser && offer.price) {
      const offerPrice = parseFloat(offer.price);
      const usagePrice = offerPrice * OFFER_USAGE_PERCENTAGE;
      const paymentSuccess = await processOfferPayment(currentUser.uid, offer.id, offerPrice);
      if (!paymentSuccess) {
        alert('Erreur lors du traitement du paiement. Réessayez.');
        return;
      }
      
      // Registrar el pago de la oferta
      await recordOfferPayment(offer.id, offer.name, usagePrice);
    }
    
    setSelectedOffer(offerData);
    setDetailOpen(true);
  };

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Login Modal - Obligatorio */}
      <Dialog 
        open={showLoginModal && !isAuthenticated} 
        onClose={() => {}} // No se puede cerrar
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">🔐 FLASH Access</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
              Welcome to FLASH - Your deals app in FLASH
            </Typography>
            
            <TextField
              label="Email"
              type="email"
              value={loginCredentials.email}
              onChange={(e) => setLoginCredentials({...loginCredentials, email: e.target.value})}
              fullWidth
              required
              placeholder="email@example.com"
            />
            
            <TextField
              label="Password"
              type="password"
              value={loginCredentials.password}
              onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
              fullWidth
              required
              placeholder="••••••••"
            />

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Don't have an account? 
              <Button 
                color="primary" 
                onClick={() => {
                  setShowLoginModal(false);
                  setShowSignupModal(true);
                }}
                sx={{ ml: 1 }}
              >
                Sign up
              </Button>
            </Typography>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              <Button 
                color="primary" 
                onClick={() => {
                  setShowLoginModal(false);
                  setShowResetPasswordModal(true);
                }}
                sx={{ fontSize: '0.875rem' }}
              >
                Forgot your password?
              </Button>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleUserLogin}
            variant="contained"
            disabled={!loginCredentials.email || !loginCredentials.password || isLoading}
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1565c0' } }}
            fullWidth
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </DialogActions>
        
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">or</Typography>
          </Divider>
          
          <Button
            onClick={handleGoogleSignIn}
            variant="outlined"
            disabled={isLoading}
            fullWidth
            startIcon={
              <Box component="img" src="https://developers.google.com/identity/images/g-logo.png" 
                sx={{ width: 18, height: 18 }} alt="Google" />
            }
            sx={{ 
              borderColor: '#4285f4', 
              color: '#4285f4',
              '&:hover': { 
                borderColor: '#3367d6', 
                bgcolor: 'rgba(66, 133, 244, 0.1)' 
              },
              py: 1.5
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: '#4285f4', mr: 1 }} />
                Conectando...
              </>
            ) : (
              'Continuar con Google'
            )}
          </Button>
        </Box>
      </Dialog>

      {/* Modal de Registro */}
      <Dialog 
        open={showSignupModal} 
        onClose={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">🎉 Create FLASH account</Typography>
            <IconButton onClick={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
              ¡Únete a FLASH y descubre las mejores ofertas en FLASH!
            </Typography>
            
            <TextField
              label="Nombre completo"
              value={signupCredentials.name}
              onChange={(e) => setSignupCredentials({...signupCredentials, name: e.target.value})}
              fullWidth
              required
              placeholder="Juan Pérez"
              error={signupCredentials.name.length > 0 && !validateName(signupCredentials.name).isValid}
              helperText={signupCredentials.name.length > 0 && !validateName(signupCredentials.name).isValid ? validateName(signupCredentials.name).message : ""}
            />

            <TextField
              label="Correo electrónico"
              type="email"
              value={signupCredentials.email}
              onChange={(e) => setSignupCredentials({...signupCredentials, email: e.target.value})}
              fullWidth
              required
              placeholder="ejemplo@email.com"
              error={signupCredentials.email.length > 0 && !validateEmail(signupCredentials.email)}
              helperText={signupCredentials.email.length > 0 && !validateEmail(signupCredentials.email) ? "Ingresa un correo electrónico válido" : ""}
            />
            
            <TextField
              label="Password"
              type="password"
              value={signupCredentials.password}
              onChange={(e) => setSignupCredentials({...signupCredentials, password: e.target.value})}
              fullWidth
              required
              placeholder="••••••••"
              error={signupCredentials.password.length > 0 && !validatePassword(signupCredentials.password).isValid}
              helperText={signupCredentials.password.length > 0 && !validatePassword(signupCredentials.password).isValid ? validatePassword(signupCredentials.password).message : "Mínimo 6 caracteres"}
            />

            <TextField
              label="Confirmar contraseña"
              type="password"
              value={signupCredentials.confirmPassword}
              onChange={(e) => setSignupCredentials({...signupCredentials, confirmPassword: e.target.value})}
              fullWidth
              required
              placeholder="••••••••"
              error={signupCredentials.confirmPassword.length > 0 && signupCredentials.password !== signupCredentials.confirmPassword}
              helperText={signupCredentials.confirmPassword.length > 0 && signupCredentials.password !== signupCredentials.confirmPassword ? "Las contraseñas no coinciden" : ""}
            />

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              ¿Ya tienes una cuenta? 
              <Button 
                color="primary" 
                onClick={() => {
                  setShowSignupModal(false);
                  setShowLoginModal(true);
                }}
                sx={{ ml: 1 }}
              >
                Inicia sesión
              </Button>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleSignup}
            variant="contained"
            disabled={
              !signupCredentials.name || 
              !validateName(signupCredentials.name).isValid ||
              !signupCredentials.email || 
              !validateEmail(signupCredentials.email) ||
              !signupCredentials.password || 
              !validatePassword(signupCredentials.password).isValid ||
              signupCredentials.password !== signupCredentials.confirmPassword ||
              isLoading
            }
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
            fullWidth
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                Creando cuenta...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </DialogActions>
        
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">o</Typography>
          </Divider>
          
          <Button
            onClick={handleGoogleSignIn}
            variant="outlined"
            disabled={isLoading}
            fullWidth
            startIcon={
              <Box component="img" src="https://developers.google.com/identity/images/g-logo.png" 
                sx={{ width: 18, height: 18 }} alt="Google" />
            }
            sx={{ 
              borderColor: '#4285f4', 
              color: '#4285f4',
              '&:hover': { 
                borderColor: '#3367d6', 
                bgcolor: 'rgba(66, 133, 244, 0.1)' 
              },
              py: 1.5
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: '#4285f4', mr: 1 }} />
                Conectando...
              </>
            ) : (
              'Sign up with Google'
            )}
          </Button>
        </Box>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog 
        open={showResetPasswordModal} 
        onClose={() => setShowResetPasswordModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">🔑 Reset Password</Typography>
            <IconButton onClick={() => setShowResetPasswordModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </Typography>
            
            <TextField
              label="Correo electrónico"
              type="email"
              value={resetPasswordEmail}
              onChange={(e) => setResetPasswordEmail(e.target.value)}
              fullWidth
              required
              placeholder="ejemplo@email.com"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowResetPasswordModal(false);
            setShowLoginModal(true);
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleResetPassword}
            variant="contained"
            disabled={!resetPasswordEmail || isLoading}
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1565c0' } }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                Enviando...
              </>
            ) : (
              'Enviar Email'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edición de Perfil */}
      <Dialog 
        open={showEditProfileModal} 
        onClose={() => setShowEditProfileModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">✏️ Modifier le profil</Typography>
            <IconButton onClick={() => setShowEditProfileModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom complet"
              value={editProfileData.name}
              onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
              fullWidth
              required
              placeholder="Juan Pérez"
            />

            <TextField
              label="Ville"
              value={editProfileData.city}
              onChange={(e) => setEditProfileData({...editProfileData, city: e.target.value})}
              fullWidth
              required
              placeholder="FLASH"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditProfileModal(false)}>
            {t('annuler')}
          </Button>
          <Button 
            onClick={handleEditProfile}
            variant="contained"
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1565c0' } }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sistema de Notificaciones - Snackbar Profesional */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          top: { xs: 70, sm: 80 },
          '& .MuiAlert-root': {
            minWidth: { xs: '90vw', sm: '400px' },
            maxWidth: { xs: '90vw', sm: '500px' }
          }
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.type}
          variant="filled"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            alignItems: 'center',
            '& .MuiAlert-icon': {
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Contenido principal solo si está autenticado */}
        {isAuthenticated && (
        <Box
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="page-transition touch-optimized"
          sx={{
            outline: 'none',
            position: 'relative',
            touchAction: 'pan-y',
            height: '100vh',
            overflow: 'hidden'
          }}
        >
          {/* Indicador de swipe */}
          {isDragging && (
            <Box 
              className="swipe-indicator active"
              sx={{
                position: 'fixed',
                top: '50%',
                left: '10px',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '40px',
                background: 'var(--primary-gold)',
                borderRadius: '2px',
                opacity: 0.6,
                zIndex: 1000,
                animation: 'pulse 1s infinite'
              }}
            />
          )}

          {/* Banner de suscripción - Solo mostrar si NO está en período de prueba */}
          {!checkTrialStatus(userProfile) && !checkSubscriptionStatus(userProfile) && userProfile && (
            <Box sx={{ 
              bgcolor: '#2196f3', 
              color: 'white', 
              textAlign: 'center', 
              py: 1,
              px: 2
            }}>
              <Typography variant="body2">
                🔒 Accès limité - Commencez votre essai gratuit de 7 jours
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowTrialModal(true)}
                  sx={{ ml: 1, textDecoration: 'underline' }}
                >
                  Essai gratuit
                </Button>
              </Typography>
            </Box>
          )}

          {/* Banner de período de prueba activo */}
          {checkTrialStatus(userProfile) && userProfile && (
            <Box sx={{ 
              bgcolor: '#4caf50', 
              color: 'white', 
              textAlign: 'center', 
              py: 1,
              px: 2
            }}>
              <Typography variant="body2">
                🎉 Essai gratuit actif - {getTrialDaysRemaining(userProfile)} jours restants
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowSubscriptionModal(true)}
                  sx={{ ml: 1, textDecoration: 'underline' }}
                >
                  S'abonner maintenant
                </Button>
              </Typography>
            </Box>
          )}

          {/* Header */}
          <AppBar position="static">
            <Toolbar sx={{ 
              minHeight: { xs: 50, sm: 64 }, 
              px: { xs: 1, sm: 2 },
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 },
              width: '100%',
              justifyContent: 'space-between'
            }}>
              {/* Logo FLASH */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                flexShrink: 0
              }}>
                <LocationIcon sx={{ mr: 0.5, fontSize: { xs: 18, sm: 24 } }} />
                <Typography variant="h6" sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1.25rem' },
                  whiteSpace: 'nowrap'
                }}><span style={{ color: '#ffeb3b !important' }}>FLASH</span></Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <LanguageSelector />
                
                <IconButton 
                  color="inherit" 
                  onClick={() => setShowSubscriptionModal(true)}
                  size="small"
                  sx={{ 
                    minWidth: 40,
                    minHeight: 40,
                    bgcolor: checkTrialStatus(userProfile) ? 'rgba(76,175,80,0.2)' : checkSubscriptionStatus(userProfile) ? 'rgba(76,175,80,0.2)' : 'rgba(255,193,7,0.2)'
                  }}
                  title={checkTrialStatus(userProfile) ? 'Essai Gratuit Actif' : checkSubscriptionStatus(userProfile) ? 'Abonnement Actif' : 'Activer l\'Abonnement'}
                >
                  <AttachMoney sx={{ fontSize: 18 }} />
                </IconButton>

                
                <IconButton 
                  color="inherit" 
                  onClick={() => setShowAdminLoginModal(true)}
                  size="small"
                  sx={{ 
                    minWidth: 40,
                    minHeight: 40,
                    bgcolor: isAdmin ? 'rgba(255,255,255,0.2)' : 'transparent'
                  }}
                >
                  <Person sx={{ fontSize: 18 }} />
                </IconButton>
                
                <IconButton 
                  color="inherit" 
                  onClick={handleLogout}
                  size="small"
                  sx={{ 
                    minWidth: 40,
                    minHeight: 40
                  }}
                >
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Toolbar>
            
          </AppBar>

          {/* Main Content */}
          <Box sx={{ 
            mt: { xs: 1, sm: 3 }, 
            px: { xs: 2, sm: 4 },
            width: '100%',
            maxWidth: { xs: '100vw', sm: 'lg' },
            mx: { xs: 0, sm: 'auto' },
            pb: { xs: 15, sm: 15 } // Padding inferior para la navegación fija
          }}>
            {/* Category Filters */}
            {selectedCategory !== 'all' && currentCategory && (
              <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Subcategories
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, sm: 1 }, 
                  flexWrap: 'wrap',
                  overflowX: 'auto',
                  pb: 1,
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none'
                }}>
                  <Chip
                    label="All"
                    onClick={() => setSelectedSubCategory('all')}
                    color={selectedSubCategory === 'all' ? 'primary' : 'default'}
                    size="small"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                  />
                  {currentCategory.subCategories.map((subCat) => (
                    <Chip
                      key={subCat}
                      label={subCat}
                      onClick={() => setSelectedSubCategory(subCat)}
                      color={selectedSubCategory === subCat ? 'primary' : 'default'}
                      size="small"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Tab Content */}
            {selectedTab === 0 && (
              <Box 
                className="tab-content"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                  position: 'relative'
                }}
              >
                <MapView 
                  offers={offers} 
                  flashDeals={flashDeals}
                  selectedCategory={selectedCategory} 
                  onOfferClick={handleOfferClick}
                  onFlashDealClick={handleFlashDealClick}
                  userLocation={userLocation}
                  getUserLocation={getUserLocation}
                  calculateDistance={calculateDistance}
                />
              </Box>
            )}
            {selectedTab === 1 && (
              <Box className="tab-content">
                <OffersList 
                  offers={offers} 
                  selectedCategory={selectedCategory} 
                  selectedSubCategory={selectedSubCategory}
                  onOfferClick={handleOfferClick}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  addNotification={addNotification}
                  userLocation={userLocation}
                  calculateDistance={calculateDistance}
                />
              </Box>
            )}
            {selectedTab === 2 && (
              <Box className="tab-content">
                <FlashDealsWithBlocking 
                  flashDeals={flashDeals} 
                  onOfferClick={handleFlashDealClick}
                  activatedFlashDeals={activatedFlashDeals}
                  flashActivationTimes={flashActivationTimes}
                  onActivateFlashDeal={handleActivateFlashDeal}
                />
              </Box>
            )}
            {selectedTab === 3 && (
              <Box 
                className="tab-content"
                sx={{ 
                  p: { xs: 3, sm: 4 },
                  height: { xs: 'calc(100vh - 120px)', sm: 'auto' },
                  overflow: 'auto',
                  width: '100%'
                }}
              >
                {/* Header del perfil */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: { xs: 3, sm: 4 },
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, fontSize: { xs: 18, sm: 24 }, color: '#ffeb3b' }} />
                    <Typography variant="h5" sx={{ 
                      fontSize: { xs: '1.1rem', sm: '1.5rem' },
                      color: '#2196f3',
                      fontWeight: 'bold'
                    }}>
                      Mon Profil
                    </Typography>
                  </Box>
                  
                  {/* Estado de suscripción */}
                  <Box sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: checkTrialStatus(userProfile) ? '#4caf50' : checkSubscriptionStatus(userProfile) ? '#4caf50' : '#ff9800',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {checkTrialStatus(userProfile) ? '🎉 Essai' : checkSubscriptionStatus(userProfile) ? '✅ Actif' : '⚠️ Expiré'}
                  </Box>
                </Box>
                
                {userProfile ? (
                  <>
                    <Typography variant="body1" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                      {t('abonnementValableJusquau')} {userProfile.subscriptionEnd.toDate().toLocaleDateString()}
                    </Typography>
                    
                    {/* Estadísticas simplificadas */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: { xs: 2, sm: 3 }, 
                      mb: { xs: 3, sm: 4 }
                    }}>
                      {/* Ofertas utilizadas */}
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        backgroundColor: '#333',
                        borderRadius: 2,
                        border: '1px solid #555'
                      }}>
                        <Box sx={{
                          width: { xs: 40, sm: 60 },
                          height: { xs: 40, sm: 60 },
                          borderRadius: '50%',
                          bgcolor: '#2196f3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 1
                        }}>
                          <ShopIcon sx={{ fontSize: { xs: 20, sm: 30 }, color: 'white' }} />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ 
                          fontSize: { xs: '1.5rem', sm: '2rem' },
                          color: '#ffeb3b'
                        }}>
                          {userProfile.activatedOffers.length}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.875rem' },
                          color: 'white'
                        }}>
                          Ofertas Usadas
                        </Typography>
                      </Box>
                      
                      {/* Dinero ahorrado */}
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 2,
                        backgroundColor: '#333',
                        borderRadius: 2,
                        border: '1px solid #555'
                      }}>
                        <Box sx={{
                          width: { xs: 40, sm: 60 },
                          height: { xs: 40, sm: 60 },
                          borderRadius: '50%',
                          bgcolor: '#4caf50',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 1
                        }}>
                          <AttachMoney sx={{ fontSize: { xs: 20, sm: 30 }, color: 'white' }} />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ 
                          fontSize: { xs: '1.5rem', sm: '2rem' },
                          color: '#4caf50'
                        }}>
                          CHF {userProfile.totalSaved.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.875rem' },
                          color: 'white'
                        }}>
                          Dinero Ahorrado
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">{t('informationsPersonnelles')}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={openEditProfileModal}
                        sx={{ 
                          borderColor: '#2196f3', 
                          color: '#2196f3',
                          '&:hover': { 
                            borderColor: '#1976d2', 
                            bgcolor: 'rgba(33, 150, 243, 0.1)' 
                          }
                        }}
                      >
                        ✏️ {t('modifier')}
                      </Button>
                    </Box>
                    <List>
                      <ListItem>
                        <ListItemIcon><Person /></ListItemIcon>
                        <ListItemText primary={t('nom')} secondary={userProfile.name} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><LocationIcon /></ListItemIcon>
                        <ListItemText primary={t('ville')} secondary={userProfile.city} />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>{t('dernieresOffresActivees')}</Typography>
                    <List>
                      {userProfile.activatedOffers.slice(-5).reverse().map((activation) => {
                        const offer = offers.find(o => o.id === activation.offerId);
                        if (!offer) return null;
                        return (
                          <ListItem key={activation.offerId + activation.activatedAt.toString()}>
                            <ListItemIcon>
                              {categories.find(cat => cat.id === offer.category)?.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={offer.name}
                              secondary={`${activation.activatedAt.toDate().toLocaleDateString()} - ${activation.savedAmount.toFixed(2)} CHF`}
                            />
                          </ListItem>
                        );
                      })}
                    </List>

                    {/* Sección de dinero integrada */}
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MonetizationOn sx={{ mr: 1, fontSize: { xs: 18, sm: 24 }, color: '#ffeb3b' }} />
                      <Typography variant="h5" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                        {t('tableauBordFinancier')}
                      </Typography>
                    </Box>
                    
                    {/* Resumen financiero */}
                    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccountBalanceWallet sx={{ fontSize: 32, mr: 2 }} />
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                              {t('resumeFinancier')}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-around' }}>
                          <Box sx={{ flex: 1, minWidth: 150, textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                              CHF {userProfile.totalSaved.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              {t('totalEconomise')}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ flex: 1, minWidth: 150, textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {userProfile.activatedOffers.length}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              {t('offresUtilisees')}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ flex: 1, minWidth: 150, textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {checkTrialStatus(userProfile) ? 'Essai' : checkSubscriptionStatus(userProfile) ? 'Active' : 'Inactive'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              {t('abonnement')}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                    
                    {/* Nueva sección: Estadísticas detalladas del usuario */}
                    <Divider sx={{ my: 3 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccessTime sx={{ mr: 1, fontSize: { xs: 18, sm: 24 }, color: '#ffeb3b' }} />
                      <Typography variant="h5" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                        Estadísticas Personales
                      </Typography>
                    </Box>
                    
                    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', color: 'white' }}>
                      <CardContent>
                        {(() => {
                          const stats = getUserStats();
                          if (!stats) return null;
                          
                          return (
                            <>
                              <Typography variant="h6" sx={{ mb: 2, color: '#ffeb3b' }}>
                                Tu actividad en FLASH
                              </Typography>
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Miembro desde
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {stats.joinDate.toDate().toLocaleDateString()}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Ofertas vistas
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {stats.totalOffersViewed}
                                  </Typography>
                                </Box>
                                
                              </Box>
                              
                              {stats.favoriteCategories.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                    Tus categorías favoritas
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {stats.favoriteCategories.slice(0, 5).map((category, index) => (
                                      <Chip
                                        key={index}
                                        label={category}
                                        size="small"
                                        sx={{
                                          bgcolor: '#2196f3',
                                          color: '#333',
                                          fontWeight: 'bold'
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Chargement du profil...</Typography>
                  </Box>
                )}

                {/* Sección de Admin - Solo visible si es admin */}
                {isAdmin && (
                  <>
                    <Divider sx={{ my: { xs: 2, sm: 3 } }} />
                    <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Administration</Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2 } }}>
                      <Button
                        variant="contained"
                        startIcon={<Add sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                        onClick={() => setShowAddModal(true)}
                        sx={{ 
                          bgcolor: '#2196f3', 
                          '&:hover': { bgcolor: '#45a049' },
                          py: { xs: 2, sm: 1.5 },
                          px: { xs: 3, sm: 2 },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          minHeight: { xs: 48, sm: 40 }
                        }}
                      >
                        Ajouter Nouvelle Offre
                      </Button>
                      
                      <Button
                        variant="contained"
                        startIcon={<FlashOn sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                        onClick={() => setShowAddFlashModal(true)}
                        sx={{ 
                          bgcolor: '#2196f3', 
                          '&:hover': { bgcolor: '#fbc02d' },
                          py: { xs: 2, sm: 1.5 },
                          px: { xs: 3, sm: 2 },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          minHeight: { xs: 48, sm: 40 }
                        }}
                      >
                        Créer Offre Flash
                      </Button>
                      
                      <Button
                        variant="contained"
                        startIcon={<Store sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                        onClick={() => setShowPartnersModal(true)}
                        sx={{ 
                          bgcolor: '#FFD700', 
                          color: '#000',
                          '&:hover': { bgcolor: '#FFA000' },
                          py: { xs: 2, sm: 1.5 },
                          px: { xs: 3, sm: 2 },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          minHeight: { xs: 48, sm: 40 }
                        }}
                      >
                        Gérer les Partenaires
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<Close sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                        onClick={() => setIsAdmin(false)}
                        sx={{ 
                          borderColor: '#2196f3', 
                          color: '#2196f3',
                          '&:hover': { 
                            borderColor: '#fbc02d', 
                            bgcolor: 'rgba(244, 67, 54, 0.1)' 
                          },
                          py: { xs: 2, sm: 1.5 },
                          px: { xs: 3, sm: 2 },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          minHeight: { xs: 48, sm: 40 }
                        }}
                      >
                        Sortir Admin
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Box>

                {/* Admin Login Modal */}
      <Dialog 
        open={showAdminLoginModal} 
        onClose={() => setShowAdminLoginModal(false)}
        maxWidth="sm"
        fullWidth
      >
                    <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">🔐 Admin Access</Typography>
            <IconButton onClick={() => setShowAdminLoginModal(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
              Ingresa tus credenciales de administrador para acceder al panel de control.
            </Typography>
            
            <TextField
              label="Admin email"
              type="email"
              value={adminLoginCredentials.email}
              onChange={(e) => setAdminLoginCredentials({...adminLoginCredentials, email: e.target.value})}
              fullWidth
              required
              placeholder="admin@flash.com"
            />
            
            <TextField
              label="Admin password"
              type="password"
              value={adminLoginCredentials.password}
              onChange={(e) => setAdminLoginCredentials({...adminLoginCredentials, password: e.target.value})}
              fullWidth
              required
              placeholder="••••••••"
            />

            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Nota:</strong> Solo usuarios con permisos de administrador pueden acceder a esta sección.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdminLoginModal(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleAdminLogin}
            variant="contained"
            disabled={!adminLoginCredentials.email || !adminLoginCredentials.password || isLoading}
            sx={{ bgcolor: '#ffeb3b', '&:hover': { bgcolor: '#7b1fa2' } }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                Verificando...
              </>
            ) : (
              'Acceder como Admin'
            )}
          </Button>
        </DialogActions>
          </Dialog>

          {/* Modal para agregar nueva oferta */}
          <Dialog 
            open={showAddModal} 
            onClose={() => setShowAddModal(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">➕ Ajouter Nouvelle Offre</Typography>
                <IconButton onClick={() => setShowAddModal(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Business name"
                  value={newOffer.name}
                  onChange={(e) => setNewOffer({...newOffer, name: e.target.value})}
                  fullWidth
                  required
                />
                
                <TextField
                  label="Adresse"
                  value={newOffer.address}
                  onChange={(e) => setNewOffer({...newOffer, address: e.target.value})}
                  fullWidth
                  required
                  placeholder="Ej: Avenue de la Gare 1, Sion"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    select
                    label="Categoría"
                    value={newOffer.category}
                    onChange={(e) => setNewOffer({...newOffer, category: e.target.value})}
                    fullWidth
                  >
                    <option value="restaurants">Restaurantes</option>
                    <option value="bars">Bares</option>
                    <option value="bakeries">Boulangeries</option>
                    <option value="shops">Tiendas</option>
                    <option value="clothing">Ropa</option>
                    <option value="grocery">Supermercados</option>
                    <option value="beauty">Belleza</option>
                    <option value="health">Salud</option>
                    <option value="fitness">Deportes</option>
                    <option value="entertainment">Entretenimiento</option>
                    <option value="services">Servicios</option>
                    <option value="transport">Transporte</option>
                    <option value="accommodation">Alojamiento</option>
                  </TextField>

                  <TextField
                    label="Subcategoría"
                    value={newOffer.subCategory}
                    onChange={(e) => setNewOffer({...newOffer, subCategory: e.target.value})}
                    fullWidth
                    placeholder="Ej: Pizza, Peluquería, Gimnasio, etc."
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Réduction/Offre"
                    value={newOffer.discount}
                    onChange={(e) => setNewOffer({...newOffer, discount: e.target.value})}
                    fullWidth
                    placeholder="Ej: -20% en pizzas"
                  />

                  <TextField
                    label="Prix"
                    value={newOffer.price}
                    onChange={(e) => setNewOffer({...newOffer, price: e.target.value})}
                    fullWidth
                    placeholder="Ej: CHF 25"
                  />
                </Box>

                <TextField
                  label="Description"
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Describe la oferta..."
                />

                <TextField
                  label="Note"
                  type="number"
                  value={newOffer.rating}
                  onChange={(e) => setNewOffer({...newOffer, rating: parseFloat(e.target.value)})}
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                  fullWidth
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowAddModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAddOffer}
                variant="contained"
                sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
              >
                Ajouter Offre
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal para agregar oferta flash */}
          <Dialog 
            open={showAddFlashModal} 
            onClose={() => setShowAddFlashModal(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">⚡ Créer Offre Flash</Typography>
                <IconButton onClick={() => setShowAddFlashModal(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Nom du business"
                  value={newFlashDeal.name}
                  onChange={(e) => setNewFlashDeal({...newFlashDeal, name: e.target.value})}
                  fullWidth
                  variant="outlined"
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    select
                    label="Catégorie"
                    value={newFlashDeal.category}
                    onChange={(e) => setNewFlashDeal({...newFlashDeal, category: e.target.value})}
                    sx={{ flex: 1 }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <TextField
                    label="Sous-catégorie"
                    value={newFlashDeal.subCategory}
                    onChange={(e) => setNewFlashDeal({...newFlashDeal, subCategory: e.target.value})}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Prix original (CHF)"
                    type="number"
                    value={newFlashDeal.originalPrice}
                    onChange={(e) => setNewFlashDeal({...newFlashDeal, originalPrice: parseFloat(e.target.value) || 0})}
                    sx={{ flex: 1 }}
                  />
                  
                  <TextField
                    label="Prix flash (CHF)"
                    type="number"
                    value={newFlashDeal.discountedPrice}
                    onChange={(e) => setNewFlashDeal({...newFlashDeal, discountedPrice: parseFloat(e.target.value) || 0})}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Durée (heures)"
                    type="number"
                    value={newFlashDeal.duration}
                    onChange={(e) => setNewFlashDeal({...newFlashDeal, duration: parseInt(e.target.value) || 2})}
                    sx={{ flex: 1 }}
                    inputProps={{ min: 1, max: 24 }}
                  />
                  
                  <TextField
                    label="Quantité max"
                    type="number"
                    value={newFlashDeal.maxQuantity}
                    onChange={(e) => setNewFlashDeal({...newFlashDeal, maxQuantity: parseInt(e.target.value) || 20})}
                    sx={{ flex: 1 }}
                    inputProps={{ min: 1 }}
                  />
                </Box>

                <TextField
                  label="Description"
                  value={newFlashDeal.description}
                  onChange={(e) => setNewFlashDeal({...newFlashDeal, description: e.target.value})}
                  fullWidth
                  multiline
                  rows={3}
                />
                
                <TextField
                  label="Adresse"
                  value={newFlashDeal.address}
                  onChange={(e) => setNewFlashDeal({...newFlashDeal, address: e.target.value})}
                  fullWidth
                />
                
                <TextField
                  label="Note (1-5)"
                  type="number"
                  value={newFlashDeal.rating}
                  onChange={(e) => setNewFlashDeal({...newFlashDeal, rating: parseFloat(e.target.value) || 4.5})}
                  inputProps={{ min: 1, max: 5, step: 0.1 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowAddFlashModal(false)}>
                {t('annuler')}
              </Button>
              <Button 
                onClick={handleAddFlashDeal}
                variant="contained"
                sx={{ bgcolor: '#ffeb3b', '&:hover': { bgcolor: '#fbc02d' } }}
              >
                Créer Offre Flash
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de Gestión de Partenaires */}
          <Dialog 
            open={showPartnersModal} 
            onClose={() => setShowPartnersModal(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">🏪 Gérer les Partenaires</Typography>
                <IconButton onClick={() => setShowPartnersModal(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {/* Lista de socios existentes */}
                <Typography variant="h6" gutterBottom>
                  Partenaires actuels ({partners.length})
                </Typography>
                
                {partners.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    <Typography variant="body1">
                      Aucun partenaire ajouté
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {partners.map((partner, index) => (
                      <Box 
                        key={partner.id || index}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>
                            {partner.icon}
                          </Typography>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {partner.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {partner.address}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton 
                          onClick={() => {
                            const newPartners = partners.filter((_, i) => i !== index);
                            setPartners(newPartners);
                          }}
                          sx={{ color: '#f44336' }}
                        >
                          <Close />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                {/* Formulario para añadir nuevo socio */}
                <Typography variant="h6" gutterBottom>
                  Ajouter un nouveau partenaire
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Nom du partenaire"
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                    fullWidth
                    variant="outlined"
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                      Icône du partenaire
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 120, overflowY: 'auto' }}>
                      {[
                        { id: 'restaurant', icon: '🍽️', name: 'Restaurant' },
                        { id: 'bar', icon: '🍷', name: 'Bar' },
                        { id: 'shop', icon: '🏪', name: 'Magasin' },
                        { id: 'hotel', icon: '🏨', name: 'Hôtel' },
                        { id: 'gas', icon: '⛽', name: 'Station' },
                        { id: 'bank', icon: '🏦', name: 'Banque' },
                        { id: 'pharmacy', icon: '💊', name: 'Pharmacie' },
                        { id: 'gym', icon: '🏋️', name: 'Fitness' },
                        { id: 'beauty', icon: '💄', name: 'Beauté' },
                        { id: 'car', icon: '🚗', name: 'Auto' },
                        { id: 'clothes', icon: '👔', name: 'Mode' },
                        { id: 'electronics', icon: '📱', name: 'Électronique' }
                      ].map((iconOption) => (
                        <Box
                          key={iconOption.id}
                          onClick={() => setNewPartner({...newPartner, icon: iconOption.icon})}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            p: 1.5,
                            border: newPartner.icon === iconOption.icon ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 2,
                            cursor: 'pointer',
                            bgcolor: newPartner.icon === iconOption.icon ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: 'rgba(255, 215, 0, 0.1)',
                              borderColor: '#FFD700'
                            },
                            minWidth: 60
                          }}
                        >
                          <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                            {iconOption.icon}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            fontSize: '0.7rem', 
                            color: 'rgba(255, 255, 255, 0.8)',
                            textAlign: 'center'
                          }}>
                            {iconOption.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 1 }}>
                      Sélectionnez une icône professionnelle pour le partenaire
                    </Typography>
                  </Box>
                  
                  <TextField
                    label="Adresse"
                    value={newPartner.address}
                    onChange={(e) => setNewPartner({...newPartner, address: e.target.value})}
                    fullWidth
                    variant="outlined"
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Latitude"
                      type="number"
                      value={newPartner.location.lat}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        location: {...newPartner.location, lat: parseFloat(e.target.value) || 0}
                      })}
                      sx={{ flex: 1 }}
                    />
                    
                    <TextField
                      label="Longitude"
                      type="number"
                      value={newPartner.location.lng}
                      onChange={(e) => setNewPartner({
                        ...newPartner, 
                        location: {...newPartner.location, lng: parseFloat(e.target.value) || 0}
                      })}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  
                  <TextField
                    label="Remise"
                    value={newPartner.discount}
                    onChange={(e) => setNewPartner({...newPartner, discount: e.target.value})}
                    fullWidth
                    variant="outlined"
                    placeholder="20% OFF"
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPartnersModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  if (newPartner.name && newPartner.icon && newPartner.address) {
                    const partner = {
                      ...newPartner,
                      id: `partner_${Date.now()}`
                    };
                    setPartners([...partners, partner]);
                    setNewPartner({
                      name: '',
                      icon: '',
                      address: '',
                      location: { lat: 46.2306, lng: 7.3590 },
                      discount: '20% OFF'
                    });
                  }
                }}
                variant="contained"
                disabled={!newPartner.name || !newPartner.icon || !newPartner.address}
                sx={{ bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFA000' } }}
              >
                Ajouter Partenaire
              </Button>
            </DialogActions>
          </Dialog>

          {/* Offer Detail Dialog */}
          <OfferDetail 
            offer={selectedOffer} 
            open={detailOpen} 
            onClose={() => setDetailOpen(false)} 
          />

          {/* Modal de Suscripción */}
          <SubscriptionModal 
            open={showSubscriptionModal} 
            onClose={() => setShowSubscriptionModal(false)}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            currentUser={currentUser}
          />

          {/* Modal de Prueba Gratuita */}
          <TrialModal 
            open={showTrialModal} 
            onClose={() => setShowTrialModal(false)}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            currentUser={currentUser}
            addNotification={addNotification}
          />

          {/* Modal de Suscripción Requerida */}
          <SubscriptionRequiredModal 
            open={showSubscriptionRequiredModal} 
            onSubscribe={() => {
              setShowSubscriptionRequiredModal(false);
              setShowSubscriptionModal(true);
            }}
          />

          {/* Modal de Suscripción Requerida */}
          <Dialog
            open={showSubscriptionOverlay}
            onClose={() => {}}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            sx={{
              '& .MuiDialog-paper': {
                borderRadius: 3,
                overflow: 'hidden'
              }
            }}
          >
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                🔒 Abonnement Requis
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                Vous devez vous abonner pour accéder à cette application
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                {t('choisirPlanAbonnement')} pour commencer à utiliser l'application
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                💡 Paiement par offre : 5% du coût de l'offre utilisée
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setShowSubscriptionOverlay(false);
                    setShowSubscriptionModal(true);
                  }}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Voir les Plans
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    setShowSubscriptionOverlay(false);
                    // Ya no reaparece automáticamente - el usuario puede navegar libremente
                  }}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  Fermer
                </Button>
              </Box>
            </Box>
          </Dialog>
        </Box>
      )}

      {/* Navegación inferior fija */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: '#1a1a1a',
        borderTop: '1px solid #333',
        zIndex: 1000
      }}>
        {/* Filtros */}
        {selectedTab === 1 && (
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1a1a1a',
            px: 2,
            py: 1,
            gap: 1,
            alignItems: 'center',
            borderBottom: '1px solid #333'
          }}>
            <Typography variant="body2" sx={{ color: '#ffeb3b !important', fontSize: '0.8rem', mb: 1 }}>
              {t('filtros')}
            </Typography>
            <Box sx={{
              display: 'flex',
              gap: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <IconButton
                onClick={() => setSelectedCategory(selectedCategory === 'restaurants' ? 'all' : 'restaurants')}
                sx={{
                  bgcolor: selectedCategory === 'restaurants' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  minWidth: 40,
                  minHeight: 40,
                  color: 'white',
                  fontSize: '18px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <RestaurantIcon sx={{ fontSize: 20, color: '#ffeb3b' }} />
              </IconButton>
              <IconButton
                onClick={() => setSelectedCategory(selectedCategory === 'bars' ? 'all' : 'bars')}
                sx={{
                  bgcolor: selectedCategory === 'bars' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  minWidth: 40,
                  minHeight: 40,
                  color: 'white',
                  fontSize: '18px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <BarIcon sx={{ fontSize: 20, color: '#ffeb3b' }} />
              </IconButton>
              <IconButton
                onClick={() => setSelectedCategory(selectedCategory === 'shops' ? 'all' : 'shops')}
                sx={{
                  bgcolor: selectedCategory === 'shops' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  minWidth: 40,
                  minHeight: 40,
                  color: 'white',
                  fontSize: '18px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Store sx={{ fontSize: 20, color: '#ffeb3b' }} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Sección de Partenaires - Solo en la pestaña del mapa */}
        {selectedTab === 0 && (
          <Box 
            className="partners-section"
            sx={{
              position: 'relative',
              backgroundColor: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid #333',
              borderBottom: '1px solid #333',
              p: { xs: 1.5, sm: 2 },
              maxHeight: { xs: '120px', sm: '150px' },
              overflowY: 'hidden', // Solo scroll horizontal
              zIndex: 1000,
              touchAction: 'pan-x',
              marginTop: { xs: '20px', sm: '20px' },
              width: '100%'
            }}
          >
            <Typography variant="h6" sx={{ 
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: { xs: 1.5, sm: 2 }, 
              fontWeight: 700,
              textAlign: 'center',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.02em'
            }}>
              Nos Partenaires
            </Typography>
            
            {/* Mostrar todos los sitios de List y Flash como partners */}
            <Box 
              className="no-select touch-optimized"
              sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 1.5 }, 
                overflowX: 'auto',
                overflowY: 'hidden', // Solo scroll horizontal
                pb: 1,
                '&::-webkit-scrollbar': { 
                  height: 6,
                  backgroundColor: 'rgba(255,255,255,0.05)'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'var(--primary-gold)',
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: 'var(--primary-gold-light)'
                  }
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 3
                }
              }}
            >
              {/* Ofertas regulares de List */}
              {offers.map((offer) => (
                <Box 
                  key={`list-${offer.id}`}
                  sx={{ 
                    minWidth: { xs: 120, sm: 140 },
                    maxWidth: { xs: 120, sm: 140 },
                    background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                    border: '1px solid #333',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: 'var(--primary-gold)',
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
                    }
                  }}
                  onClick={() => handleOfferClick(offer)}
                >
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    mx: 'auto', 
                    mb: 1,
                    background: 'linear-gradient(135deg, #FFD700, #FFA000)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {offer.category === 'restaurants' ? '🍽️' : 
                     offer.category === 'bars' ? '🍸' : 
                     offer.category === 'shops' ? '🛍️' : 
                     offer.category === 'beauty' ? '💄' : 
                     offer.category === 'fitness' ? '💪' : '🏪'}
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: '#fff', 
                    fontWeight: 'bold',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {offer.name}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'var(--primary-gold)', 
                    fontSize: '0.7rem',
                    display: 'block',
                    mt: 0.5
                  }}>
                    {offer.discount}
                  </Typography>
                </Box>
              ))}

              {/* Ofertas Flash */}
              {flashDeals.map((deal) => (
                <Box 
                  key={`flash-${deal.id}`}
                  sx={{ 
                    minWidth: { xs: 120, sm: 140 },
                    maxWidth: { xs: 120, sm: 140 },
                    background: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)',
                    border: '1px solid #FF6B35',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
                    }
                  }}
                  onClick={() => handleFlashDealClick(deal)}
                >
                  {/* Badge Flash */}
                  <Box sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#FFD700',
                    color: '#333',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    ⚡
                  </Box>
                  
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    mx: 'auto', 
                    mb: 1,
                    background: 'linear-gradient(135deg, #FFD700, #FFA000)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {deal.category === 'restaurants' ? '🍽️' : 
                     deal.category === 'bars' ? '🍸' : 
                     deal.category === 'shops' ? '🛍️' : 
                     deal.category === 'beauty' ? '💄' : 
                     deal.category === 'fitness' ? '💪' : '🏪'}
                  </Box>
                  <Typography variant="caption" sx={{ 
                    color: '#fff', 
                    fontWeight: 'bold',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {deal.name}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: '#FFD700', 
                    fontSize: '0.7rem',
                    display: 'block',
                    mt: 0.5
                  }}>
                    {deal.discount}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Tabs de navegación */}
        <Tabs 
          value={selectedTab} 
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
          sx={{
            minHeight: { xs: 60, sm: 60 },
            width: '100%',
            '& .MuiTabs-flexContainer': {
              height: { xs: 60, sm: 60 },
              width: '100%'
            },
            '& .MuiTab-root': {
              minHeight: { xs: 60, sm: 60 },
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              py: { xs: 1, sm: 1 },
              px: { xs: 0.5, sm: 1 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#ffeb3b !important',
              border: '2px solid transparent',
              borderRadius: '8px',
              margin: '4px',
              backgroundColor: 'black',
              '&.Mui-selected': {
                color: 'black !important',
                backgroundColor: '#ffeb3b !important',
                border: '2px solid transparent',
                '& .MuiSvgIcon-root': {
                  color: 'black !important'
                }
              },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: 18, sm: 20 },
                color: '#ffeb3b !important',
                display: 'block',
                visibility: 'visible',
                marginBottom: '2px'
              }
            }
          }}
        >
          <Tab 
            icon={<MapIcon sx={{ color: '#ffeb3b !important' }} />} 
            label={t('carte')} 
            iconPosition="top"
          />
          <Tab 
            icon={<ListIcon sx={{ color: '#ffeb3b !important' }} />} 
            label={t('liste')} 
            iconPosition="top"
          />
          <Tab 
            icon={
              ((userProfile?.activatedOffers?.length ?? 0) > 0 || activatedFlashDeals.size > 0) ? (
                <FlashIcon sx={{ 
                  color: '#ffeb3b !important',
                  filter: 'drop-shadow(0 0 8px #ffeb3b)',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      filter: 'drop-shadow(0 0 8px #ffeb3b)',
                      transform: 'scale(1)'
                    },
                    '50%': {
                      filter: 'drop-shadow(0 0 12px #ffeb3b)',
                      transform: 'scale(1.1)'
                    },
                    '100%': {
                      filter: 'drop-shadow(0 0 8px #ffeb3b)',
                      transform: 'scale(1)'
                    }
                  }
                }} />
              ) : (
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  backgroundColor: '#ffeb3b',
                  opacity: 0.3
                }} />
              )
            } 
            label={t('flash')} 
            iconPosition="top"
          />
          <Tab 
            icon={<ProfileIcon sx={{ color: '#ffeb3b !important' }} />} 
            label={t('profil')} 
            iconPosition="top"
          />
        </Tabs>
      </Box>
    </ThemeProvider>
  );
}

export default App;
