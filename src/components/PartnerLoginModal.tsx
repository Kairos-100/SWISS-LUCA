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
        if (userData.isPartner === true) {
          // Obtener información del partner
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Accès Partenaire
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            margin="normal"
            autoComplete="email"
            disabled={isLoading}
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            margin="normal"
            autoComplete="current-password"
            disabled={isLoading}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          onClick={handleLogin}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

