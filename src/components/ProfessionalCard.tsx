import React from 'react';
import { Card, CardContent, CardMedia } from '@mui/material';
import type { CardProps } from '@mui/material';

interface ProfessionalCardProps extends CardProps {
  image?: string;
  imageHeight?: number;
  glow?: boolean;
  interactive?: boolean;
}

const getCardStyles = (glow: boolean, interactive: boolean) => ({
  background: 'linear-gradient(145deg, #1A1A1A 0%, #2A2A2A 100%)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  position: 'relative',
  
  ...(interactive && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: glow 
        ? '0 12px 40px rgba(255, 215, 0, 0.2)' 
        : '0 12px 40px rgba(0, 0, 0, 0.4)',
      borderColor: 'rgba(255, 215, 0, 0.3)',
    },
  }),
});

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  image,
  imageHeight = 200,
  glow = false,
  interactive = false,
  children,
  ...props
}) => {
  const cardStyles = getCardStyles(glow, interactive);
  
  return (
    <Card {...props} sx={{ ...cardStyles, ...props.sx } as any}>
      {image && (
        <CardMedia
          component="img"
          height={imageHeight}
          image={image}
          alt="Card image"
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            ...(interactive && {
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }),
          }}
        />
      )}
      <CardContent sx={{ position: 'relative', zIndex: 2 }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default ProfessionalCard;
