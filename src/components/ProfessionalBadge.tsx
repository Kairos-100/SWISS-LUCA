import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';

interface ProfessionalBadgeProps extends Omit<ChipProps, 'size' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  glow?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const getBadgeStyles = (variant: string, glow: boolean, size: string) => {
  const baseStyles = {
    borderRadius: 20,
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  };

  const sizeStyles = {
    small: {
      height: 24,
      fontSize: '0.7rem',
      padding: '0 8px',
    },
    medium: {
      height: 32,
      fontSize: '0.8rem',
      padding: '0 12px',
    },
    large: {
      height: 40,
      fontSize: '0.9rem',
      padding: '0 16px',
    },
  };

  const variantStyles = {
    primary: {
      background: 'rgba(255, 215, 0, 0.1)',
      color: '#FFD700',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      '&:hover': {
        background: 'rgba(255, 215, 0, 0.2)',
        borderColor: 'rgba(255, 215, 0, 0.5)',
        boxShadow: glow ? '0 4px 15px rgba(255, 215, 0, 0.3)' : 'none',
      },
    },
    secondary: {
      background: 'rgba(33, 150, 243, 0.1)',
      color: '#2196F3',
      border: '1px solid rgba(33, 150, 243, 0.3)',
      '&:hover': {
        background: 'rgba(33, 150, 243, 0.2)',
        borderColor: 'rgba(33, 150, 243, 0.5)',
        boxShadow: glow ? '0 4px 15px rgba(33, 150, 243, 0.3)' : 'none',
      },
    },
    success: {
      background: 'rgba(76, 175, 80, 0.1)',
      color: '#4CAF50',
      border: '1px solid rgba(76, 175, 80, 0.3)',
      '&:hover': {
        background: 'rgba(76, 175, 80, 0.2)',
        borderColor: 'rgba(76, 175, 80, 0.5)',
        boxShadow: glow ? '0 4px 15px rgba(76, 175, 80, 0.3)' : 'none',
      },
    },
    warning: {
      background: 'rgba(255, 152, 0, 0.1)',
      color: '#FF9800',
      border: '1px solid rgba(255, 152, 0, 0.3)',
      '&:hover': {
        background: 'rgba(255, 152, 0, 0.2)',
        borderColor: 'rgba(255, 152, 0, 0.5)',
        boxShadow: glow ? '0 4px 15px rgba(255, 152, 0, 0.3)' : 'none',
      },
    },
    error: {
      background: 'rgba(244, 67, 54, 0.1)',
      color: '#F44336',
      border: '1px solid rgba(244, 67, 54, 0.3)',
      '&:hover': {
        background: 'rgba(244, 67, 54, 0.2)',
        borderColor: 'rgba(244, 67, 54, 0.5)',
        boxShadow: glow ? '0 4px 15px rgba(244, 67, 54, 0.3)' : 'none',
      },
    },
    info: {
      background: 'rgba(33, 150, 243, 0.1)',
      color: '#2196F3',
      border: '1px solid rgba(33, 150, 243, 0.3)',
      '&:hover': {
        background: 'rgba(33, 150, 243, 0.2)',
        borderColor: 'rgba(33, 150, 243, 0.5)',
        boxShadow: glow ? '0 4px 15px rgba(33, 150, 243, 0.3)' : 'none',
      },
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size as keyof typeof sizeStyles],
    ...variantStyles[variant as keyof typeof variantStyles],
  };
};

export const ProfessionalBadge: React.FC<ProfessionalBadgeProps> = ({
  variant = 'primary',
  glow = false,
  size = 'medium',
  ...props
}) => {
  const badgeStyles = getBadgeStyles(variant, glow, size);
  
  return (
    <Chip
      variant="outlined"
      size={size === 'large' ? 'medium' : size}
      {...props}
      sx={{
        ...badgeStyles,
        ...props.sx,
      }}
    />
  );
};

export default ProfessionalBadge;
