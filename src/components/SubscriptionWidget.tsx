import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { AccessTime, Refresh, Warning, CheckCircle, Timer } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { UserProfile } from '../types';

interface SubscriptionWidgetProps {
  userProfile: UserProfile | null;
  onRefresh?: () => void;
  compact?: boolean;
}

const SubscriptionWidget: React.FC<SubscriptionWidgetProps> = ({ 
  userProfile, 
  onRefresh, 
  compact = false 
}) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);

  // Función para calcular el tiempo restante y progreso
  const calculateTimeRemaining = () => {
    if (!userProfile?.subscriptionEnd) return;

    const now = new Date();
    const endDate = userProfile.subscriptionEnd.toDate();
    const diffTime = endDate.getTime() - now.getTime();

    if (diffTime <= 0) {
      setTimeRemaining(t('expired'));
      setProgressPercentage(100);
      setIsExpiringSoon(false);
      return;
    }

    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    // Formatear tiempo restante
    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m`);
    } else {
      setTimeRemaining(`${minutes}m`);
    }

    // Calcular progreso (basado en días desde inicio hasta fin)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Asumir 30 días de suscripción
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    setProgressPercentage(progress);

    // Marcar como expirando pronto si quedan menos de 3 días
    setIsExpiringSoon(days <= 3 && days >= 0);
  };

  // Actualizar cada minuto
  useEffect(() => {
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, [userProfile?.subscriptionEnd]);

  // Determinar el estado de la suscripción
  const getSubscriptionStatus = () => {
    if (!userProfile) return { status: 'none', color: '#6c757d', icon: <Warning /> };
    
    const now = new Date();
    const endDate = userProfile.subscriptionEnd.toDate();
    const isExpired = endDate.getTime() <= now.getTime();
    
    if (userProfile.subscriptionStatus === 'trial') {
      return { 
        status: 'trial', 
        color: isExpiringSoon ? '#ffc107' : '#17a2b8', 
        icon: <Timer /> 
      };
    } else if (userProfile.subscriptionStatus === 'active' && !isExpired) {
      return { 
        status: 'active', 
        color: isExpiringSoon ? '#fd7e14' : '#28a745', 
        icon: <CheckCircle /> 
      };
    } else {
      return { 
        status: 'expired', 
        color: '#dc3545', 
        icon: <Warning /> 
      };
    }
  };

  const subscriptionInfo = getSubscriptionStatus();

  if (!userProfile) {
    return null;
  }

  const formatEndDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Box sx={{ 
      width: '100%',
      p: compact ? 2 : 3,
      backgroundColor: '#f8f9fa',
      borderRadius: 2,
      border: '1px solid #e9ecef',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Barra de progreso superior */}
      <LinearProgress
        variant="determinate"
        value={progressPercentage}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: subscriptionInfo.color,
            transition: 'all 0.3s ease'
          }
        }}
      />

      {/* Header con estado y botón de refresh */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ color: subscriptionInfo.color, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ 
            color: '#6c757d',
            fontWeight: 500,
            fontSize: compact ? '0.75rem' : '0.875rem'
          }}>
            {t('subscriptionStatus')}
          </Typography>
        </Box>
        
        {onRefresh && (
          <Tooltip title={t('refresh')}>
            <IconButton 
              size="small" 
              onClick={onRefresh}
              sx={{ 
                color: subscriptionInfo.color,
                '&:hover': { backgroundColor: `${subscriptionInfo.color}15` }
              }}
            >
              <Refresh sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Estado de suscripción */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Chip 
          icon={subscriptionInfo.icon}
          label={subscriptionInfo.status === 'trial' ? t('periodeEssai') : 
                subscriptionInfo.status === 'active' ? t('actif') : t('expired')}
          size="small"
          sx={{ 
            backgroundColor: subscriptionInfo.color,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            '& .MuiChip-icon': { color: 'white' }
          }}
        />
        
        {timeRemaining && (
          <Typography variant="body2" sx={{ 
            color: isExpiringSoon ? '#dc3545' : '#6c757d',
            fontWeight: isExpiringSoon ? 'bold' : 'normal',
            fontSize: compact ? '0.75rem' : '0.875rem'
          }}>
            {t('timeRemaining')}: {timeRemaining}
          </Typography>
        )}
      </Box>

      {/* Fecha de expiración */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ 
          color: '#6c757d',
          display: 'block',
          mb: 0.5
        }}>
          {t('subscriptionValidUntil')}
        </Typography>
        <Typography variant="h6" sx={{ 
          color: '#212529',
          fontWeight: 'bold',
          fontSize: compact ? '1rem' : '1.25rem'
        }}>
          {formatEndDate(userProfile.subscriptionEnd.toDate())}
        </Typography>
      </Box>

      {/* Información adicional si no es compacto */}
      {!compact && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          mt: 2,
          pt: 2,
          borderTop: '1px solid #e9ecef'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#6c757d', display: 'block' }}>
              {t('plan')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#212529' }}>
              {userProfile.subscriptionPlan === 'monthly' ? t('planMensuel') : 
               userProfile.subscriptionPlan === 'yearly' ? t('planAnnuel') : t('trial')}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#6c757d', display: 'block' }}>
              {t('totalPaid')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#28a745' }}>
              CHF {userProfile.totalPaid?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Indicador de expiración próxima */}
      {isExpiringSoon && (
        <Box sx={{ 
          mt: 2,
          p: 1.5,
          backgroundColor: '#fff3cd',
          borderRadius: 1,
          border: '1px solid #ffeaa7'
        }}>
          <Typography variant="caption" sx={{ 
            color: '#856404',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            <Warning sx={{ fontSize: 16 }} />
            {t('expiringSoon')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SubscriptionWidget;
