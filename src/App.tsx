import { useState, useEffect, useRef } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
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
  DialogContent
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
  Close
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

// Offer data type
interface Offer {
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
  isNew: boolean;
  price?: string;
  oldPrice?: string;
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
    subCategories: ['Vegan', 'Grill', 'Salad', 'Pizza', 'Fastfood', 'Italien', 'Chinois']
  },
  {
    id: 'bars',
    name: 'Bars',
    icon: <LocalBar />,
    subCategories: ['Cocktails', 'Bières', 'Vins', 'Café', 'Thé']
  },
  {
    id: 'bakeries',
    name: 'Boulangeries',
    icon: <BakeryDining />,
    subCategories: ['Pain', 'Pâtisseries', 'Sandwiches', 'Viennoiseries']
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
    location: { lat: 46.2044, lng: 6.1432, address: 'Plainpalais, Genève' },
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
    location: { lat: 46.1984, lng: 6.1423, address: 'Rue du Rhône, Genève' },
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
    location: { lat: 46.2004, lng: 6.1452, address: 'Rue des Savoises, Genève' },
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
    location: { lat: 46.2024, lng: 6.1402, address: 'Rue du Stand, Genève' },
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
    location: { lat: 46.1964, lng: 6.1482, address: 'Rue de la Corraterie, Genève' },
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
  }
];

function MapView({ offers, selectedCategory, onOfferClick }: { 
  offers: Offer[], 
  selectedCategory: string, 
  onOfferClick: (offer: Offer) => void 
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  
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
          // Centrar el mapa en Suiza (coordenadas aproximadas del centro)
          const switzerlandCenter = { lat: 46.8182, lng: 8.2275 };
          
          const map = new window.google.maps.Map(mapRef.current, {
            center: switzerlandCenter,
            zoom: 8,
            styles: [
              {
                featureType: 'all',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#7c93a3' }]
              },
              {
                featureType: 'all',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#ffffff' }]
              },
              {
                featureType: 'administrative.country',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#4b6878' }]
              },
              {
                featureType: 'landscape.natural',
                elementType: 'geometry',
                stylers: [{ color: '#023e58' }]
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#0e1626' }]
              }
            ]
          });
          
          mapInstanceRef.current = map;
          setMapLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    loadGoogleMaps();
  }, []);

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

  return (
    <Box sx={{ height: '70vh', position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px'
        }} 
      />
    </Box>
  );
}

function OffersList({ offers, selectedCategory, selectedSubCategory, onOfferClick }: {
  offers: Offer[],
  selectedCategory: string,
  selectedSubCategory: string,
  onOfferClick: (offer: Offer) => void
}) {
  const filteredOffers = offers.filter(offer => {
    if (selectedCategory !== 'all' && offer.category !== selectedCategory) return false;
    if (selectedSubCategory !== 'all' && offer.subCategory !== selectedSubCategory) return false;
    return true;
  });

  return (
    <Box sx={{ height: '70vh', overflow: 'auto' }}>
      {filteredOffers.map((offer) => (
        <Card key={offer.id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => onOfferClick(offer)}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="200"
              image={offer.image}
              alt={offer.name}
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
          <CardContent>
            <Typography variant="h6" gutterBottom>{offer.name}</Typography>
            <Typography variant="body2" color="error" fontWeight="bold" gutterBottom>
              {offer.discount}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {offer.description}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {offer.location.address}
              </Typography>
              <Button variant="outlined" size="small" sx={{ color: '#111', borderColor: '#111' }}>
                {'>>>'} Glissez pour une offre
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function ProfileView() {
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Person sx={{ mr: 1 }} />
        <Typography variant="h5">Profil</Typography>
      </Box>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Abonnement valable jusqu'au 20.09.2024
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#ff6b6b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1
          }}>
            <ShoppingBag sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight="bold">25</Typography>
          <Typography variant="body2">Offres utilisées</Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#ffd700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1
          }}>
            <AttachMoney sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight="bold">85.5</Typography>
          <Typography variant="body2">Francs économisés</Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>Informations personnelles</Typography>
      <List>
        <ListItem>
          <ListItemIcon><Person /></ListItemIcon>
          <ListItemText primary="Nom" secondary="Utilisateur LUCA" />
        </ListItem>
        <ListItem>
          <ListItemIcon><LocationOn /></ListItemIcon>
          <ListItemText primary="Ville" secondary="Genève" />
        </ListItem>
      </List>
    </Box>
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
        
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button variant="contained" startIcon={<Phone />} fullWidth>
            Appeler
          </Button>
          <Button variant="outlined" startIcon={<Directions />} fullWidth>
            Itinéraire
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  const [offers] = useState<Offer[]>(initialOffers);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const handleOfferClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setDetailOpen(true);
  };

  const currentCategory = categories.find(cat => cat.id === selectedCategory);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <LocationOn sx={{ mr: 1 }} />
            <Typography variant="h6">Genève</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {categories.map((category) => (
              <IconButton
                key={category.id}
                color="inherit"
                onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
                sx={{
                  bgcolor: selectedCategory === category.id ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                {category.icon}
              </IconButton>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container sx={{ mt: 2 }}>
        {/* Category Filters */}
        {selectedCategory !== 'all' && currentCategory && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Sous-catégories
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="Tous"
                onClick={() => setSelectedSubCategory('all')}
                color={selectedSubCategory === 'all' ? 'primary' : 'default'}
                size="small"
              />
              {currentCategory.subCategories.map((subCat) => (
                <Chip
                  key={subCat}
                  label={subCat}
                  onClick={() => setSelectedSubCategory(subCat)}
                  color={selectedSubCategory === subCat ? 'primary' : 'default'}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
            <Tab icon={<Map />} label="Carte" />
            <Tab icon={<ListIcon />} label="Liste" />
            <Tab icon={<Person />} label="Profil" />
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
          />
        )}
        {selectedTab === 2 && <ProfileView />}
      </Container>

      {/* Offer Detail Dialog */}
      <OfferDetail 
        offer={selectedOffer} 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
      />
    </ThemeProvider>
  );
}

export default App;
