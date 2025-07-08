'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, getToken, getCurrentUser, signOut } from '@/lib/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/reset-password/update',
    '/',
    '/about',
    '/contact'
  ];

  // Routes that require business role
  const businessRoutes = [
    '/dashboard',
    '/profile',
    '/products',
    '/offers',
    '/analytics'
  ];

  const isPublicRoute = (path) => {
    return publicRoutes.some(route => path.startsWith(route));
  };

  const requiresBusinessRole = (path) => {
    return businessRoutes.some(route => path.startsWith(route));
  };

  const initializeAuth = async () => {
    try {
      const token = getToken();
      const storedUser = getUser();

      if (token && storedUser) {
        // Verify token is still valid by fetching current user
        const result = await getCurrentUser();
        
        if (result.user) {
          setUser(result.user);
        } else {
          // Token is invalid, clear stored data
          await signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const handleRouteProtection = () => {
      const isAuthenticated = !!user;
      const currentPath = pathname;

      // If user is not authenticated and trying to access protected route
      if (!isAuthenticated && !isPublicRoute(currentPath)) {
        router.push('/auth/login');
        return;
      }

      // If user is authenticated but trying to access auth pages
      if (isAuthenticated && (currentPath.startsWith('/auth'))) {
        router.push('/dashboard');
        return;
      }

      // If user is authenticated but doesn't have business role for business routes
      if (isAuthenticated && requiresBusinessRole(currentPath) && !user.is_business) {
        router.push('/unauthorized');
        return;
      }
    };

    handleRouteProtection();
  }, [user, pathname, initialized, router]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Call the auth service logout
      await signOut();
      
      console.log('Auth service logout completed');
      
      // Clear user state
      setUser(null);
      
      console.log('User state cleared');
      
      // Force redirect to login
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout API call fails, clear local state
      setUser(null);
      
      // Clear localStorage directly as fallback
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      
      // Force redirect to login
      window.location.href = '/auth/login';
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    initialized,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isBusiness: !!user?.is_business,
    isAdmin: !!user?.is_admin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;