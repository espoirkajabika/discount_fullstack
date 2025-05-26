// app/business/layout.js

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, signOut } from '@/lib/auth';
import React from 'react';
import { 
  Home, 
  Package, 
  Tag, 
  PieChart, 
  Settings, 
  Menu, 
  X
} from 'lucide-react';

export default function BusinessLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Skip authentication for login, signup, and reset password routes
  const isAuthRoute = pathname.includes('/business/auth/');

  useEffect(() => {
    if (isAuthRoute) {
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const sessionData = await getSession();
        
        if (!sessionData.authenticated) {
          // Redirect to login if not authenticated
          router.push('/business/auth/login');
          return;
        }

        setUser(sessionData.user);
        setBusiness(sessionData.business);
      } catch (error) {
        console.error('Error fetching session:', error);
        // On error, redirect to login
        router.push('/business/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [pathname, isAuthRoute, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/business/auth/login');
  };

  // If on auth routes, don't show the navigation layout
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If we're still loading and don't have user data, show loading spinner
  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/business/dashboard', icon: Home },
    { name: 'Products', href: '/business/products', icon: Package },
    { name: 'Offers', href: '/business/offers', icon: Tag },
    { name: 'Analytics', href: '/business/offers/analytics', icon: PieChart },
    { name: 'Settings', href: '/business/settings', icon: Settings },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {business?.business_name || 'Business Portal'}
                </h1>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      {React.createElement(item.icon, {
                        className: `${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 flex-shrink-0 h-6 w-6`
                      })}
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {business?.business_name ? business.business_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.email}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="text-xs font-medium text-gray-500 group-hover:text-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className={`${isMenuOpen ? 'fixed inset-0 flex z-40' : ''}`}>
          {/* Off-canvas menu overlay, show/hide based on off-canvas menu state */}
          {isMenuOpen && (
            <div className="fixed inset-0" onClick={() => setIsMenuOpen(false)}>
              <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
            </div>
          )}

          {/* Off-canvas menu, show/hide based on off-canvas menu state */}
          <div className={`${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition ease-in-out duration-300 transform fixed z-40 flex-1 flex flex-col max-w-xs w-full bg-white`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              {isMenuOpen && (
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" />
                </button>
              )}
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {business?.business_name || 'Business Portal'}
                </h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {React.createElement(item.icon, {
                        className: `${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 flex-shrink-0 h-6 w-6`
                      })}
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div>
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {business?.business_name ? business.business_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.email}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="text-xs font-medium text-gray-500 group-hover:text-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow md:hidden">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setIsMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                {business?.business_name || 'Business Portal'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div>
                  <button
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {business?.business_name ? business.business_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
                    </div>
                  </button>
                </div>
                
                {/* Profile dropdown */}
                {isProfileMenuOpen && (
                  <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" 
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="user-menu"
                  >
                    <Link 
                      href="/business/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}