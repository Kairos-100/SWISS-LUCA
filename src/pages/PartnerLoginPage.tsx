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
            // Allow access if user is partner OR admin
            if (userData.isPartner === true) {
              const partnerRef = doc(db, 'partners', user.uid);
              const partnerDoc = await getDoc(partnerRef);
              
              if (partnerDoc.exists()) {
                // Ya está logueado, redirigir al dashboard
                navigate('/partner/dashboard', { replace: true });
              }
            } else if (userData.isAdmin === true) {
              // Admins can access partner dashboard directly
              navigate('/partner/dashboard', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error verifying session:', error);
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
        // Allow access if user is partner OR admin
        if (userData.isPartner === true || userData.isAdmin === true) {
          // If user is a partner, verify partner document exists
          if (userData.isPartner === true) {
            const partnerRef = doc(db, 'partners', user.uid);
            const partnerDoc = await getDoc(partnerRef);

            if (partnerDoc.exists()) {
              // Redirigir al dashboard
              navigate('/partner/dashboard', { replace: true });
            } else {
              setError('Profil partenaire introuvable. Contactez l\'administrateur.');
              await auth.signOut();
            }
          } else if (userData.isAdmin === true) {
            // Admins can access partner dashboard directly
            navigate('/partner/dashboard', { replace: true });
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
          background: '#0F0F0F',
          padding: 2
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Box
              sx={{
                background: '#FFD700',
                padding: 4,
                textAlign: 'center',
                color: '#000'
              }}
            >
              <Store sx={{ fontSize: 60, mb: 2, color: '#000' }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: '#000' }}>
                Panel Partenaire
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, color: '#000' }}>
                Gérez vos offres et votre profil
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: '#F44336',
                    borderRadius: 2,
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    '& .MuiAlert-icon': {
                      color: '#F44336'
                    },
                    '& .MuiAlert-action': {
                      color: '#F44336'
                    }
                  }} 
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#B0B0B0', fontSize: '0.875rem' }}>
                    Email
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoComplete="email"
                    disabled={isLoading}
                    placeholder="email@example.com"
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: '#B0B0B0' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& input': {
                          color: '#FFFFFF',
                          WebkitTextFillColor: '#FFFFFF',
                          caretColor: '#FFD700',
                        },
                        '& input::placeholder': {
                          color: '#B0B0B0',
                          opacity: 1,
                        },
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: '1px',
                        },
                        '&:hover fieldset': {
                          borderColor: '#FFD700',
                          borderWidth: '2px',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          '& fieldset': {
                            borderColor: '#FFD700',
                            borderWidth: '2px',
                          },
                        },
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#B0B0B0', fontSize: '0.875rem' }}>
                    Mot de passe
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoComplete="current-password"
                    disabled={isLoading}
                    placeholder="••••••••"
                    InputProps={{
                      startAdornment: <Lock sx={{ mr: 1, color: '#B0B0B0' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        '& input': {
                          color: '#FFFFFF',
                          WebkitTextFillColor: '#FFFFFF',
                          caretColor: '#FFD700',
                        },
                        '& input::placeholder': {
                          color: '#B0B0B0',
                          opacity: 1,
                        },
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: '1px',
                        },
                        '&:hover fieldset': {
                          borderColor: '#FFD700',
                          borderWidth: '2px',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          '& fieldset': {
                            borderColor: '#FFD700',
                            borderWidth: '2px',
                          },
                        },
                      },
                    }}
                  />
                </Box>

                <Button
                  onClick={handleLogin}
                  variant="contained"
                  disabled={isLoading || !email || !password}
                  fullWidth
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                    color: '#000',
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
                      boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 215, 0, 0.3)',
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
                    sx={{ color: '#B0B0B0', '&:hover': { color: '#FFFFFF' } }}
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

