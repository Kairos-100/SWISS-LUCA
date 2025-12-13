import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getAuthErrorMessage } from '../utils/authUtils';

interface PartnerLoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (partnerId: string) => void;
}

export const PartnerLoginModal: React.FC<PartnerLoginModalProps> = ({
  open,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
              onLoginSuccess(user.uid);
              onClose();
              setEmail('');
              setPassword('');
            } else {
              setError('Profil partenaire introuvable. Contactez l\'administrateur.');
              await auth.signOut();
            }
          } else if (userData.isAdmin === true) {
            // Admins can access partner dashboard directly
            onLoginSuccess(user.uid);
            onClose();
            setEmail('');
            setPassword('');
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
          color: '#FFFFFF',
        }
      }}
    >
      <DialogTitle sx={{ color: '#FFFFFF' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
          Accès Partenaire
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: '#B0B0B0' }}>
          Gérez vos offres et votre profil
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Box sx={{ mb: 2 }}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                }
              }}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          sx={{ color: '#FFD700' }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleLogin}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          sx={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
            color: '#000000',
            '&:hover': {
              background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
            }
          }}
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

