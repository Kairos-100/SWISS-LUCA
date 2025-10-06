import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface ProfessionalButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
  glow?: boolean;
}

const getButtonStyles = (variant: string, glow: boolean) => {
  const baseStyles = {
    borderRadius: 12,
    padding: '12px 24px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'none',
    minHeight: 44,
    '&:hover': {
      transform: 'translateY(-2px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
      color: '#000000',
      border: 'none',
      '&:hover': {
        background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
        boxShadow: glow ? '0 8px 25px rgba(255, 107, 53, 0.3)' : '0 8px 25px rgba(0, 0, 0, 0.3)',
      },
    },
    secondary: {
      background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      color: '#FFFFFF',
      border: 'none',
      '&:hover': {
        background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
        boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
      },
    },
    outline: {
      background: 'transparent',
      color: '#FFD700',
      border: '2px solid #FFD700',
      '&:hover': {
        background: 'rgba(255, 215, 0, 0.1)',
        borderColor: '#FFA000',
        boxShadow: '0 8px 25px rgba(255, 215, 0, 0.2)',
      },
    },
    ghost: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 215, 0, 0.3)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
      },
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[variant as keyof typeof variantStyles],
  };
};

export const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  variant = 'primary',
  loading = false,
  icon,
  children,
  disabled,
  glow = false,
  ...props
}) => {
  const buttonStyles = getButtonStyles(variant, glow);
  
  return (
    <Button
      variant="contained"
      disabled={disabled || loading}
      {...props}
      sx={{
        ...buttonStyles,
        ...props.sx,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {loading ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
};

export default ProfessionalButton;
