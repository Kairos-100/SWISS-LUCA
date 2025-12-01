import React, { useState, useEffect } from 'react';
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
  Paper
} from '@mui/material';
import {
  Edit,
  LocationOn,
  Delete,
  TrendingUp,
  ShoppingCart,
  Preview,
  Upload,
  Store
} from '@mui/icons-material';
import { doc, updateDoc, deleteDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Partner, Offer, FlashDeal } from '../types';

interface AdminDashboardProps {
  adminId: string;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [activeTab, setActiveTab] = useState(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  
  // Modales
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewType, setPreviewType] = useState<'offer' | 'flashDeal'>('offer');
  
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editingFlashDeal, setEditingFlashDeal] = useState<FlashDeal | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Formularios
  const [partnerForm, setPartnerForm] = useState({
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
    availabilityEndTime: '18:00',
    partnerId: ''
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
    duration: 2,
    maxQuantity: 20,
    image: '',
    availabilityDays: [] as string[],
    availabilityStartTime: '09:00',
    availabilityEndTime: '18:00',
    partnerId: ''
  });


  // Catégories complètes du système
  const categories = [
    { id: 'restaurants', name: 'Restaurants', subCategories: ['Vegan', 'Grill', 'Salad', 'Pizza', 'Fastfood', 'Italien', 'Chinois', 'Japonais', 'Indien', 'Mexicain', 'Français'] },
    { id: 'bars', name: 'Bars', subCategories: ['Cocktails', 'Beers', 'Wines', 'Coffee', 'Tea', 'Pubs', 'Clubs', 'Lounge'] },
    { id: 'bakeries', name: 'Boulangeries', subCategories: ['Bread', 'Pastries', 'Sandwiches', 'Croissants', 'Cakes', 'Pies'] },
    { id: 'shops', name: 'Magasins', subCategories: ['Clothing', 'Shoes', 'Accessories', 'Electronics', 'Home', 'Toys', 'Books', 'Music'] },
    { id: 'clothing', name: 'Vêtements', subCategories: ['Men', 'Women', 'Kids', 'Sportswear', 'Formal', 'Casual', 'Luxury', 'Second-hand'] },
    { id: 'grocery', name: 'Supermarchés', subCategories: ['Fruits', 'Vegetables', 'Meat', 'Dairy', 'Bakery', 'Drinks', 'Frozen', 'Organic'] },
    { id: 'beauty', name: 'Beauté', subCategories: ['Hairdresser', 'Barbershop', 'Aesthetics', 'Manicure', 'Makeup', 'Perfumes', 'Cosmetics', 'Spa'] },
    { id: 'health', name: 'Santé', subCategories: ['Pharmacy', 'Optician', 'Dentist', 'Doctor', 'Physiotherapy', 'Psychology', 'Nutrition', 'Yoga'] },
    { id: 'fitness', name: 'Sports', subCategories: ['Gym', 'Pool', 'Tennis', 'Football', 'Basketball', 'Yoga', 'Pilates', 'CrossFit'] },
    { id: 'entertainment', name: 'Divertissement', subCategories: ['Cinema', 'Theater', 'Museums', 'Parks', 'Bowling', 'Karaoke', 'Escape Room', 'Arcade'] },
    { id: 'services', name: 'Services', subCategories: ['Laundry', 'Dry cleaner', 'Hairdresser', 'Workshop', 'Gas station', 'Bank', 'Post office', 'Copy shop'] },
    { id: 'transport', name: 'Transport', subCategories: ['Taxi', 'Bus', 'Train', 'Car rental', 'Bicycles', 'Parking', 'Gas station', 'Workshop'] },
    { id: 'accommodation', name: 'Hébergement', subCategories: ['Hotels', 'Hostels', 'Apartments', 'Camping', 'Resorts', 'B&B', 'Hostels'] }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([loadPartners(), loadAllOffers(), loadAllFlashDeals()]);
    setIsLoading(false);
  };

  const loadPartners = async () => {
    try {
      const partnersRef = collection(db, 'partners');
      const querySnapshot = await getDocs(partnersRef);
      const partnersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Partner[];
      setPartners(partnersData);
    } catch (error) {
      console.error('Error cargando partners:', error);
      showSnackbar('Erreur lors du chargement des partenaires', 'error');
    }
  };

  const loadAllOffers = async () => {
    try {
      const offersRef = collection(db, 'offers');
      const querySnapshot = await getDocs(offersRef);
      const offersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Offer[];
      setOffers(offersData);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      showSnackbar('Erreur lors du chargement des offres', 'error');
    }
  };

  const loadAllFlashDeals = async () => {
    try {
      const flashDealsRef = collection(db, 'flashDeals');
      const querySnapshot = await getDocs(flashDealsRef);
      const flashDealsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date()
      })) as FlashDeal[];
      setFlashDeals(flashDealsData);
    } catch (error) {
      console.error('Error cargando flash deals:', error);
      showSnackbar('Erreur lors du chargement des flash deals', 'error');
    }
  };

  const uploadImage = async (file: File, folder: 'partners' | 'offers' | 'flashDeals', partnerId?: string): Promise<string> => {
    try {
      setUploadingImage(true);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${folder}/${partnerId || 'admin'}/${Date.now()}.${fileExtension}`;
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

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Funciones para Partners
  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerForm({
      name: partner.name || '',
      businessName: partner.businessName || '',
      address: partner.address || '',
      lat: partner.location?.lat || 0,
      lng: partner.location?.lng || 0,
      rating: partner.rating || 0,
      picture: partner.picture || '',
      googleMapsLink: partner.googleMapsLink || '',
      phone: partner.phone || '',
      website: partner.website || '',
      description: partner.description || '',
      categories: partner.categories || []
    });
    setShowPartnerModal(true);
  };

  const handleSavePartner = async () => {
    if (!editingPartner) return;

    try {
      setIsLoading(true);
      const partnerRef = doc(db, 'partners', editingPartner.id);
      await updateDoc(partnerRef, {
        ...partnerForm,
        location: {
          lat: partnerForm.lat,
          lng: partnerForm.lng
        },
        updatedAt: Timestamp.now()
      });
      
      showSnackbar('Partenaire mis à jour avec succès', 'success');
      setShowPartnerModal(false);
      setEditingPartner(null);
      await loadPartners();
    } catch (error) {
      console.error('Error actualizando partner:', error);
      showSnackbar('Erreur lors de la mise à jour du partenaire', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para Ofertas
  const handleEditOffer = (offer: Offer) => {
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
      availabilityEndTime: offer.availabilitySchedule?.endTime || '18:00',
      partnerId: offer.partnerId || ''
    });
    setShowOfferModal(true);
  };

  const handleUpdateOffer = async () => {
    if (!editingOffer) return;

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
      
      showSnackbar('Offre mise à jour avec succès', 'success');
      setShowOfferModal(false);
      setEditingOffer(null);
      await loadAllOffers();
    } catch (error) {
      console.error('Error actualizando oferta:', error);
      showSnackbar('Erreur lors de la mise à jour de l\'offre', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      return;
    }

    try {
      setIsLoading(true);
      const offerRef = doc(db, 'offers', offerId);
      await deleteDoc(offerRef);
      showSnackbar('Offre supprimée avec succès', 'success');
      await loadAllOffers();
    } catch (error) {
      console.error('Error eliminando oferta:', error);
      showSnackbar('Erreur lors de la suppression de l\'offre', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para Flash Deals
  const handleEditFlashDeal = (deal: FlashDeal) => {
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
      availabilityEndTime: deal.availabilitySchedule?.endTime || '18:00',
      partnerId: deal.partnerId || ''
    });
    setShowFlashModal(true);
  };

  const handleUpdateFlashDeal = async () => {
    if (!editingFlashDeal) return;

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
      
      showSnackbar('Flash deal mis à jour avec succès', 'success');
      setShowFlashModal(false);
      setEditingFlashDeal(null);
      await loadAllFlashDeals();
    } catch (error) {
      console.error('Error actualizando flash deal:', error);
      showSnackbar('Erreur lors de la mise à jour du flash deal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlashDeal = async (flashDealId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce flash deal ?')) {
      return;
    }

    try {
      setIsLoading(true);
      const flashDealRef = doc(db, 'flashDeals', flashDealId);
      await deleteDoc(flashDealRef);
      showSnackbar('Flash deal supprimé avec succès', 'success');
      await loadAllFlashDeals();
    } catch (error) {
      console.error('Error eliminando flash deal:', error);
      showSnackbar('Erreur lors de la suppression du flash deal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getPartnerName = (partnerId: string | null | undefined) => {
    if (!partnerId) return 'Sans partenaire';
    const partner = partners.find(p => p.id === partnerId);
    return partner?.businessName || partner?.name || 'Partenaire inconnu';
  };

  if (isLoading && partners.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Panneau Administratif
        </Typography>
        <Button variant="outlined" onClick={onClose}>
          Fermer
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Partenaires" icon={<Store />} iconPosition="start" />
          <Tab label="Toutes les Offres" icon={<ShoppingCart />} iconPosition="start" />
          <Tab label="Tous les Flash Deals" icon={<TrendingUp />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab: Partners */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Partenaires ({partners.length})</Typography>
          <Grid container spacing={2}>
            {partners.map((partner) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={partner.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={partner.picture} sx={{ width: 60, height: 60 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{partner.businessName || partner.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {partner.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {partner.address}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditPartner(partner)}
                        variant="outlined"
                      >
                        Modifier
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {partners.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Aucun partenaire enregistré.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Tab: Todas las Ofertas */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Toutes les Offres ({offers.length})</Typography>
          <Grid container spacing={2}>
            {offers.map((offer) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={offer.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{offer.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {getPartnerName(offer.partnerId)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {offer.category} - {offer.subCategory}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditOffer(offer)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteOffer(offer.id)}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {offers.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Aucune offre.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Tab: Todos los Flash Deals */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Tous les Flash Deals ({flashDeals.length})</Typography>
          <Grid container spacing={2}>
            {flashDeals.map((deal) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={deal.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{deal.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {getPartnerName(deal.partnerId)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {deal.price} - {deal.discount}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditFlashDeal(deal)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteFlashDeal(deal.id)}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {flashDeals.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Aucun flash deal.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Modal d'édition Partner */}
      <Dialog 
        open={showPartnerModal} 
        onClose={() => {
          setShowPartnerModal(false);
          setEditingPartner(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPartner ? 'Modifier le Partenaire' : 'Nouveau Partenaire'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom"
              value={partnerForm.name}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Nom de l'entreprise"
              value={partnerForm.businessName}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, businessName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Adresse"
              value={partnerForm.address}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Latitude"
                type="number"
                value={partnerForm.lat}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                fullWidth
              />
              <TextField
                label="Longitude"
                type="number"
                value={partnerForm.lng}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                fullWidth
              />
            </Box>
            <TextField
              label="Téléphone"
              value={partnerForm.phone}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Site Web"
              value={partnerForm.website}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, website: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Lien Google Maps"
              value={partnerForm.googleMapsLink}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, googleMapsLink: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Description"
              value={partnerForm.description}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              label="Note"
              type="number"
              value={partnerForm.rating}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              fullWidth
            />
            <TextField
              label="URL de l'image"
              value={partnerForm.picture}
              onChange={(e) => setPartnerForm(prev => ({ ...prev, picture: e.target.value }))}
              fullWidth
              sx={{ mb: 1 }}
            />
            <Button
              component="label"
              variant="outlined"
              startIcon={<Upload />}
              fullWidth
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Téléchargement...' : 'Télécharger une image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && editingPartner) {
                    try {
                      const imageUrl = await uploadImage(file, 'partners', editingPartner.id);
                      setPartnerForm(prev => ({ ...prev, picture: imageUrl }));
                      showSnackbar('Image téléchargée avec succès', 'success');
                    } catch (error) {
                      showSnackbar('Erreur lors du téléchargement', 'error');
                    }
                  }
                }}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowPartnerModal(false);
            setEditingPartner(null);
          }}>
            Annuler
          </Button>
          <Button 
            onClick={handleSavePartner}
            variant="contained"
            disabled={isLoading}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal d'édition Offre */}
      <Dialog 
        open={showOfferModal} 
        onClose={() => {
          setShowOfferModal(false);
          setEditingOffer(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingOffer ? 'Modifier l\'Offre' : 'Nouvelle Offre'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Partenaire"
              value={offerForm.partnerId}
              onChange={(e) => setOfferForm(prev => ({ ...prev, partnerId: e.target.value }))}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="">Sélectionner un partenaire</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.businessName || partner.name}
                </option>
              ))}
            </TextField>
            <TextField
              label="Nom"
              value={offerForm.name}
              onChange={(e) => setOfferForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Adresse"
              value={offerForm.address}
              onChange={(e) => setOfferForm(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Catégorie"
                value={offerForm.category}
                onChange={(e) => {
                  setOfferForm(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subCategory: ''
                  }));
                }}
                fullWidth
                SelectProps={{ native: true }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </TextField>
              <TextField
                select
                label="Sous-catégorie"
                value={offerForm.subCategory}
                onChange={(e) => setOfferForm(prev => ({ ...prev, subCategory: e.target.value }))}
                fullWidth
                SelectProps={{ native: true }}
                disabled={!offerForm.category}
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {categories.find(c => c.id === offerForm.category)?.subCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Remise"
              value={offerForm.discount}
              onChange={(e) => setOfferForm(prev => ({ ...prev, discount: e.target.value }))}
              fullWidth
              placeholder="Ex: 20% OFF"
            />
            <TextField
              label="Description"
              value={offerForm.description}
              onChange={(e) => setOfferForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Prix"
                value={offerForm.price}
                onChange={(e) => setOfferForm(prev => ({ ...prev, price: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Ancien Prix"
                value={offerForm.oldPrice}
                onChange={(e) => setOfferForm(prev => ({ ...prev, oldPrice: e.target.value }))}
                fullWidth
              />
            </Box>
            <TextField
              label="Note"
              type="number"
              value={offerForm.rating}
              onChange={(e) => setOfferForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              fullWidth
            />
            <TextField
              label="URL de l'image"
              value={offerForm.image}
              onChange={(e) => setOfferForm(prev => ({ ...prev, image: e.target.value }))}
              fullWidth
              sx={{ mb: 1 }}
            />
            <Button
              component="label"
              variant="outlined"
              startIcon={<Upload />}
              fullWidth
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Téléchargement...' : 'Télécharger une image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && offerForm.partnerId) {
                    try {
                      const imageUrl = await uploadImage(file, 'offers', offerForm.partnerId);
                      setOfferForm(prev => ({ ...prev, image: imageUrl }));
                      showSnackbar('Image téléchargée avec succès', 'success');
                    } catch (error) {
                      showSnackbar('Erreur lors du téléchargement', 'error');
                    }
                  }
                }}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowOfferModal(false);
            setEditingOffer(null);
          }}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              setPreviewType('offer');
              setShowPreviewModal(true);
            }}
            variant="outlined"
            startIcon={<Preview />}
          >
            Aperçu
          </Button>
          <Button 
            onClick={handleUpdateOffer}
            variant="contained"
            disabled={isLoading}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal d'édition Flash Deal */}
      <Dialog 
        open={showFlashModal} 
        onClose={() => {
          setShowFlashModal(false);
          setEditingFlashDeal(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingFlashDeal ? 'Modifier le Flash Deal' : 'Nouveau Flash Deal'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Partenaire"
              value={flashDealForm.partnerId}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, partnerId: e.target.value }))}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="">Sélectionner un partenaire</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.businessName || partner.name}
                </option>
              ))}
            </TextField>
            <TextField
              label="Nom"
              value={flashDealForm.name}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Adresse"
              value={flashDealForm.address}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Catégorie"
                value={flashDealForm.category}
                onChange={(e) => {
                  setFlashDealForm(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subCategory: ''
                  }));
                }}
                fullWidth
                SelectProps={{ native: true }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </TextField>
              <TextField
                select
                label="Sous-catégorie"
                value={flashDealForm.subCategory}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, subCategory: e.target.value }))}
                fullWidth
                SelectProps={{ native: true }}
                disabled={!flashDealForm.category}
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {categories.find(c => c.id === flashDealForm.category)?.subCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Description"
              value={flashDealForm.description}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Prix Original"
                type="number"
                value={flashDealForm.originalPrice}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                fullWidth
                required
              />
              <TextField
                label="Prix avec Remise"
                type="number"
                value={flashDealForm.discountedPrice}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, discountedPrice: parseFloat(e.target.value) || 0 }))}
                fullWidth
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Durée (heures)"
                type="number"
                value={flashDealForm.duration}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, duration: parseFloat(e.target.value) || 2 }))}
                fullWidth
              />
              <TextField
                label="Quantité Maximale"
                type="number"
                value={flashDealForm.maxQuantity}
                onChange={(e) => setFlashDealForm(prev => ({ ...prev, maxQuantity: parseInt(e.target.value) || 20 }))}
                fullWidth
              />
            </Box>
            <TextField
              label="Note"
              type="number"
              value={flashDealForm.rating}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              fullWidth
            />
            <TextField
              label="URL de l'image"
              value={flashDealForm.image}
              onChange={(e) => setFlashDealForm(prev => ({ ...prev, image: e.target.value }))}
              fullWidth
              sx={{ mb: 1 }}
            />
            <Button
              component="label"
              variant="outlined"
              startIcon={<Upload />}
              fullWidth
              disabled={uploadingImage}
            >
              {uploadingImage ? 'Téléchargement...' : 'Télécharger une image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && flashDealForm.partnerId) {
                    try {
                      const imageUrl = await uploadImage(file, 'flashDeals', flashDealForm.partnerId);
                      setFlashDealForm(prev => ({ ...prev, image: imageUrl }));
                      showSnackbar('Image téléchargée avec succès', 'success');
                    } catch (error) {
                      showSnackbar('Erreur lors du téléchargement', 'error');
                    }
                  }
                }}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowFlashModal(false);
            setEditingFlashDeal(null);
          }}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              setPreviewType('flashDeal');
              setShowPreviewModal(true);
            }}
            variant="outlined"
            startIcon={<Preview />}
          >
            Aperçu
          </Button>
          <Button 
            onClick={handleUpdateFlashDeal}
            variant="contained"
            disabled={isLoading}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal d'aperçu */}
      <Dialog
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Aperçu</DialogTitle>
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
                  {offerForm.name || 'Nom de l\'offre'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={offerForm.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {offerForm.rating}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {categories.find(c => c.id === offerForm.category)?.name || offerForm.category} - {offerForm.subCategory || 'Sans sous-catégorie'}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {offerForm.discount || 'Sans remise'}
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
                  {offerForm.description || 'Sans description'}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {offerForm.address || 'Sans adresse'}
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
                  {flashDealForm.name || 'Nom du flash deal'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={flashDealForm.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {flashDealForm.rating}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {categories.find(c => c.id === flashDealForm.category)?.name || flashDealForm.category} - {flashDealForm.subCategory || 'Sans sous-catégorie'}
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
                  {flashDealForm.description || 'Sans description'}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {flashDealForm.address || 'Sans adresse'}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Durée: {flashDealForm.duration} heures
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantité max: {flashDealForm.maxQuantity}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewModal(false)}>
            Fermer
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
