import { useState, useEffect, useRef } from 'react';
import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from './firebase';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { getAuthErrorMessage, validateEmail, validatePassword, validateName } from './utils/authUtils';
import { 
  AreaChart, 
  Area, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
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
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Alert,
  AlertTitle,
  Snackbar,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  LocationOn, 
  Restaurant, 
  LocalBar, 
  BakeryDining, 
  ShoppingBag, 
  AttachMoney,
  Person,
  Map,
  List as ListIcon,
  Star,
  Phone,
  Directions,
  Close,
  MyLocation,
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
  TrendingUp,
  Receipt,
  CreditCard,
  MonetizationOn,
  TrendingDown,
  FilterList,
  Download,
  PieChart,
  ShowChart,
  GetApp,
  Search,
  Sort,
  MoreVert,
  Warning,
  CheckCircle,
  Pending,
  Settings
} from '@mui/icons-material';
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
  }[];
  totalSaved: number;
  points: number;
  level: number;
  achievements: string[];
  subscriptionEnd: Timestamp;
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'pending';
  subscriptionPlan: 'monthly' | 'yearly' | 'none';
  paymentMethod?: string;
  lastPaymentDate?: Timestamp;
  nextPaymentDate?: Timestamp;
  totalPaid: number;
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
  flashPrice: number;
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
    icon: <Restaurant />,
    subCategories: ['Vegan', 'Grill', 'Salad', 'Pizza', 'Fastfood', 'Italien', 'Chinois', 'Japonais', 'Indien', 'Mexicain', 'Français']
  },
  {
    id: 'bars',
    name: 'Bars',
    icon: <LocalBar />,
    subCategories: ['Cocktails', 'Beers', 'Wines', 'Coffee', 'Tea', 'Pubs', 'Clubs', 'Lounge']
  },
  {
    id: 'bakeries',
    name: 'Bakeries',
    icon: <BakeryDining />,
    subCategories: ['Bread', 'Pastries', 'Sandwiches', 'Croissants', 'Cakes', 'Pies']
  },
  {
    id: 'shops',
    name: 'Shops',
    icon: <Store />,
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
    flashPrice: 8,
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
    flashPrice: 6,
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
    flashPrice: 1.5,
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
  
  return userProfile.subscriptionStatus === 'active' && subscriptionEnd > now;
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

function MapView({ offers, selectedCategory, onOfferClick }: { 
  offers: Offer[], 
  selectedCategory: string, 
  onOfferClick: (offer: Offer) => void 
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
  
  const filteredOffers = selectedCategory === 'all' 
    ? offers 
    : offers.filter(offer => offer.category === selectedCategory);

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
      
      const marker = new window.google.maps.Marker({
        position: { lat: offer.location.lat, lng: offer.location.lng },
        map: mapInstanceRef.current,
        title: offer.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${offer.isNew ? '#ff6b6b' : '#4caf50'}" stroke="white" stroke-width="2"/>
              <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">
                ${offer.category === 'restaurants' ? '🍽️' : offer.category === 'bars' ? '🍷' : '🥖'}
              </text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      });

      // Info window con información de la oferta
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 5px 0; color: #333;">${offer.name}</h3>
            <p style="margin: 0 0 5px 0; color: #e74c3c; font-weight: bold;">${offer.discount}</p>
            <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">${offer.description}</p>
            <p style="margin: 0; color: #999; font-size: 11px;">⭐ ${offer.rating} • ${offer.location.address}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        onOfferClick(offer);
      });

      markersRef.current.push(marker);
    });
  }, [filteredOffers, onOfferClick, mapLoaded]);

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
    <Box sx={{ 
      height: { xs: 'calc(100vh - 120px)', sm: '70vh' }, 
      position: 'relative', 
      borderRadius: { xs: 0, sm: 2 }, 
      overflow: 'hidden',
      width: '100%'
    }}>
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
            gap: { xs: 1, sm: 1 },
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
            bgcolor: '#4caf50',
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
            bgcolor: '#f44336',
            color: 'white',
            borderRadius: { xs: 1, sm: 2 },
            px: { xs: 2, sm: 2 },
            py: { xs: 1, sm: 1 },
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#d32f2f',
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
            <MyLocation sx={{ fontSize: { xs: 18, sm: 24 } }} />
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
              🗺️ FLASH Map
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
              Vue interactive des offres FLASH
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
                  bgcolor: offer.isNew ? '#ff6b6b' : '#4caf50',
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
              label="Address"
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
                label="Discount/Offer"
                value={newOffer.discount}
                onChange={(e) => setNewOffer({...newOffer, discount: e.target.value})}
                fullWidth
                placeholder="Ej: -20% en pizzas"
              />

              <TextField
                label="Price"
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
            Cancel
          </Button>
          <Button 
            onClick={handleAddOffer}
            variant="contained"
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            Add Offer
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
            Cancel
          </Button>
          <Button 
            onClick={handleLogin}
            variant="contained"
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          >
            Sign in
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function OffersList({ offers, selectedCategory, selectedSubCategory, onOfferClick, currentUser, userProfile, setUserProfile, addNotification }: {
  offers: Offer[],
  selectedCategory: string,
  selectedSubCategory: string,
  onOfferClick: (offer: Offer) => void,
  currentUser: User | null,
  userProfile: UserProfile | null,
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  addNotification: (type: 'success' | 'info' | 'warning', message: string) => void
}) {
  const [swipedOffers, setSwipedOffers] = useState<Set<string>>(new Set());
  const [explosions, setExplosions] = useState<Set<string>>(new Set());
  const [swipeStates, setSwipeStates] = useState<{[key: string]: { 
    translateX: number, 
    isSliding: boolean,
    startX?: number,
    startY?: number
  }}>({});

  const filteredOffers = offers.filter(offer => {
    if (selectedCategory !== 'all' && offer.category !== selectedCategory) return false;
    if (selectedSubCategory !== 'all' && offer.subCategory !== selectedSubCategory) return false;
    return true;
  });

  const handleTouchStart = (offerId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeStates(prev => ({
      ...prev,
      [offerId]: {
        ...prev[offerId],
        startX: touch.clientX,
        startY: touch.clientY,
        isSliding: false,
        translateX: prev[offerId]?.translateX || 0
      }
    }));
  };

  const handleTouchMove = (offerId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const state = swipeStates[offerId];
    if (!state || !state.startX || !state.startY) return;

    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    // Only allow horizontal swipe if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault(); // Prevent scrolling
      
      // Limit swipe to left only and max distance
      const newTranslateX = Math.min(0, Math.max(-150, deltaX));
      
      setSwipeStates(prev => ({
        ...prev,
        [offerId]: {
          ...prev[offerId],
          translateX: newTranslateX,
          isSliding: true
        }
      }));
    }
  };

  const handleTouchEnd = async (offerId: string) => {
    const state = swipeStates[offerId];
    if (!state) return;

    // If swiped more than 80px to the left, activate the offer
    if (state.translateX < -80) {
      setSwipedOffers(prev => new Set([...prev, offerId]));
      setSwipeStates(prev => ({
        ...prev,
        [offerId]: { translateX: -150, isSliding: false }
      }));
      
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
      const offer = offers.find(o => o.id === offerId);
      if (offer && offer.price && offer.oldPrice) {
        const savedAmount = parseFloat(offer.oldPrice.replace('CHF ', '')) - parseFloat(offer.price.replace('CHF ', ''));
        try {
          if (currentUser && userProfile) {
            const userRef = doc(db, 'users', currentUser.uid);
            const newActivation = {
              offerId,
              activatedAt: Timestamp.now(),
              savedAmount
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
            addNotification('success', `🎉 Offre activée! Vous avez économisé ${savedAmount.toFixed(2)} CHF!`);
          }, 800);
        } catch (error) {
          console.error('Error activating offer:', error);
          alert('Error al activar la oferta. Por favor intente de nuevo.');
        }
      } else {
        // Show activation message without savings
        setTimeout(() => {
          alert('🎉 Offre activée! Montrez cet écran au commerçant.');
        }, 800);
      }
    } else {
      // Snap back to original position
      setSwipeStates(prev => ({
        ...prev,
        [offerId]: { translateX: 0, isSliding: false }
      }));
    }
  };

  return (
    <Box sx={{ 
      height: { xs: 'calc(100vh - 120px)', sm: '70vh' }, 
      overflow: 'auto',
      width: '100%'
    }}>
      {filteredOffers.map((offer) => {
        const isActivated = swipedOffers.has(offer.id);
        const isExploding = explosions.has(offer.id);
        const swipeState = swipeStates[offer.id] || { translateX: 0, isSliding: false };
        
        return (
        <Box
          key={offer.id}
          sx={{
            position: 'relative',
            mb: { xs: 2, sm: 2 },
            overflow: 'visible',
            borderRadius: { xs: 1, sm: 2 }
          }}
        >
          {/* Explosion Effect */}
          {isExploding && (
            <>
              {/* Central explosion */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '20px',
                  height: '20px',
                  bgcolor: '#ffd700',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  animation: 'explode 0.6s ease-out forwards',
                  zIndex: 1000,
                  '@keyframes explode': {
                    '0%': {
                      transform: 'translate(-50%, -50%) scale(0)',
                      opacity: 1
                    },
                    '50%': {
                      transform: 'translate(-50%, -50%) scale(8)',
                      opacity: 0.8,
                      bgcolor: '#ff6b6b'
                    },
                    '100%': {
                      transform: 'translate(-50%, -50%) scale(15)',
                      opacity: 0,
                      bgcolor: '#4caf50'
                    }
                  }
                }}
              />
              
              {/* Particles */}
              {[...Array(12)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '8px',
                    height: '8px',
                    bgcolor: ['#ffd700', '#ff6b6b', '#4caf50', '#2196f3', '#ff9800'][i % 5],
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: `particle${i} 1s ease-out forwards`,
                    zIndex: 999,
                    [`@keyframes particle${i}`]: {
                      '0%': {
                        transform: 'translate(-50%, -50%) scale(1)',
                        opacity: 1
                      },
                      '100%': {
                        transform: `translate(-50%, -50%) translate(${Math.cos(i * 30 * Math.PI / 180) * 100}px, ${Math.sin(i * 30 * Math.PI / 180) * 100}px) scale(0)`,
                        opacity: 0
                      }
                    }
                  }}
                />
              ))}
              
              {/* Stars */}
              {[...Array(8)].map((_, i) => (
                <Box
                  key={`star-${i}`}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    fontSize: '20px',
                    transform: 'translate(-50%, -50%)',
                    animation: `star${i} 1.2s ease-out forwards`,
                    zIndex: 998,
                    [`@keyframes star${i}`]: {
                      '0%': {
                        transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
                        opacity: 1
                      },
                      '50%': {
                        transform: `translate(-50%, -50%) translate(${Math.cos(i * 45 * Math.PI / 180) * 60}px, ${Math.sin(i * 45 * Math.PI / 180) * 60}px) scale(1.5) rotate(180deg)`,
                        opacity: 0.8
                      },
                      '100%': {
                        transform: `translate(-50%, -50%) translate(${Math.cos(i * 45 * Math.PI / 180) * 120}px, ${Math.sin(i * 45 * Math.PI / 180) * 120}px) scale(0) rotate(360deg)`,
                        opacity: 0
                      }
                    }
                  }}
                >
                  ⭐
      </Box>
              ))}
              
              {/* Confetti */}
              {[...Array(20)].map((_, i) => (
                <Box
                  key={`confetti-${i}`}
                  sx={{
                    position: 'absolute',
                    top: '30%',
                    left: '50%',
                    width: '6px',
                    height: '6px',
                    bgcolor: ['#ffd700', '#ff6b6b', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'][i % 6],
                    transform: 'translate(-50%, -50%)',
                    animation: `confetti${i} 1.5s ease-out forwards`,
                    zIndex: 997,
                    [`@keyframes confetti${i}`]: {
                      '0%': {
                        transform: `translate(-50%, -50%) rotate(0deg)`,
                        opacity: 1
                      },
                      '100%': {
                        transform: `translate(-50%, -50%) translate(${(Math.random() - 0.5) * 200}px, ${Math.random() * 150 + 50}px) rotate(${Math.random() * 720}deg)`,
                        opacity: 0
                      }
                    }
                  }}
                />
              ))}
            </>
          )}
          {/* Background when swiped */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 150,
              height: '100%',
              background: isActivated ? 
                'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)' : 
                'linear-gradient(45deg, #ff6b6b 30%, #ff8a80 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: { xs: '0.8rem', sm: '1rem' },
              fontWeight: 'bold',
              zIndex: 1
            }}
          >
            {isActivated ? '✅ ACTIVÉE!' : '← Glisser pour activer'}
          </Box>
          
          <Card 
            sx={{ 
              cursor: 'pointer',
              borderRadius: { xs: 1, sm: 2 },
              transform: `translateX(${swipeState.translateX}px)`,
              transition: swipeState.isSliding ? 'none' : 'transform 0.3s ease-out',
              position: 'relative',
              zIndex: 2,
              opacity: isActivated ? 0.9 : 1,
              filter: isActivated ? 'grayscale(20%)' : 'none'
            }} 
            onClick={() => !swipeState.isSliding && onOfferClick(offer)}
            onTouchStart={(e) => handleTouchStart(offer.id, e)}
            onTouchMove={(e) => handleTouchMove(offer.id, e)}
            onTouchEnd={() => handleTouchEnd(offer.id)}
          >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="150"
              image={offer.image || 'https://via.placeholder.com/300x150/333333/FFFFFF?text=Restaurant'}
              alt={offer.name}
              sx={{ 
                height: { xs: 150, sm: 200 },
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
              <Star sx={{ fontSize: 16, color: '#ffd700' }} />
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
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                {offer.location.address}
              </Typography>
              <Button 
                variant="outlined" 
                size="medium" 
                sx={{ 
                  color: '#111', 
                  borderColor: '#111',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  px: { xs: 3, sm: 2 },
                  py: { xs: 1.5, sm: 1 },
                  minHeight: { xs: 44, sm: 36 },
                  minWidth: { xs: 120, sm: 100 }
                }}
              >
                {'>>>'} Voir offre
              </Button>
            </Box>
          </CardContent>
          </Card>
        </Box>
        );
      })}
    </Box>
  );
}

