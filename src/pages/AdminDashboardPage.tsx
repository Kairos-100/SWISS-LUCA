import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Box, CircularProgress } from '@mui/material';
import { auth } from '../firebase';
import { AdminDashboard } from '../components/AdminDashboard';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminId } = useParams<{ adminId?: string }>();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Si no hay adminId en la URL, intentar obtenerlo del usuario actual
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/', { replace: true });
        return;
      }

      // Verificar que el usuario es admin
      const { doc: docFn, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const userRef = docFn(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isAdmin !== true) {
          navigate('/', { replace: true });
          return;
        }
      } else {
        navigate('/', { replace: true });
        return;
      }

      // Si no hay adminId en la URL, usar el UID del usuario
      if (!adminId) {
        navigate(`/admin/dashboard/${user.uid}`, { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, adminId]);

  // Mostrar loading mientras se verifica
  if (!adminId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AdminDashboard
      adminId={adminId}
      onLogout={handleLogout}
    />
  );
};

