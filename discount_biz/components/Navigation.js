'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  ShoppingBag, 
  Tag, 
  User, 
  LogOut, 
  Home,
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard'
    },
    {
      label: 'Products',
      href: '/products',
      icon: ShoppingBag,
      active: pathname.startsWith('/products')
    },
    {
      label: 'Offers',
      href: '/offers',
      icon: Tag,
      active: pathname.startsWith('/offers')
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      active: pathname.startsWith('/analytics'),
      disabled: true
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
      disabled: true
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <Building className="h-8 w-8 text-[#FF7139] mr-3" />
            <span className="text-xl font-semibold text-gray-900">
              Business Portal
            </span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              
              if (item.disabled) {
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="flex items-center space-x-2 text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              }

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center space-x-2",
                      item.active 
                        ? "bg-[#FF7139]/10 text-[#FF7139]" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-700">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            
            if (item.disabled) {
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center space-y-1 text-gray-400 cursor-not-allowed p-2"
                  disabled
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center space-y-1 p-2",
                    item.active 
                      ? "text-[#FF7139]" 
                      : "text-gray-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}