// Componente para las ofertas flash con temporizador
function FlashDealsView({ flashDeals, onOfferClick }: { 
  flashDeals: FlashDeal[], 
  onOfferClick: (deal: FlashDeal) => void 
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar el tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Función para calcular el tiempo restante
  const getTimeRemaining = (endTime: Date) => {
    const now = currentTime.getTime();
    const end = endTime.getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isExpired: false };
  };

  // Filtrar ofertas activas
  const activeDeals = flashDeals.filter(deal => {
    const timeRemaining = getTimeRemaining(deal.endTime);
    return deal.isActive && !timeRemaining.isExpired;
  });

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 2 },
      height: { xs: 'calc(100vh - 120px)', sm: 'auto' },
      overflow: 'auto'
    }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          color: '#fff', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <FlashOn sx={{ color: '#ff6b35', fontSize: '2rem' }} />
          Offres Flash
        </Typography>
        <Typography variant="body1" sx={{ color: '#bbb', mb: 2 }}>
          Offres limitées avec des réductions incroyables ! Ne les manquez pas !
        </Typography>
      </Box>

      {activeDeals.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          color: '#bbb'
        }}>
          <AccessTime sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            No hay ofertas flash activas
          </Typography>
          <Typography variant="body2">
            Vuelve más tarde para ver nuevas ofertas
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {activeDeals.map((deal) => {
            const timeRemaining = getTimeRemaining(deal.endTime);
            const progressPercentage = deal.maxQuantity 
              ? ((deal.soldQuantity || 0) / deal.maxQuantity) * 100 
              : 0;

            return (
              <Card 
                key={deal.id} 
                sx={{ 
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  border: '1px solid #333',
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)',
                    borderColor: '#ff6b35'
                  }
                }}
                onClick={() => onOfferClick(deal)}
              >
                {/* Badge de descuento */}
                <Box sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)'
                }}>
                  {deal.discount}
                </Box>

                {/* Imagen */}
                <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                  <img 
                    src={deal.image} 
                    alt={deal.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                  {/* Overlay para el temporizador */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    p: 2
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'white',
                      mb: 1
                    }}>
                      <AccessTime sx={{ fontSize: '1rem' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Temps restant :
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1,
                      justifyContent: 'center'
                    }}>
                      <Box sx={{ 
                        background: 'rgba(255, 107, 53, 0.9)',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        textAlign: 'center',
                        minWidth: 40
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                          {timeRemaining.hours.toString().padStart(2, '0')}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          h
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        background: 'rgba(255, 107, 53, 0.9)',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        textAlign: 'center',
                        minWidth: 40
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                          {timeRemaining.minutes.toString().padStart(2, '0')}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          m
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        background: 'rgba(255, 107, 53, 0.9)',
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        textAlign: 'center',
                        minWidth: 40
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                          {timeRemaining.seconds.toString().padStart(2, '0')}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          s
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <CardContent sx={{ p: 2 }}>
                  {/* Nombre y categoría */}
                  <Typography variant="h6" sx={{ 
                    color: '#fff', 
                    fontWeight: 'bold', 
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {deal.name}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ 
                    color: '#888', 
                    mb: 2,
                    textTransform: 'capitalize'
                  }}>
                    {deal.subCategory}
                  </Typography>

                  {/* Precios */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h5" sx={{ 
                      color: '#ff6b35', 
                      fontWeight: 'bold' 
                    }}>
                      {deal.price}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#888', 
                      textDecoration: 'line-through' 
                    }}>
                      {deal.oldPrice}
                    </Typography>
                  </Box>

                  {/* Descripción */}
                  <Typography variant="body2" sx={{ 
                    color: '#bbb', 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {deal.description}
                  </Typography>

                  {/* Rating */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <Star sx={{ color: '#ffd700', fontSize: '1rem' }} />
                    <Typography variant="body2" sx={{ color: '#bbb' }}>
                      {deal.rating}
                    </Typography>
                  </Box>

                  {/* Barra de progreso de ventas */}
                  {deal.maxQuantity && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 1
                      }}>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          Vendu : {deal.soldQuantity || 0} / {deal.maxQuantity}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
                          {Math.round(progressPercentage)}% vendu
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 6, 
                        backgroundColor: '#333', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          width: `${Math.min(progressPercentage, 100)}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #ff6b35, #f7931e)',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  )}

                  {/* Ubicación */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    color: '#888'
                  }}>
                    <LocationOn sx={{ fontSize: '1rem' }} />
                    <Typography variant="caption" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {deal.location.address}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
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
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleSubscribe = async () => {
    if (!currentUser) return;
    
    setIsProcessing(true);
    try {
      const success = await processSubscriptionPayment(currentUser.uid, selectedPlan);
      if (success) {
        // Actualizar el perfil local
        const updatedProfile = userProfile ? {
          ...userProfile,
          subscriptionStatus: 'active' as const,
          subscriptionPlan: selectedPlan as 'monthly' | 'yearly',
          subscriptionEnd: Timestamp.fromDate(calculateNextPaymentDate(selectedPlan as 'monthly' | 'yearly')),
          lastPaymentDate: Timestamp.now(),
          nextPaymentDate: Timestamp.fromDate(calculateNextPaymentDate(selectedPlan as 'monthly' | 'yearly')),
          totalPaid: SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price || 0
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
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3
      }}>
        {isSubscriptionActive ? 'Gestion de l\'Abonnement' : 'Activer l\'Abonnement'}
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        {isSubscriptionActive ? (
          // Mostrar información de suscripción activa
          <Box>
            <Typography variant="h6" gutterBottom>
              Votre abonnement est actif
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body1">
                <strong>Plan :</strong> {userProfile?.subscriptionPlan === 'monthly' ? 'Mensuel' : 'Annuel'}
              </Typography>
              <Typography variant="body1">
                <strong>Prochain paiement :</strong> {userProfile?.nextPaymentDate?.toDate().toLocaleDateString()}
              </Typography>
              <Typography variant="body1">
                <strong>Total payé :</strong> CHF {userProfile?.totalPaid?.toFixed(2)}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Votre abonnement se renouvelle automatiquement chaque mois
              </Typography>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => setShowCancelDialog(true)}
                disabled={isProcessing}
              >
                Annuler l'Abonnement
              </Button>
            </Box>
          </Box>
        ) : (
          // Mostrar planes de suscripción
          <Box>
            <Typography variant="h6" gutterBottom>
              Choisissez votre plan d'abonnement
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Vous avez besoin d'un abonnement actif pour accéder à toutes les offres
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <Card 
                  key={plan.id}
                  sx={{ 
                    flex: 1,
                    border: selectedPlan === plan.id ? '2px solid #ff6b35' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
                      CHF {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.type === 'monthly' ? 'par mois' : 'par an'}
                    </Typography>
                    
                    <List dense>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Star sx={{ color: '#ff6b35', fontSize: 16 }} />
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
          {isSubscriptionActive ? 'Fermer' : 'Annuler'}
        </Button>
        {!isSubscriptionActive && (
          <Button 
            onClick={handleSubscribe}
            variant="contained"
            disabled={isProcessing}
            sx={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #e55a2b 0%, #e8821a 100%)',
              }
            }}
          >
            {isProcessing ? 'Traitement...' : 'S\'abonner'}
          </Button>
        )}
      </DialogActions>

      {/* Dialogue de confirmation pour annuler l'abonnement */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Annuler l'Abonnement</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir annuler votre abonnement ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Votre accès à FLASH se terminera immédiatement et vous ne pourrez plus utiliser les offres jusqu'à ce que vous vous abonniez à nouveau.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)} color="inherit">
            Non, garder l'abonnement
          </Button>
          <Button 
            onClick={handleCancelSubscription}
            color="error"
            variant="contained"
            disabled={isProcessing}
          >
            {isProcessing ? 'Annulation...' : 'Oui, annuler'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

// Componente de pantalla del dinero profesional
function MoneyScreen({ 
  userProfile, 
  currentUser, 
  setShowSubscriptionModal 
}: { 
  userProfile: UserProfile | null,
  currentUser: User | null,
  setShowSubscriptionModal: (show: boolean) => void
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6M');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [savingsGoal] = useState(1000);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'info' | 'warning' | 'error'}>>([]);

  // Generar datos mock más realistas para demostración
  const generateMockData = () => {
    const mockPayments: Payment[] = [];
    const now = new Date();
    
    // Generar pagos de los últimos 6 meses
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const isSubscription = i % 7 === 0;
      
      mockPayments.push({
        id: `pay_${i}`,
        userId: currentUser?.uid || '',
        amount: isSubscription ? 9.99 : Math.random() * 50 + 5,
        currency: 'CHF',
        type: isSubscription ? 'subscription' : 'offer_usage',
        status: Math.random() > 0.1 ? 'completed' : 'pending',
        date: Timestamp.fromDate(date),
        createdAt: Timestamp.fromDate(date),
        subscriptionPlan: isSubscription ? 'monthly' : undefined,
        offerId: isSubscription ? undefined : `offer_${i}`
      });
    }
    
    return mockPayments.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
  };

  // Cargar historial de pagos
  useEffect(() => {
    const loadPayments = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const mockPayments = generateMockData();
        setPayments(mockPayments);
      } catch (error) {
        console.error('Error cargando pagos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [currentUser]);

  // Calcular métricas
  const totalSaved = userProfile?.totalSaved || 0;
  const subscriptionActive = checkSubscriptionStatus(userProfile);
  const monthlySpent = payments
    .filter(p => p.date.toDate() >= startOfMonth(new Date()))
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  const monthlySaved = totalSaved * 0.1; // Simular ahorro mensual
  const savingsProgress = (totalSaved / savingsGoal) * 100;

  // Filtrar y ordenar pagos
  const filteredPayments = payments
    .filter(payment => {
      if (filterType !== 'all' && payment.type !== filterType) return false;
      if (searchTerm && !payment.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = sortBy === 'date' ? a.date.toDate().getTime() : a.amount;
      const bValue = sortBy === 'date' ? b.date.toDate().getTime() : b.amount;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  // Datos para gráficos
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthPayments = payments.filter(p => {
      const paymentDate = p.date.toDate();
      return paymentDate >= startOfMonth(date) && paymentDate <= endOfMonth(date);
    });
    
    return {
      month: format(date, 'MMM'),
      gastos: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      ahorros: Math.random() * 200 + 50,
      ofertas: monthPayments.filter(p => p.type === 'offer_usage').length
    };
  });

  const categoryData = [
    { name: 'Suscripciones', value: payments.filter(p => p.type === 'subscription').reduce((sum, p) => sum + p.amount, 0), color: '#9c27b0' },
    { name: 'Ofertas', value: payments.filter(p => p.type === 'offer_usage').reduce((sum, p) => sum + p.amount, 0), color: '#4caf50' }
  ];

  // Funciones de exportación
  const exportToPDF = async () => {
    const element = document.getElementById('money-dashboard');
    if (!element) return;
    
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    pdf.save('resumen-financiero.pdf');
  };

  const exportToCSV = () => {
    const csvData = filteredPayments.map(payment => ({
      Fecha: payment.date.toDate().toLocaleDateString(),
      Tipo: payment.type === 'subscription' ? 'Suscripción' : 'Oferta',
      Monto: payment.amount,
      Moneda: payment.currency,
      Estado: payment.status
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'transacciones.csv');
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }} id="money-dashboard">
      {/* Header con resumen financiero mejorado */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccountBalanceWallet sx={{ fontSize: 32, mr: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Tableau de Bord Financier
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={exportToPDF} sx={{ color: 'white' }}>
                <GetApp />
              </IconButton>
              <IconButton onClick={exportToCSV} sx={{ color: 'white' }}>
                <Download />
              </IconButton>
              <IconButton onClick={() => setShowFilters(!showFilters)} sx={{ color: 'white' }}>
                <FilterList />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                CHF {totalSaved.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Économisé
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={savingsProgress} 
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }}
              />
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {savingsProgress.toFixed(1)}% de votre objectif (CHF {savingsGoal})
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                CHF {monthlySpent.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Dépensé ce mois
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                {monthlySpent > monthlySaved ? (
                  <TrendingDown sx={{ color: '#ff5722', mr: 0.5 }} />
                ) : (
                  <TrendingUp sx={{ color: '#4caf50', mr: 0.5 }} />
                )}
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {monthlySpent > monthlySaved ? 'En hausse' : 'En baisse'}
                  </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {payments.filter(p => p.type === 'offer_usage').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Offres utilisées
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <MonetizationOn sx={{ color: '#ff9800', mr: 0.5 }} />
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  +{Math.floor(Math.random() * 5)} cette semaine
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 200, textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {subscriptionActive ? 'Active' : 'Inactive'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Abonnement
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                {subscriptionActive ? (
                  <CheckCircle sx={{ color: '#4caf50', mr: 0.5 }} />
                ) : (
                  <Warning sx={{ color: '#ff9800', mr: 0.5 }} />
                )}
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {subscriptionActive ? 'Tout va bien' : 'Renouveler'}
                  </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filtros avanzados */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtres et Recherche
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth>
                  <InputLabel>Période</InputLabel>
                  <Select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    <MenuItem value="1M">Dernier mois</MenuItem>
                    <MenuItem value="3M">3 derniers mois</MenuItem>
                    <MenuItem value="6M">6 derniers mois</MenuItem>
                    <MenuItem value="1Y">Dernière année</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="subscription">Abonnements</MenuItem>
                    <MenuItem value="offer_usage">Offres</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Rechercher"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Trier par</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="amount">Montant</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                    <Sort />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Gráficos y análisis */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Gráfico de tendencias */}
        <Box sx={{ flex: 2, minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShowChart sx={{ mr: 1, color: '#2196f3' }} />
                Tendances des Dépenses et Économies
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`CHF ${value}`, name === 'gastos' ? 'Dépenses' : 'Économies']} />
                  <Legend />
                  <Area type="monotone" dataKey="gastos" stackId="1" stroke="#ff5722" fill="#ff5722" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="ahorros" stackId="2" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Gráfico de categorías */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PieChart sx={{ mr: 1, color: '#9c27b0' }} />
                Distribution des Dépenses
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `CHF ${value}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Gestión de suscripción mejorada */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CreditCard sx={{ mr: 1, color: '#9c27b0' }} />
            Gestion de l'Abonnement
          </Typography>
          
          {subscriptionActive ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>Abonnement Actif</AlertTitle>
                Plan: {userProfile?.subscriptionPlan === 'monthly' ? 'Mensuel' : 'Annuel'} • 
                Valide jusqu'au: {userProfile?.subscriptionEnd?.toDate().toLocaleDateString()}
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setShowSubscriptionModal(true)}
                  startIcon={<Settings />}
                >
                  Gérer l'Abonnement
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<Receipt />}
                >
                  Voir les Factures
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Pas d'Abonnement Actif</AlertTitle>
                Activez votre abonnement pour accéder à toutes les offres et fonctionnalités premium.
              </Alert>
              
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowSubscriptionModal(true)}
                startIcon={<Add />}
                size="large"
              >
                Activer l'Abonnement
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Historial de transacciones mejorado */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Receipt sx={{ mr: 1, color: '#607d8b' }} />
              Historique des Transactions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={exportToCSV}
                startIcon={<Download />}
              >
                Exporter CSV
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredPayments.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Receipt sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Aucune transaction ne correspond aux filtres
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Montant</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>État</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((payment) => (
                        <TableRow key={payment.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {payment.type === 'subscription' ? (
                                <CreditCard sx={{ color: '#9c27b0', mr: 1 }} />
                              ) : (
                                <AttachMoney sx={{ color: '#4caf50', mr: 1 }} />
                              )}
                              <Typography variant="body2">
                                {payment.type === 'subscription' ? 'Abonnement' : 'Offre'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {payment.type === 'subscription' 
                                ? `Plan ${payment.subscriptionPlan}` 
                                : `Offre ${payment.offerId}`
                              }
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" sx={{ 
                              color: payment.type === 'subscription' ? '#9c27b0' : '#4caf50',
                              fontWeight: 'bold'
                            }}>
                              CHF {payment.amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {payment.date.toDate().toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {payment.date.toDate().toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status === 'completed' ? 'Terminé' : 'En attente'}
                              color={payment.status === 'completed' ? 'success' : 'warning'}
                              size="small"
                              icon={payment.status === 'completed' ? <CheckCircle /> : <Pending />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small">
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPayments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Snackbar
        open={notifications.length > 0}
        autoHideDuration={6000}
        onClose={() => setNotifications([])}
      >
        <Alert onClose={() => setNotifications([])} severity={notifications[0]?.type || 'info'}>
          {notifications[0]?.message}
        </Alert>
      </Snackbar>
    </Box>
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
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
        color: 'white',
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
            <Typography variant="h6" sx={{ color: '#ff6b35', mb: 1 }}>💎</Typography>
            <Typography variant="subtitle2" gutterBottom>Ofertas Exclusivas</Typography>
            <Typography variant="body2" color="text.secondary">
              Acceso a ofertas únicas no disponibles para usuarios gratuitos
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', mb: 1 }}>⚡</Typography>
            <Typography variant="subtitle2" gutterBottom>Sin Límites</Typography>
            <Typography variant="body2" color="text.secondary">
              Usa todas las ofertas que quieras sin restricciones
            </Typography>
          </Box>
          
          <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', mb: 1 }}>🎯</Typography>
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
          border: '2px solid #ff9800',
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
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
            px: 6,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #e55a2b 0%, #e8821a 100%)',
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
          <Star sx={{ color: '#ffd700', mr: 0.5 }} />
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
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
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
            sx={{ borderColor: '#4caf50', color: '#4caf50' }}
          >
            📤 Partager
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  const [offers] = useState<Offer[]>(initialOffers);
  const [selectedTab, setSelectedTab] = useState(1);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>(initialFlashDeals);
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
  
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'info' | 'warning';
    message: string;
    timestamp: Date;
  }>>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  


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
        // Mostrar modal después de 1 segundo para usuarios sin suscripción
        const timer = setTimeout(() => {
          setShowSubscriptionOverlay(true);
        }, 1000);
        return () => clearTimeout(timer);
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
    flashPrice: 0,
    duration: 2, // horas
    maxQuantity: 20,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80'
  });

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#111',
        contrastText: '#fff',
      },
      secondary: {
        main: '#888',
        contrastText: '#fff',
      },
      background: {
        default: '#222',
        paper: '#111',
      },
      text: {
        primary: '#fff',
        secondary: '#bbb',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#111',
            color: '#fff',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            color: '#fff',
            backgroundColor: '#333',
            border: '1px solid #555',
            '&:hover': {
              backgroundColor: '#444',
              border: '1px solid #666',
            },
          },
          containedPrimary: {
            backgroundColor: '#111',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#333',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#333',
            color: '#fff',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: '#fff',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: '#bbb',
            '&.Mui-selected': {
              color: '#fff',
            },
          },
        },
      },
    },
  });

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
          subscriptionStatus: 'pending', // Estado de prueba
          subscriptionPlan: 'none',
          totalPaid: 0
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      } else {
        // Cargar perfil existente
        setUserProfile(userDoc.data() as UserProfile);
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
        totalPaid: 0
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
        totalPaid: 0
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
          subscriptionStatus: 'pending', // Estado de prueba
          subscriptionPlan: 'none',
          totalPaid: 0
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
    const newNotification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Mantener solo las últimas 5
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  // Función para remover notificación
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
      const discountPercentage = Math.round(((newFlashDeal.originalPrice - newFlashDeal.flashPrice) / newFlashDeal.originalPrice) * 100);
      
      const flashDealData: FlashDeal = {
        ...newFlashDeal,
        id: `flash_${Date.now()}`,
        discount: `${discountPercentage}% OFF`,
        price: `CHF ${newFlashDeal.flashPrice}`,
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
        flashPrice: 0,
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

  const handleOfferClick = async (offer: Offer | FlashDeal) => {
    // Verificar si el usuario tiene suscripción activa
    if (!checkSubscriptionStatus(userProfile)) {
      setShowSubscriptionOverlay(true);
      return;
    }

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
      
      // Actualizar el perfil local
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          totalPaid: userProfile.totalPaid + usagePrice
        });
      }
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
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
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
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
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
            Cancel
          </Button>
          <Button 
            onClick={handleResetPassword}
            variant="contained"
            disabled={!resetPasswordEmail || isLoading}
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
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
            Annuler
          </Button>
          <Button 
            onClick={handleEditProfile}
            variant="contained"
            sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sistema de Notificaciones */}
      <Box sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 350
      }}>
        {notifications.map((notification) => (
          <Box
            key={notification.id}
            sx={{
              p: 2,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              bgcolor: notification.type === 'success' ? '#4caf50' : 
                       notification.type === 'warning' ? '#ff9800' : '#2196f3',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'slideIn 0.3s ease-out',
              '@keyframes slideIn': {
                from: {
                  transform: 'translateX(100%)',
                  opacity: 0
                },
                to: {
                  transform: 'translateX(0)',
                  opacity: 1
                }
              }
            }}
          >
            <Typography variant="body2" sx={{ flex: 1 }}>
              {notification.message}
            </Typography>
            <IconButton
              size="small"
              onClick={() => removeNotification(notification.id)}
              sx={{ color: 'white', ml: 1 }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Contenido principal solo si está autenticado */}
        {isAuthenticated && (
        <>
          {/* Banner de suscripción */}
          {!checkSubscriptionStatus(userProfile) && userProfile && (
            <Box sx={{ 
              bgcolor: userProfile.subscriptionStatus === 'pending' ? '#4caf50' : '#ff9800', 
              color: 'white', 
              textAlign: 'center', 
              py: 1,
              px: 2
            }}>
              {userProfile.subscriptionStatus === 'pending' ? (
                <Typography variant="body2">
                  🎉 Période d'essai active - {Math.ceil((userProfile.subscriptionEnd.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours restants
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => setShowSubscriptionModal(true)}
                    sx={{ ml: 1, textDecoration: 'underline' }}
                  >
                    S'abonner maintenant
                  </Button>
                </Typography>
              ) : (
                <Typography variant="body2">
                  ⚠️ Votre abonnement a expiré. Abonnez-vous pour accéder à toutes les offres.
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => setShowSubscriptionModal(true)}
                    sx={{ ml: 1, textDecoration: 'underline' }}
                  >
                    Activer maintenant
                  </Button>
                </Typography>
              )}
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
                <LocationOn sx={{ mr: 0.5, fontSize: { xs: 18, sm: 24 } }} />
                <Typography variant="h6" sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1.25rem' },
                  whiteSpace: 'nowrap'
                }}>FLASH</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  color="inherit" 
                  onClick={() => setShowSubscriptionModal(true)}
                  size="small"
                  sx={{ 
                    minWidth: 40,
                    minHeight: 40,
                    bgcolor: checkSubscriptionStatus(userProfile) ? 'rgba(76,175,80,0.2)' : 'rgba(255,193,7,0.2)'
                  }}
                  title={checkSubscriptionStatus(userProfile) ? 'Abonnement Actif' : 'Activer l\'Abonnement'}
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
            
            {/* Fila de filtros separada - Solo en móvil */}
            <Box sx={{ 
              display: { xs: 'flex', sm: 'none' },
              bgcolor: 'rgba(0,0,0,0.1)',
              px: 2,
              py: 1,
              gap: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="body2" sx={{ color: 'white', mr: 1, fontSize: '0.8rem' }}>
                Filtros:
              </Typography>
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
                🍽️
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
                🍷
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
                🏪
              </IconButton>
            </Box>
          </AppBar>

          {/* Main Content */}
          <Box sx={{ 
            mt: { xs: 0, sm: 2 }, 
            px: { xs: 1, sm: 3 },
            width: '100%',
            maxWidth: { xs: '100vw', sm: 'lg' },
            mx: { xs: 0, sm: 'auto' }
          }}>
            {/* Category Filters */}
            {selectedCategory !== 'all' && currentCategory && (
              <Box sx={{ mb: { xs: 2, sm: 2 } }}>
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

            {/* Tabs */}
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              mb: { xs: 1, sm: 2 },
              width: '100%'
            }}>
              <Tabs 
                value={selectedTab} 
                onChange={(_, newValue) => setSelectedTab(newValue)}
                variant="fullWidth"
                sx={{
                  minHeight: { xs: 48, sm: 48 },
                  width: '100%',
                  '& .MuiTabs-flexContainer': {
                    height: { xs: 48, sm: 48 },
                    width: '100%'
                  },
                  '& .MuiTab-root': {
                    minHeight: { xs: 48, sm: 48 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1 },
                    px: { xs: 1, sm: 2 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: 20, sm: 24 },
                      color: '#FF8F00',
                      display: 'block',
                      visibility: 'visible',
                      marginBottom: '4px'
                    }
                  }
                }}
              >
                <Tab 
                  icon={<Map />} 
                  label="Carte" 
                  iconPosition="top"
                />
                <Tab 
                  icon={<ListIcon />} 
                  label="Liste" 
                  iconPosition="top"
                />
                <Tab 
                  icon={<FlashOn />} 
                  label="Flash" 
                  iconPosition="top"
                />
                <Tab 
                  icon={<Person />} 
                  label="Profil" 
                  iconPosition="top"
                />
                <Tab 
                  icon={<AccountBalanceWallet />} 
                  label="Argent" 
                  iconPosition="top"
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {selectedTab === 0 && (
              <MapView 
                offers={offers} 
                selectedCategory={selectedCategory} 
                onOfferClick={handleOfferClick} 
              />
            )}
            {selectedTab === 1 && (
              <OffersList 
                offers={offers} 
                selectedCategory={selectedCategory} 
                selectedSubCategory={selectedSubCategory}
                onOfferClick={handleOfferClick}
                currentUser={currentUser}
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                addNotification={addNotification}
              />
            )}
            {selectedTab === 2 && (
              <FlashDealsView 
                flashDeals={flashDeals} 
                onOfferClick={handleOfferClick} 
              />
            )}
            {selectedTab === 3 && (
              <Box sx={{ 
                p: { xs: 2, sm: 2 },
                height: { xs: 'calc(100vh - 120px)', sm: 'auto' },
                overflow: 'auto',
                width: '100%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
                  <Person sx={{ mr: 1, fontSize: { xs: 18, sm: 24 } }} />
                  <Typography variant="h5" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>Profil</Typography>
                </Box>
                
                {userProfile ? (
                  <>
                    <Typography variant="body1" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                      Abonnement valable jusqu'au {userProfile.subscriptionEnd.toDate().toLocaleDateString()}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 2, sm: 3 }, 
                      mb: { xs: 3, sm: 4 },
                      justifyContent: { xs: 'space-around', sm: 'flex-start' }
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{
                          width: { xs: 50, sm: 80 },
                          height: { xs: 50, sm: 80 },
                          borderRadius: '50%',
                          bgcolor: '#ff6b6b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: { xs: 1, sm: 1 }
                        }}>
                          <ShoppingBag sx={{ fontSize: { xs: 24, sm: 40 }, color: 'white' }} />
                        </Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '2.125rem' } }}>
                          {userProfile.activatedOffers.length}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                          Offres utilisées
                        </Typography>
                      </Box>
                      
                                        <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{
                      width: { xs: 50, sm: 80 },
                      height: { xs: 50, sm: 80 },
                      borderRadius: '50%',
                      bgcolor: '#ffd700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 0.5, sm: 1 }
                    }}>
                      <AttachMoney sx={{ fontSize: { xs: 24, sm: 40 }, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '2.125rem' } }}>
                      {userProfile.totalSaved.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                      Francs économisés
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{
                      width: { xs: 50, sm: 80 },
                      height: { xs: 50, sm: 80 },
                      borderRadius: '50%',
                      bgcolor: '#9c27b0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 0.5, sm: 1 }
                    }}>
                      <Star sx={{ fontSize: { xs: 24, sm: 40 }, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '2.125rem' } }}>
                      {userProfile.points}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.875rem' } }}>
                      Points (Niveau {userProfile.level})
                    </Typography>
                  </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Informations personnelles</Typography>
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
                        ✏️ Modifier
                      </Button>
                    </Box>
                    <List>
                      <ListItem>
                        <ListItemIcon><Person /></ListItemIcon>
                        <ListItemText primary="Nom" secondary={userProfile.name} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><LocationOn /></ListItemIcon>
                        <ListItemText primary="Ville" secondary={userProfile.city} />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Dernières offres activées</Typography>
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
                          bgcolor: '#4caf50', 
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
                          bgcolor: '#ff6b35', 
                          '&:hover': { bgcolor: '#e55a2b' },
                          py: { xs: 2, sm: 1.5 },
                          px: { xs: 3, sm: 2 },
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                          minHeight: { xs: 48, sm: 40 }
                        }}
                      >
                        Créer Offre Flash
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<Close sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                        onClick={() => setIsAdmin(false)}
                        sx={{ 
                          borderColor: '#f44336', 
                          color: '#f44336',
                          '&:hover': { 
                            borderColor: '#d32f2f', 
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
            {selectedTab === 4 && (
              <MoneyScreen 
                userProfile={userProfile}
                currentUser={currentUser}
                setShowSubscriptionModal={setShowSubscriptionModal}
              />
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
            Cancel
          </Button>
          <Button 
            onClick={handleAdminLogin}
            variant="contained"
            disabled={!adminLoginCredentials.email || !adminLoginCredentials.password || isLoading}
            sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
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
                  label="Address"
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
                    label="Discount/Offer"
                    value={newOffer.discount}
                    onChange={(e) => setNewOffer({...newOffer, discount: e.target.value})}
                    fullWidth
                    placeholder="Ej: -20% en pizzas"
                  />

                  <TextField
                    label="Price"
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
                Cancel
              </Button>
              <Button 
                onClick={handleAddOffer}
                variant="contained"
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
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
                    value={newFlashDeal.flashPrice}
                    onChange={(e) => setNewFlashDeal({...newFlashDeal, flashPrice: parseFloat(e.target.value) || 0})}
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
                Annuler
              </Button>
              <Button 
                onClick={handleAddFlashDeal}
                variant="contained"
                sx={{ bgcolor: '#ff6b35', '&:hover': { bgcolor: '#e55a2b' } }}
              >
                Créer Offre Flash
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
                Choisissez votre plan d'abonnement pour commencer à utiliser l'application
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
                    // Reaparecer después de 5 segundos
                    setTimeout(() => setShowSubscriptionOverlay(true), 5000);
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
        </>
      )}
    </ThemeProvider>
  );
}

export default App;
