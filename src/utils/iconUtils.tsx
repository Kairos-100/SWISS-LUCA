import type { SvgIconProps } from '@mui/material';
import { 
  RestaurantCategoryIcon,
  BarCategoryIcon,
  BakeryCategoryIcon,
  ShopCategoryIcon,
  BeautyCategoryIcon,
  FitnessCategoryIcon,
  HealthCategoryIcon,
  EntertainmentCategoryIcon,
  HotelCategoryIcon
} from '../components/ProfessionalIcons';

// Función helper para obtener el icono correcto según la categoría
export const getCategoryIcon = (category: string, props?: SvgIconProps) => {
  const iconProps = { sx: { fontSize: 20 }, ...props };
  
  switch (category) {
    case 'restaurants':
      return <RestaurantCategoryIcon {...iconProps} />;
    case 'bars':
      return <BarCategoryIcon {...iconProps} />;
    case 'bakeries':
      return <BakeryCategoryIcon {...iconProps} />;
    case 'shops':
      return <ShopCategoryIcon {...iconProps} />;
    case 'clothing':
      return <ShopCategoryIcon {...iconProps} />;
    case 'beauty':
      return <BeautyCategoryIcon {...iconProps} />;
    case 'fitness':
      return <FitnessCategoryIcon {...iconProps} />;
    case 'health':
      return <HealthCategoryIcon {...iconProps} />;
    case 'entertainment':
      return <EntertainmentCategoryIcon {...iconProps} />;
    case 'hotels':
      return <HotelCategoryIcon {...iconProps} />;
    default:
      return <ShopCategoryIcon {...iconProps} />;
  }
};
