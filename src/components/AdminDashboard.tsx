import React from 'react';
import { PartnerDashboard } from './PartnerDashboard';

interface AdminDashboardProps {
  adminId: string;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminId, onLogout }) => {
  // Reuse PartnerDashboard but with admin privileges
  // Pass a special flag to allow editing all offers
  return (
    <PartnerDashboard 
      partnerId={adminId} 
      onLogout={onLogout}
      isAdmin={true}
    />
  );
};

