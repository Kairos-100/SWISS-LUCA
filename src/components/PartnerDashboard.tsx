import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  LocationOn,
  Star,
  Link as LinkIcon,
  Add,
  Delete,
  Visibility,
  TrendingUp,
  ShoppingCart,
  Preview,
  Upload,
  AccessTime
} from '@mui/icons-material';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Partner, Offer, FlashDeal } from '../types';
import { useTranslation } from 'react-i18next';

interface PartnerDashboardProps {
  partnerId: string;
  onLogout: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partnerId, onLogout }) => {
  const { t } = useTranslation();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [activeTab, setActiveTab] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [showAddFlashModal, setShowAddFlashModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewType, setPreviewType] = useState<'offer' | 'flashDeal'>('offer');
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editingFlashDeal, setEditingFlashDeal] = useState<FlashDeal | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({
    totalOffers: 0,
    totalFlashDeals: 0,
    activeOffers: 0,
    activeFlashDeals: 0,
    totalViews: 0,
    totalActivations: 0
  });
  
  // Forms for offers and flash deals
  const [offerForm, setOfferForm] = useState({
    name: '',
    category: 'restaurants',
    subCategory: '',
    discount: '',
    description: '',
    address: '',
    rating: 4.5,
    price: '',
    oldPrice: '',
    image: '',
    availabilityDays: [] as string[],
    availabilityStartTime: '09:00',
    availabilityEndTime: '18:00'
  });
  
  const [flashDealForm, setFlashDealForm] = useState({
    name: '',
    category: 'restaurants',
    subCategory: '',
    description: '',
    address: '',
    rating: 4.5,
    originalPrice: 0,
    discountedPrice: 0,
    duration: 2, // hours
    maxQuantity: 20,
    image: '',
    availabilityDays: [] as string[],
    availabilityStartTime: '09:00',
    availabilityEndTime: '18:00'
  });

  // Edit form
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    address: '',
    lat: 0,
    lng: 0,
    rating: 0,
    picture: '',
    googleMapsLink: '',
    phone: '',
    website: '',
    description: '',
    categories: [] as string[]
  });

  // Week days
  const weekDays = useMemo(() => [
    { value: 'monday', label: t('monday') },
    { value: 'tuesday', label: t('tuesday') },
    { value: 'wednesday', label: t('wednesday') },
    { value: 'thursday', label: t('thursday') },
    { value: 'friday', label: t('friday') },
    { value: 'saturday', label: t('saturday') },
    { value: 'sunday', label: t('sunday') }
  ], [t]);

  // Complete system categories
  const categories = useMemo(() => [
    { id: 'restaurants', name: t('categoryRestaurants'), subCategories: ['Vegan', 'Grill', 'Salad', 'Pizza', 'Fastfood', 'Italien', 'Chinois', 'Japonais', 'Indien', 'Mexicain', 'Français'] },
    { id: 'bars', name: t('categoryBars'), subCategories: ['Cocktails', 'Beers', 'Wines', 'Coffee', 'Tea', 'Pubs', 'Clubs', 'Lounge'] },
    { id: 'bakeries', name: t('categoryBakeries'), subCategories: ['Bread', 'Pastries', 'Sandwiches', 'Croissants', 'Cakes', 'Pies'] },
    { id: 'shops', name: t('categoryShops'), subCategories: ['Clothing', 'Shoes', 'Accessories', 'Electronics', 'Home', 'Toys', 'Books', 'Music'] },
    { id: 'clothing', name: t('categoryClothing'), subCategories: ['Men', 'Women', 'Kids', 'Sportswear', 'Formal', 'Casual', 'Luxury', 'Second-hand'] },
    { id: 'grocery', name: t('categoryGrocery'), subCategories: ['Fruits', 'Vegetables', 'Meat', 'Dairy', 'Bakery', 'Drinks', 'Frozen', 'Organic'] },
    { id: 'beauty', name: t('categoryBeauty'), subCategories: ['Hairdresser', 'Barbershop', 'Aesthetics', 'Manicure', 'Makeup', 'Perfumes', 'Cosmetics', 'Spa'] },
    { id: 'health', name: t('categoryHealth'), subCategories: ['Pharmacy', 'Optician', 'Dentist', 'Doctor', 'Physiotherapy', 'Psychology', 'Nutrition', 'Yoga'] },
    { id: 'fitness', name: t('categoryFitness'), subCategories: ['Gym', 'Pool', 'Tennis', 'Football', 'Basketball', 'Yoga', 'Pilates', 'CrossFit'] },
    { id: 'entertainment', name: t('categoryEntertainment'), subCategories: ['Cinema', 'Theater', 'Museums', 'Parks', 'Bowling', 'Karaoke', 'Escape Room', 'Arcade'] },
    { id: 'services', name: t('categoryServices'), subCategories: ['Laundry', 'Dry cleaner', 'Hairdresser', 'Workshop', 'Gas station', 'Bank', 'Post office', 'Copy shop'] },
    { id: 'transport', name: t('categoryTransport'), subCategories: ['Taxi', 'Bus', 'Train', 'Car rental', 'Bicycles', 'Parking', 'Gas station', 'Workshop'] },
    { id: 'accommodation', name: t('categoryAccommodation'), subCategories: ['Hotels', 'Hostels', 'Apartments', 'Camping', 'Resorts', 'B&B', 'Hostels'] }
  ], [t]);

  useEffect(() => {
    loadPartnerData();
    loadOffers();
    loadFlashDeals();
  }, [partnerId]);

  useEffect(() => {
    if (offers.length > 0 || flashDeals.length > 0) {
      loadStats();
    }
  }, [offers, flashDeals, partnerId]);

  const loadPartnerData = async () => {
    try {
      const partnerRef = doc(db, 'partners', partnerId);
      const partnerDoc = await getDoc(partnerRef);

      if (partnerDoc.exists()) {
        const data = partnerDoc.data() as Partner;
        setPartner(data);
        setFormData({
          name: data.name || '',
          businessName: data.businessName || '',
          address: data.address || '',
          lat: data.location?.lat || 0,
          lng: data.location?.lng || 0,
          rating: data.rating || 0,
          picture: data.picture || '',
          googleMapsLink: data.googleMapsLink || '',
          phone: data.phone || '',
          website: data.website || '',
          description: data.description || '',
          categories: data.categories || []
        });
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
      showSnackbar(t('errorCargandoDatosPartner'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      const offersRef = collection(db, 'offers');
      // IMPORTANT: Only load offers from current partner
      const q = query(offersRef, where('partnerId', '==', partnerId));
      const querySnapshot = await getDocs(q);
      const offersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Offer[];
      setOffers(offersData);
    } catch (error) {
      console.error('Error loading offers:', error);
      showSnackbar(t('errorCargandoOfertas'), 'error');
    }
  };

  const loadFlashDeals = async () => {
    try {
      const flashDealsRef = collection(db, 'flashDeals');
      // IMPORTANT: Only load flash deals from current partner
      const q = query(flashDealsRef, where('partnerId', '==', partnerId));
      const querySnapshot = await getDocs(q);
      const flashDealsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date()
      })) as FlashDeal[];
      setFlashDeals(flashDealsData);
    } catch (error) {
      console.error('Error loading flash deals:', error);
      showSnackbar(t('errorCargandoFlashDeals'), 'error');
    }
  };

  // Function to load statistics
  const loadStats = async () => {
    try {
      const partnerOffers = offers.filter(o => o.partnerId === partnerId);
      const partnerFlashDeals = flashDeals.filter(fd => fd.partnerId === partnerId);
      
      const activeOffers = partnerOffers.length;
      const activeFlashDeals = partnerFlashDeals.filter(fd => {
        const now = new Date();
        const endTime = fd.endTime instanceof Date ? fd.endTime : new Date(fd.endTime);
        return fd.isActive && endTime > now;
      }).length;

      // Here you could add more statistics from Firestore
      // For example, views, activations, etc.
      setStats({
        totalOffers: partnerOffers.length,
        totalFlashDeals: partnerFlashDeals.length,
        activeOffers,
        activeFlashDeals,
        totalViews: 0, // Can be implemented with tracking
        totalActivations: 0 // Can be implemented with tracking
      });
    } catch (error) {
      console.error(t('errorCargandoEstadisticas'), error);
    }
  };

  // Function to upload image to Firebase Storage
  const uploadImage = async (file: File, folder: 'partners' | 'offers' | 'flashDeals'): Promise<string> => {
    try {
      setUploadingImage(true);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${folder}/${partnerId}/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Function to create new offer (ONLY from current partner)
  const handleCreateOffer = async () => {
    if (!offerForm.name || !offerForm.address) {
      showSnackbar(t('pleaseCompleteNameAddress'), 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Geocode address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(offerForm.address)}&key=AIzaSyBbnCxckdR0XrhYorXJHXPlIx-58MPcva0`
      );
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        showSnackbar(t('noSePudoEncontrarUbicacion'), 'error');
        return;
      }

      const location = data.results[0].geometry.location;
      
      const offerData = {
        name: offerForm.name,
        category: offerForm.category,
        subCategory: offerForm.subCategory,
        discount: offerForm.discount,
        description: offerForm.description,
        address: offerForm.address,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: offerForm.address
        },
        rating: offerForm.rating,
        price: offerForm.price,
        oldPrice: offerForm.oldPrice,
        image: offerForm.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80',
        isNew: true,
        // IMPORTANT: Assign to current partner
        partnerId: partnerId,
        createdBy: 'partner' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Availability schedules
        availabilitySchedule: offerForm.availabilityDays.length > 0 ? {
          days: offerForm.availabilityDays,
          startTime: offerForm.availabilityStartTime,
          endTime: offerForm.availabilityEndTime
        } : undefined
      };

      const offersRef = collection(db, 'offers');
      await addDoc(offersRef, offerData);
      
      showSnackbar(t('offerCreatedSuccessfully'), 'success');
      setShowAddOfferModal(false);
      setOfferForm({
        name: '',
        category: 'restaurants',
        subCategory: '',
        discount: '',
        description: '',
        address: '',
        rating: 4.5,
        price: '',
        oldPrice: '',
        image: '',
        availabilityDays: [],
        availabilityStartTime: '09:00',
        availabilityEndTime: '18:00'
      });
      await loadOffers();
      await loadStats();
    } catch (error) {
      console.error('Error creando oferta:', error);
      showSnackbar(t('errorCreatingOffer'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to edit offer (ONLY if it belongs to current partner)
  const handleEditOffer = (offer: Offer) => {
    // Validate that the offer belongs to current partner
    if (offer.partnerId !== partnerId) {
      showSnackbar(t('noPermisosEditarOferta'), 'error');
      return;
    }
    
    setEditingOffer(offer);
    setOfferForm({
      name: offer.name,
      category: offer.category,
      subCategory: offer.subCategory,
      discount: offer.discount,
      description: offer.description,
      address: offer.location.address,
      rating: offer.rating,
      price: offer.price || '',
      oldPrice: offer.oldPrice || '',
      image: offer.image,
      availabilityDays: offer.availabilitySchedule?.days || [],
      availabilityStartTime: offer.availabilitySchedule?.startTime || '09:00',
      availabilityEndTime: offer.availabilitySchedule?.endTime || '18:00'
    });
    setShowAddOfferModal(true);
  };

  // Function to update offer (ONLY if it belongs to current partner)
  const handleUpdateOffer = async () => {
    if (!editingOffer) return;
    
    // Validate that the offer belongs to current partner
    if (editingOffer.partnerId !== partnerId) {
      showSnackbar(t('noPermisosEditarOferta'), 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      const offerRef = doc(db, 'offers', editingOffer.id);
      await updateDoc(offerRef, {
        name: offerForm.name,
        category: offerForm.category,
        subCategory: offerForm.subCategory,
        discount: offerForm.discount,
        description: offerForm.description,
        rating: offerForm.rating,
        price: offerForm.price,
        oldPrice: offerForm.oldPrice,
        image: offerForm.image,
        availabilitySchedule: offerForm.availabilityDays.length > 0 ? {
          days: offerForm.availabilityDays,
          startTime: offerForm.availabilityStartTime,
          endTime: offerForm.availabilityEndTime
        } : null,
        updatedAt: Timestamp.now()
      });
      
      showSnackbar(t('offerUpdatedSuccessfully'), 'success');
      setShowAddOfferModal(false);
      setEditingOffer(null);
      setOfferForm({
        name: '',
        category: 'restaurants',
        subCategory: '',
        discount: '',
        description: '',
        address: '',
        rating: 4.5,
        price: '',
        oldPrice: '',
        image: '',
        availabilityDays: [],
        availabilityStartTime: '09:00',
        availabilityEndTime: '18:00'
      });
      await loadOffers();
      await loadStats();
    } catch (error) {
      console.error('Error actualizando oferta:', error);
      showSnackbar(t('errorUpdatingOffer'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete offer (ONLY if it belongs to current partner)
  const handleDeleteOffer = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    // Validar que la oferta pertenece al partner actual
    if (offer.partnerId !== partnerId) {
      showSnackbar(t('noPermisosEliminarOferta'), 'error');
      return;
    }

    if (!window.confirm(t('confirmDeleteOffer'))) {
      return;
    }

    try {
      setIsLoading(true);
      const offerRef = doc(db, 'offers', offerId);
      await deleteDoc(offerRef);
      showSnackbar(t('offerDeletedSuccessfully'), 'success');
      await loadOffers();
      await loadStats();
    } catch (error) {
      console.error('Error eliminando oferta:', error);
      showSnackbar(t('errorDeletingOffer'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Functions for Flash Deals (ONLY from current partner)
  const handleCreateFlashDeal = async () => {
    if (!flashDealForm.name || !flashDealForm.address) {
      showSnackbar(t('pleaseCompleteNameAddress'), 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Geocode address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(flashDealForm.address)}&key=AIzaSyBbnCxckdR0XrhYorXJHXPlIx-58MPcva0`
      );
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        showSnackbar(t('noSePudoEncontrarUbicacion'), 'error');
        return;
      }

      const location = data.results[0].geometry.location;
      const now = new Date();
      const endTime = new Date(now.getTime() + flashDealForm.duration * 60 * 60 * 1000);
      const discountPercentage = Math.round(((flashDealForm.originalPrice - flashDealForm.discountedPrice) / flashDealForm.originalPrice) * 100);
      
      const flashDealData = {
        name: flashDealForm.name,
        category: flashDealForm.category,
        subCategory: flashDealForm.subCategory,
        discount: `${discountPercentage}% OFF`,
        description: flashDealForm.description,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: flashDealForm.address
        },
        rating: flashDealForm.rating,
        price: `CHF ${flashDealForm.discountedPrice}`,
        oldPrice: `CHF ${flashDealForm.originalPrice}`,
        originalPrice: flashDealForm.originalPrice,
        discountedPrice: flashDealForm.discountedPrice,
        startTime: Timestamp.fromDate(now),
        endTime: Timestamp.fromDate(endTime),
        isActive: true,
        maxQuantity: flashDealForm.maxQuantity,
        soldQuantity: 0,
        image: flashDealForm.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=400&q=80',
        // IMPORTANT: Assign to current partner
        partnerId: partnerId,
        createdBy: 'partner' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Availability schedules
        availabilitySchedule: flashDealForm.availabilityDays.length > 0 ? {
          days: flashDealForm.availabilityDays,
          startTime: flashDealForm.availabilityStartTime,
          endTime: flashDealForm.availabilityEndTime
        } : undefined
      };

      const flashDealsRef = collection(db, 'flashDeals');
      await addDoc(flashDealsRef, flashDealData);
      
      showSnackbar(t('flashDealCreatedSuccessfully'), 'success');
      setShowAddFlashModal(false);
      setFlashDealForm({
        name: '',
        category: 'restaurants',
        subCategory: '',
        description: '',
        address: '',
        rating: 4.5,
        originalPrice: 0,
        discountedPrice: 0,
        duration: 2,
        maxQuantity: 20,
        image: '',
        availabilityDays: [],
        availabilityStartTime: '09:00',
        availabilityEndTime: '18:00'
      });
      await loadFlashDeals();
      await loadStats();
    } catch (error) {
      console.error('Error creando flash deal:', error);
      showSnackbar(t('errorCreatingFlashDeal'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFlashDeal = (deal: FlashDeal) => {
    // Validate that the flash deal belongs to current partner
    if (deal.partnerId !== partnerId) {
      showSnackbar(t('noPermisosEditarFlashDeal'), 'error');
      return;
    }
    
    setEditingFlashDeal(deal);
    setFlashDealForm({
      name: deal.name,
      category: deal.category,
      subCategory: deal.subCategory,
      description: deal.description,
      address: deal.location.address,
      rating: deal.rating,
      originalPrice: deal.originalPrice,
      discountedPrice: deal.discountedPrice,
      duration: Math.round((deal.endTime.getTime() - deal.startTime.getTime()) / (1000 * 60 * 60)),
      maxQuantity: deal.maxQuantity || 20,
      image: deal.image,
      availabilityDays: deal.availabilitySchedule?.days || [],
      availabilityStartTime: deal.availabilitySchedule?.startTime || '09:00',
      availabilityEndTime: deal.availabilitySchedule?.endTime || '18:00'
    });
    setShowAddFlashModal(true);
  };

  const handleUpdateFlashDeal = async () => {
    if (!editingFlashDeal) return;
    
    // Validate that the flash deal belongs to current partner
    if (editingFlashDeal.partnerId !== partnerId) {
      showSnackbar(t('noPermisosEditarFlashDeal'), 'error');
      return;
    }

    try {
      setIsLoading(true);
      const discountPercentage = Math.round(((flashDealForm.originalPrice - flashDealForm.discountedPrice) / flashDealForm.originalPrice) * 100);
      
      const flashDealRef = doc(db, 'flashDeals', editingFlashDeal.id);
      await updateDoc(flashDealRef, {
        name: flashDealForm.name,
        category: flashDealForm.category,
        subCategory: flashDealForm.subCategory,
        discount: `${discountPercentage}% OFF`,
        description: flashDealForm.description,
        rating: flashDealForm.rating,
        price: `CHF ${flashDealForm.discountedPrice}`,
        oldPrice: `CHF ${flashDealForm.originalPrice}`,
        originalPrice: flashDealForm.originalPrice,
        discountedPrice: flashDealForm.discountedPrice,
        maxQuantity: flashDealForm.maxQuantity,
        image: flashDealForm.image,
        availabilitySchedule: flashDealForm.availabilityDays.length > 0 ? {
          days: flashDealForm.availabilityDays,
          startTime: flashDealForm.availabilityStartTime,
          endTime: flashDealForm.availabilityEndTime
        } : null,
        updatedAt: Timestamp.now()
      });
      
      showSnackbar(t('flashDealUpdatedSuccessfully'), 'success');
      setShowAddFlashModal(false);
      setEditingFlashDeal(null);
      setFlashDealForm({
        name: '',
        category: 'restaurants',
        subCategory: '',
        description: '',
        address: '',
        rating: 4.5,
        originalPrice: 0,
        discountedPrice: 0,
        duration: 2,
        maxQuantity: 20,
        image: '',
        availabilityDays: [],
        availabilityStartTime: '09:00',
        availabilityEndTime: '18:00'
      });
      await loadFlashDeals();
      await loadStats();
    } catch (error) {
      console.error('Error actualizando flash deal:', error);
      showSnackbar(t('errorUpdatingFlashDeal'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlashDeal = async (flashDealId: string) => {
    const deal = flashDeals.find(d => d.id === flashDealId);
    if (!deal) return;
    
    // Validate that the flash deal belongs to current partner
    if (deal.partnerId !== partnerId) {
      showSnackbar(t('noPermisosEliminarFlashDeal'), 'error');
      return;
    }

    if (!window.confirm(t('confirmDeleteOffer'))) {
      return;
    }

    try {
      setIsLoading(true);
      const flashDealRef = doc(db, 'flashDeals', flashDealId);
      await deleteDoc(flashDealRef);
      showSnackbar(t('flashDealDeletedSuccessfully'), 'success');
      await loadFlashDeals();
      await loadStats();
    } catch (error) {
      console.error('Error eliminando flash deal:', error);
      showSnackbar(t('errorDeletingFlashDeal'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const partnerRef = doc(db, 'partners', partnerId);

      const updatedData = {
        ...formData,
        location: {
          lat: formData.lat,
          lng: formData.lng
        },
        updatedAt: Timestamp.now()
      };

      await updateDoc(partnerRef, updatedData);
      await loadPartnerData();
      setIsEditing(false);
      showSnackbar(t('perfilActualizadoCorrectamente'), 'success');
    } catch (error) {
      console.error('Error guardando perfil:', error);
      showSnackbar(t('errorGuardarPerfil'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      showSnackbar(t('pleaseCompleteNameAddress'), 'error');
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.address)}&key=AIzaSyBbnCxckdR0XrhYorXJHXPlIx-58MPcva0`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setFormData(prev => ({
          ...prev,
          lat: location.lat,
          lng: location.lng
        }));
        showSnackbar(t('ubicacionEncontrada'), 'success');
      } else {
        showSnackbar(t('noSePudoEncontrarUbicacion'), 'error');
      }
    } catch (error) {
      console.error('Error geocodificando:', error);
      showSnackbar(t('errorBuscarUbicacion'), 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isLoading && !partner) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>{t('cargando')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          {t('panelPartenaire')}
        </Typography>
        <Button variant="outlined" onClick={onLogout}>
          {t('deconnexion')}
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label={t('monProfil')} />
          <Tab label={t('mesOffres')} />
          <Tab label={t('flashDeals')} />
          <Tab label={t('statistiques')} />
        </Tabs>
      </Paper>

      {/* Tab: Mi Perfil */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">{t('informationsPartenaire')}</Typography>
              {!isEditing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                >
                  {t('editar')}
                </Button>
              ) : (
                <Box>
                  <Button
                    startIcon={<Cancel />}
                    onClick={() => {
                      setIsEditing(false);
                      loadPartnerData();
                    }}
                    sx={{ mr: 1 }}
                  >
                    {t('cancelar')}
                  </Button>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSave}
                    variant="contained"
                    disabled={isLoading}
                  >
                    {t('guardar')}
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={isEditing ? formData.picture : partner?.picture}
                    sx={{ width: 150, height: 150, mb: 2 }}
                  />
                  {isEditing && (
                    <Button
                      startIcon={<PhotoCamera />}
                      component="label"
                      variant="outlined"
                      size="small"
                    >
                      {t('cambiarFoto')}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              showSnackbar(t('subiendoImagen'), 'success');
                              const imageUrl = await uploadImage(file, 'partners');
                              setFormData(prev => ({
                                ...prev,
                                picture: imageUrl
                              }));
                              showSnackbar(t('imageUploadedSuccessfully'), 'success');
                            } catch (error) {
                              showSnackbar(t('errorUploadingImage'), 'error');
                            }
                          }
                        }}
                        disabled={uploadingImage}
                      />
                    </Button>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('nom')}
                      value={isEditing ? formData.name : partner?.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('businessName')}
                      value={isEditing ? formData.businessName : partner?.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('adresse')}
                      value={isEditing ? formData.address : partner?.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        endAdornment: isEditing && (
                          <IconButton onClick={handleGeocodeAddress} size="small">
                            <LocationOn />
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  {isEditing && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('latitud')}
                          type="number"
                          value={formData.lat}
                          onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('longitud')}
                          type="number"
                          value={formData.lng}
                          onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography>{t('rating')}:</Typography>
                      <Rating
                        value={isEditing ? formData.rating : partner?.rating || 0}
                        onChange={(e, newValue) => {
                          if (isEditing) {
                            setFormData(prev => ({ ...prev, rating: newValue || 0 }));
                          }
                        }}
                        disabled={!isEditing}
                        precision={0.5}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('enlaceGoogleMaps')}
                      value={isEditing ? formData.googleMapsLink : partner?.googleMapsLink || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, googleMapsLink: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="https://maps.google.com/..."
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('telefono')}
                      value={isEditing ? formData.phone : partner?.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('sitioWeb')}
                      value={isEditing ? formData.website : partner?.website || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('descripcion')}
                      multiline
                      rows={4}
                      value={isEditing ? formData.description : partner?.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      disabled={!isEditing}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tab: Mis Ofertas */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">{t('mesOffres')}</Typography>
            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={() => {
                setEditingOffer(null);
                setOfferForm({
                  name: '',
                  category: 'restaurants',
                  subCategory: '',
                  discount: '',
                  description: '',
                  address: '',
                  rating: 4.5,
                  price: '',
                  oldPrice: '',
                  image: '',
                  availabilityDays: [],
                  availabilityStartTime: '09:00',
                  availabilityEndTime: '18:00'
                });
                setShowAddOfferModal(true);
              }}
            >
              {t('newOffer')}
            </Button>
          </Box>
          <Grid container spacing={2}>
            {offers.map((offer) => (
              <Grid item xs={12} sm={6} md={4} key={offer.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{offer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {offer.category} - {offer.subCategory}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleEditOffer(offer)}
                        disabled={offer.partnerId !== partnerId}
                      >
                        {t('editar')}
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<Delete />}
                        onClick={() => handleDeleteOffer(offer.id)}
                        disabled={offer.partnerId !== partnerId}
                      >
                        {t('eliminar')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {offers.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {t('aucuneOffre')}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Tab: Statistics */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>{t('statistiques')}</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShoppingCart sx={{ fontSize: 40, color: '#FFD700', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.totalOffers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Ofertas
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stats.activeOffers} activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ fontSize: 40, color: '#FF6B6B', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.totalFlashDeals}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Flash Deals
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stats.activeFlashDeals} activos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Visibility sx={{ fontSize: 40, color: '#4ECDC4', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.totalViews}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vistas Totales
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    En todas tus ofertas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Star sx={{ fontSize: 40, color: '#FFA500', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats.totalActivations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Activaciones
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Ofertas utilizadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab: Flash Deals */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">{t('flashDeals')}</Typography>
            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={() => {
                setEditingFlashDeal(null);
                setFlashDealForm({
                  name: '',
                  category: 'restaurants',
                  subCategory: '',
                  description: '',
                  address: '',
                  rating: 4.5,
                  originalPrice: 0,
                  discountedPrice: 0,
                  duration: 2,
                  maxQuantity: 20,
                  image: '',
                  availabilityDays: [],
                  availabilityStartTime: '09:00',
                  availabilityEndTime: '18:00'
                });
                setShowAddFlashModal(true);
              }}
            >
              {t('nuevoFlashDeal')}
            </Button>
          </Box>
          <Grid container spacing={2}>
            {flashDeals.map((deal) => (
              <Grid item xs={12} sm={6} md={4} key={deal.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{deal.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {deal.price} - {deal.discount}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleEditFlashDeal(deal)}
                        disabled={deal.partnerId !== partnerId}
                      >
                        {t('editar')}
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<Delete />}
                        onClick={() => handleDeleteFlashDeal(deal.id)}
                        disabled={deal.partnerId !== partnerId}
                      >
                        {t('eliminar')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {flashDeals.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {t('aucunFlashDeal')}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Modal para crear/editar oferta */}
      <Dialog 
        open={showAddOfferModal} 
        onClose={() => {
          setShowAddOfferModal(false);
          setEditingOffer(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingOffer ? t('editarOferta') : t('nuevaOferta')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('nom')}
              value={offerForm.name}
              onChange={(e) => setOfferForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('adresse')}
              value={offerForm.address}
              onChange={(e) => setOfferForm(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label={t('categoria')}
                value={offerForm.category}
                onChange={(e) => {
                  const selectedCategory = categories.find(c => c.id === e.target.value);
                  setOfferForm(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subCategory: '' // Reset subcategory when changing category
                  }));
                }}
                fullWidth
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </TextField>
              <TextField
                select
                label={t('subcategoria')}
                value={offerForm.subCategory}
                onChange={(e) => setOfferForm(prev => ({ ...prev, subCategory: e.target.value }))}
                fullWidth
                SelectProps={{ native: true }}
                disabled={!offerForm.category}
                InputLabelProps={{ shrink: true }}
              >
                <option value="">{t('selectSubcategory')}</option>
                {categories.find(c => c.id === offerForm.category)?.subCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </TextField>
            </Box>
            <TextField
              label={t('discount')}
              value={offerForm.discount}
              onChange={(e) => setOfferForm(prev => ({ ...prev, discount: e.target.value }))}
              fullWidth
              placeholder={t('discountPlaceholder')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('descripcion')}
              value={offerForm.description}
              onChange={(e) => setOfferForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('precio')}
                value={offerForm.price}
                onChange={(e) => setOfferForm(prev => ({ ...prev, price: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('precioAnterior')}
                value={offerForm.oldPrice}
                onChange={(e) => setOfferForm(prev => ({ ...prev, oldPrice: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label={t('calificacion')}
              type="number"
              value={offerForm.rating}
              onChange={(e) => setOfferForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Divider sx={{ my: 2 }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime sx={{ color: 'primary.main' }} />
                <Typography variant="h6">{t('availabilitySchedule')}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('availabilityScheduleDesc')}
              </Typography>
              
              {/* Quick buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setOfferForm(prev => ({ ...prev, availabilityDays: weekDays.map(d => d.value) }))}
                >
                  {t('allDays')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setOfferForm(prev => ({ ...prev, availabilityDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }))}
                >
                  {t('weekdays')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setOfferForm(prev => ({ ...prev, availabilityDays: ['saturday', 'sunday'] }))}
                >
                  {t('weekends')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setOfferForm(prev => ({ ...prev, availabilityDays: [] }))}
                >
                  {t('clear')}
                </Button>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('selectedDays')}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {weekDays.map((day) => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={offerForm.availabilityDays.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOfferForm(prev => ({
                                ...prev,
                                availabilityDays: [...prev.availabilityDays, day.value]
                              }));
                            } else {
                              setOfferForm(prev => ({
                                ...prev,
                                availabilityDays: prev.availabilityDays.filter(d => d !== day.value)
                              }));
                            }
                          }}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </Box>
              </Box>
              
              {offerForm.availabilityDays.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label={t('startTime')}
                    type="time"
                    value={offerForm.availabilityStartTime}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, availabilityStartTime: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                  <TextField
                    label={t('endTime')}
                    type="time"
                    value={offerForm.availabilityEndTime}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, availabilityEndTime: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                </Box>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <TextField
                label={t('urlImagen')}
                value={offerForm.image}
                onChange={(e) => setOfferForm(prev => ({ ...prev, image: e.target.value }))}
                fullWidth
                placeholder={t('urlImagenPlaceholder')}
                sx={{ mb: 1 }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                component="label"
                variant="outlined"
                startIcon={<Upload />}
                fullWidth
                disabled={uploadingImage}
              >
                {uploadingImage ? t('subiendo') : t('subirImagen')}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const imageUrl = await uploadImage(file, 'offers');
                        setOfferForm(prev => ({ ...prev, image: imageUrl }));
                        showSnackbar(t('imageUploadedSuccessfully'), 'success');
                      } catch (error) {
                        showSnackbar(t('errorUploadingImage'), 'error');
                      }
                    }
                  }}
                />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddOfferModal(false);
            setEditingOffer(null);
          }}>
            {t('cancelar')}
          </Button>
          <Button
            onClick={() => {
              setPreviewType('offer');
              setShowPreviewModal(true);
            }}
            variant="outlined"
            startIcon={<Preview />}
          >
            {t('vistaPrevia')}
          </Button>
          <Button 
            onClick={editingOffer ? handleUpdateOffer : handleCreateOffer}
            variant="contained"
            disabled={isLoading}
          >
            {editingOffer ? t('actualizar') : t('crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para crear/editar flash deal */}
      <Dialog 
        open={showAddFlashModal} 
        onClose={() => {
          setShowAddFlashModal(false);
          setEditingFlashDeal(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingFlashDeal ? t('editarFlashDeal') : t('nuevoFlashDeal')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('nom')}
              value={flashDealForm.name}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('adresse')}
              value={flashDealForm.address}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label={t('categoria')}
                value={flashDealForm.category}
                onChange={(e) => {
                  setFlashDealForm(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subCategory: '' // Reset subcategory when changing category
                  }));
                }}
                fullWidth
                SelectProps={{ native: true }}
                InputLabelProps={{ shrink: true }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </TextField>
              <TextField
                select
                label={t('subcategoria')}
                value={flashDealForm.subCategory}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, subCategory: e.target.value }))}
                fullWidth
                SelectProps={{ native: true }}
                disabled={!flashDealForm.category}
                InputLabelProps={{ shrink: true }}
              >
                <option value="">{t('selectSubcategory')}</option>
                {categories.find(c => c.id === flashDealForm.category)?.subCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </TextField>
            </Box>
            <TextField
              label={t('descripcion')}
              value={flashDealForm.description}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('originalPrice')}
                type="number"
                value={flashDealForm.originalPrice}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('priceWithDiscount')}
                type="number"
                value={flashDealForm.discountedPrice}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, discountedPrice: parseFloat(e.target.value) || 0 }))}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('duration')}
                type="number"
                value={flashDealForm.duration}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, duration: parseFloat(e.target.value) || 2 }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('maxQuantity')}
                type="number"
                value={flashDealForm.maxQuantity}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, maxQuantity: parseInt(e.target.value) || 20 }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label={t('calificacion')}
              type="number"
              value={flashDealForm.rating}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Divider sx={{ my: 2 }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime sx={{ color: 'primary.main' }} />
                <Typography variant="h6">{t('availabilitySchedule')}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('availabilityScheduleDesc')}
              </Typography>
              
              {/* Quick buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFlashDealForm(prev => ({ ...prev, availabilityDays: weekDays.map(d => d.value) }))}
                >
                  {t('allDays')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFlashDealForm(prev => ({ ...prev, availabilityDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }))}
                >
                  {t('weekdays')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFlashDealForm(prev => ({ ...prev, availabilityDays: ['saturday', 'sunday'] }))}
                >
                  {t('weekends')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setFlashDealForm(prev => ({ ...prev, availabilityDays: [] }))}
                >
                  {t('clear')}
                </Button>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('selectedDays')}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {weekDays.map((day) => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={flashDealForm.availabilityDays.includes(day.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFlashDealForm(prev => ({
                                ...prev,
                                availabilityDays: [...prev.availabilityDays, day.value]
                              }));
                            } else {
                              setFlashDealForm(prev => ({
                                ...prev,
                                availabilityDays: prev.availabilityDays.filter(d => d !== day.value)
                              }));
                            }
                          }}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </Box>
              </Box>
              
              {flashDealForm.availabilityDays.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label={t('startTime')}
                    type="time"
                    value={flashDealForm.availabilityStartTime}
                    onChange={(e) => setFlashDealForm(prev => ({ ...prev, availabilityStartTime: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                  <TextField
                    label={t('endTime')}
                    type="time"
                    value={flashDealForm.availabilityEndTime}
                    onChange={(e) => setFlashDealForm(prev => ({ ...prev, availabilityEndTime: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                  />
                </Box>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <TextField
                label={t('imageUrl')}
                value={flashDealForm.image}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, image: e.target.value }))}
                fullWidth
                placeholder={t('urlImagenPlaceholder')}
                sx={{ mb: 1 }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                component="label"
                variant="outlined"
                startIcon={<Upload />}
                fullWidth
                disabled={uploadingImage}
              >
                {uploadingImage ? t('subiendo') : t('subirImagen')}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const imageUrl = await uploadImage(file, 'flashDeals');
                        setFlashDealForm(prev => ({ ...prev, image: imageUrl }));
                        showSnackbar(t('imageUploadedSuccessfully'), 'success');
                      } catch (error) {
                        showSnackbar(t('errorUploadingImage'), 'error');
                      }
                    }
                  }}
                />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddFlashModal(false);
            setEditingFlashDeal(null);
          }}>
            {t('cancelar')}
          </Button>
          <Button
            onClick={() => {
              setPreviewType('flashDeal');
              setShowPreviewModal(true);
            }}
            variant="outlined"
            startIcon={<Preview />}
          >
            {t('vistaPrevia')}
          </Button>
          <Button 
            onClick={editingFlashDeal ? handleUpdateFlashDeal : handleCreateFlashDeal}
            variant="contained"
            disabled={isLoading}
          >
            {editingFlashDeal ? t('actualizar') : t('crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Vista Previa */}
      <Dialog
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('vistaPrevia')}</DialogTitle>
        <DialogContent>
          {previewType === 'offer' ? (
            <Card>
              {offerForm.image && (
                <Box
                  component="img"
                  src={offerForm.image}
                  alt={offerForm.name}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover'
                  }}
                />
              )}
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {offerForm.name || t('nombreOferta')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={offerForm.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {offerForm.rating}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {categories.find(c => c.id === offerForm.category)?.name || offerForm.category} - {offerForm.subCategory || t('noSubcategory')}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {offerForm.discount || t('sinDescuento')}
                </Typography>
                {offerForm.price && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {offerForm.price}
                    </Typography>
                    {offerForm.oldPrice && (
                      <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                        {offerForm.oldPrice}
                      </Typography>
                    )}
                  </Box>
                )}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {offerForm.description || t('sinDescripcion')}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {offerForm.address || t('sinDireccion')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              {flashDealForm.image && (
                <Box
                  component="img"
                  src={flashDealForm.image}
                  alt={flashDealForm.name}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover'
                  }}
                />
              )}
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {flashDealForm.name || t('nombreFlashDeal')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={flashDealForm.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {flashDealForm.rating}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {categories.find(c => c.id === flashDealForm.category)?.name || flashDealForm.category} - {flashDealForm.subCategory || t('noSubcategory')}
                </Typography>
                {flashDealForm.originalPrice > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" color="primary">
                      CHF {flashDealForm.discountedPrice}
                    </Typography>
                    <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                      CHF {flashDealForm.originalPrice}
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
                      {Math.round(((flashDealForm.originalPrice - flashDealForm.discountedPrice) / flashDealForm.originalPrice) * 100)}% OFF
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {flashDealForm.description || t('sinDescripcion')}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {flashDealForm.address || t('sinDireccion')}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('duracionHoras').replace('{hours}', flashDealForm.duration.toString())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('maxQuantity')}: {flashDealForm.maxQuantity}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewModal(false)}>
            {t('cerrar')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

