import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Box, CircularProgress } from '@mui/material';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PartnerDashboard } from '../components/PartnerDashboard';

export const PartnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { partnerId } = useParams<{ partnerId?: string }>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/partner/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Si no hay partnerId en la URL, intentar obtenerlo del usuario actual
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/partner/login', { replace: true });
        return;
      }

      try {
        // Check if user is admin or partner
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin === true);
          
          // Verify user has partner or admin permissions
          if (!userData.isPartner && !userData.isAdmin) {
            navigate('/partner/login', { replace: true });
            return;
          }
        } else {
          navigate('/partner/login', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
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

  // Set isChecking to false once partnerId is available
  useEffect(() => {
    if (partnerId) {
      setIsChecking(false);
    }
  }, [partnerId]);

  // Mostrar loading mientras se verifica
  if (!partnerId || isChecking) {
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
      isAdmin={isAdmin}
    />
  );
};

