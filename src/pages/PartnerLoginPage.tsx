import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { Store, Lock, Email } from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getAuthErrorMessage } from '../utils/authUtils';
import professionalTheme from '../theme/professionalTheme';
import { ThemeProvider } from '@mui/material/styles';

export const PartnerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si ya está logueado como partner
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.isPartner === true) {
              const partnerRef = doc(db, 'partners', user.uid);
              const partnerDoc = await getDoc(partnerRef);
              
              if (partnerDoc.exists()) {
                // Ya está logueado, redirigir al dashboard
                navigate('/partner/dashboard', { replace: true });
              }
            }
          }
        } catch (error) {
          console.error('Error verificando sesión:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar si el usuario es partner
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isPartner === true) {
          // Obtener información del partner
          const partnerRef = doc(db, 'partners', user.uid);
          const partnerDoc = await getDoc(partnerRef);

          if (partnerDoc.exists()) {
            // Redirigir al dashboard
            navigate('/partner/dashboard', { replace: true });
          } else {
            setError('Profil partenaire introuvable. Contactez l\'administrateur.');
            await auth.signOut();
          }
        } else {
          setError('Vous n\'avez pas les permissions de partenaire');
          await auth.signOut();
        }
      } else {
        setError('Utilisateur introuvable');
        await auth.signOut();
      }
    } catch (error: any) {
      console.error('Error en login de partner:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <ThemeProvider theme={professionalTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 2
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                padding: 4,
                textAlign: 'center',
                color: 'white'
              }}
            >
              <Store sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Panel Partenaire
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Gérez vos offres et votre profil
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="email"
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  autoComplete="current-password"
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />

                <Button
                  onClick={handleLogin}
                  variant="contained"
                  disabled={isLoading || !email || !password}
                  fullWidth
                  size="large"
                  sx={{
                    bgcolor: '#FFD700',
                    color: '#000',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: '#fbc02d',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(255, 215, 0, 0.5)',
                      color: 'rgba(0, 0, 0, 0.5)'
                    }
                  }}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    onClick={() => navigate('/')}
                    variant="text"
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    ← Retour à l'app
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

