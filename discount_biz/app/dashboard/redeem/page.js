'use client';

import { BusinessRoute } from '@/components/ProtectedRoute';
import RedeemOfferDashboard from '@/components/RedeemOfferDashboard';

export default function RedeemPage() {
  return (
    <BusinessRoute>
      <RedeemOfferDashboard />
    </BusinessRoute>
  );
}