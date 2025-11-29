// Types for LUCA app

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  city: string;
  activatedOffers: {
    offerId: string;
    activatedAt: any;
    savedAmount: number;
    paidAmount?: number;
    offerName?: string;
    category?: string;
    blockedUntil?: any;
  }[];
  totalSaved: number;
  points: number;
  level: number;
  achievements: string[];
  subscriptionEnd: any;
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'pending' | 'trial';
  subscriptionPlan: 'monthly' | 'yearly' | 'none';
  paymentMethod?: string;
  lastPaymentDate?: any;
  nextPaymentDate?: any;
  totalPaid: number;
  
  // Nuevos campos para datos individuales más detallados
  personalStats: {
    joinDate: any;
    lastLoginDate: any;
    totalOffersViewed: number;
    favoriteCategories: string[];
    preferredLanguage: string;
    notificationsEnabled: boolean;
  };
  
  financialHistory: {
    monthlyExpenses: { [month: string]: number };
    subscriptionHistory: {
      plan: string;
      startDate: any;
      endDate?: any;
      amount: number;
      status: string;
    }[];
    offerPayments: {
      offerId: string;
      amount: number;
      date: any;
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
    timestamp: any;
    details?: any;
  }[];
}

export interface Offer {
  id: string;
  name: string;
  image: string;
  category: string;
  subCategory: string;
  discount: string;
  usagePrice?: number;
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
  // Control de publicación
  partnerId?: string;
  adminId?: string;
  createdBy: 'partner' | 'admin';
  createdAt?: any;
  updatedAt?: any;
  // Horarios de disponibilidad
  availabilitySchedule?: {
    days: string[]; // ['monday', 'tuesday', etc.]
    startTime: string; // 'HH:mm' formato
    endTime: string; // 'HH:mm' formato
  };
}

export interface FlashDeal {
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
  discountedPrice: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  maxQuantity?: number;
  soldQuantity?: number;
  // Control de publicación
  partnerId?: string;
  adminId?: string;
  createdBy: 'partner' | 'admin';
  createdAt?: any;
  updatedAt?: any;
  // Horarios de disponibilidad
  availabilitySchedule?: {
    days: string[]; // ['monday', 'tuesday', etc.]
    startTime: string; // 'HH:mm' formato
    endTime: string; // 'HH:mm' formato
  };
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'offer_usage';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: any;
  createdAt: any;
  offerId?: string;
  subscriptionPlan?: string;
}

export interface Partner {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  businessName: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  picture: string;
  googleMapsLink?: string;
  phone?: string;
  website?: string;
  description?: string;
  categories: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}
