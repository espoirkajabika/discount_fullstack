'use client';

import { BusinessRoute } from '@/components/ProtectedRoute';
import Navigation from './Navigation';

export default function BusinessLayout({ children, showNavigation = true }) {
  return (
    <BusinessRoute>
      <div className="min-h-screen bg-gray-50">
        {showNavigation && <Navigation />}
        {children}
      </div>
    </BusinessRoute>
  );
}