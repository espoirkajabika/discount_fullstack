// components/OffersNavigation.js
import React from 'react';
import Link from 'next/link';
import { MapPin, Home, User, Search, Tag } from 'lucide-react';
import { useRouter } from 'next/router';

const OffersNavigation = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      active: currentPath === '/'
    },
    {
      href: '/offers',
      label: 'Find Offers',
      icon: MapPin,
      active: currentPath === '/offers'
    },
    {
      href: '/categories',
      label: 'Categories',
      icon: Tag,
      active: currentPath === '/categories'
    },
    {
      href: '/search',
      label: 'Search',
      icon: Search,
      active: currentPath === '/search'
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      active: currentPath === '/profile'
    }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">OfferFinder</span>
            </Link>

            {/* Navigation Items */}
            <div className="flex space-x-8">
              {navItems.slice(0, -1).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPath === '/profile'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  item.active
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom padding to prevent content from being hidden */}
      <div className="md:hidden h-16"></div>
    </>
  );
};

export default OffersNavigation;