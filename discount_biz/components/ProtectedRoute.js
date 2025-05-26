'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0E2F5A]">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
      <p className="mt-4 text-white">Loading...</p>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0E2F5A] px-4">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-white mb-4">Unauthorized</h1>
      <p className="text-gray-300 mb-6">You don't have permission to access this page.</p>
      <button
        onClick={() => window.history.back()}
        className="bg-[#FF7139] hover:bg-[#e6632e] text-white px-6 py-2 rounded-md"
      >
        Go Back
      </button>
    </div>
  </div>
);

export const ProtectedRoute = ({ 
  children, 
  requireBusiness = false, 
  requireAdmin = false,
  fallback = null 
}) => {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    // If not authenticated, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // If requires business role but user doesn't have it
    if (requireBusiness && !user.is_business) {
      router.push('/unauthorized');
      return;
    }

    // If requires admin role but user doesn't have it
    if (requireAdmin && !user.is_admin) {
      router.push('/unauthorized');
      return;
    }
  }, [user, initialized, requireBusiness, requireAdmin, router]);

  // Show loading while checking authentication
  if (loading || !initialized) {
    return fallback || <LoadingSpinner />;
  }

  // If not authenticated
  if (!user) {
    return fallback || <LoadingSpinner />;
  }

  // If requires business role but user doesn't have it
  if (requireBusiness && !user.is_business) {
    return <UnauthorizedPage />;
  }

  // If requires admin role but user doesn't have it
  if (requireAdmin && !user.is_admin) {
    return <UnauthorizedPage />;
  }

  // User is authenticated and has required permissions
  return children;
};

export const BusinessRoute = ({ children, fallback }) => (
  <ProtectedRoute requireBusiness={true} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children, fallback }) => (
  <ProtectedRoute requireAdmin={true} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;