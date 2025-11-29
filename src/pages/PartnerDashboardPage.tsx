import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Box, CircularProgress } from '@mui/material';
import { auth } from '../firebase';
import { PartnerDashboard } from '../components/PartnerDashboard';

export const PartnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { partnerId } = useParams<{ partnerId?: string }>();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/partner/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Si no hay partnerId en la URL, intentar obtenerlo del usuario actual
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/partner/login', { replace: true });
        return;
      }

      // Si no hay partnerId en la URL, usar el UID del usuario
      if (!partnerId) {
        navigate(`/partner/dashboard/${user.uid}`, { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, partnerId]);

  // Mostrar loading mientras se verifica
  if (!partnerId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PartnerDashboard
      partnerId={partnerId}
      onLogout={handleLogout}
    />
  );
};

