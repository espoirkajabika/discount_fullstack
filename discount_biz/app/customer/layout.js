'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/CustomerAuthContext';

// Import components
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  Menu,
  Home,
  Tag,
  Heart,
  User,
  Store,
  LogOut,
  LogIn,
  Ticket
} from 'lucide-react';

export default function CustomerLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, customer, isLoggedIn, isInitialized, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items
  const navigation = [
    { name: 'Home', href: '/customer', icon: Home, requireAuth: false },
    { name: 'Offers', href: '/customer/offers', icon: Tag, requireAuth: false },
    { name: 'Businesses', href: '/customer/businesses', icon: Store, requireAuth: false },
    { name: 'Saved Offers', href: '/customer/saved-offers', icon: Heart, requireAuth: true },
    { name: 'My Offers', href: '/customer/claimed', icon: Ticket, requireAuth: true },
    { name: 'Profile', href: '/customer/profile', icon: User, requireAuth: true }
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/customer');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/customer" className="flex items-center space-x-2">
              <Tag className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">SaverSpot</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navigation
              .filter(item => !item.requireAuth || isLoggedIn)
              .map(item => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? 'text-blue-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))
            }
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {!isInitialized ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={customer?.avatar} alt={customer?.first_name || 'User'} />
                      <AvatarFallback>
                        {customer?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{customer?.first_name} {customer?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/customer/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer/saved-offers">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Saved Offers</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer/claimed">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>My Offers</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/customer/auth/login">
                    Log in
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/customer/auth/signup">
                    Sign up
                  </Link>
                </Button>
              </div>
            )}
          
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 sm:w-80">
                <nav className="flex flex-col space-y-4 mt-8">
                  {navigation
                    .filter(item => !item.requireAuth || isLoggedIn)
                    .map(item => (
                      <Link 
                        key={item.name} 
                        href={item.href}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-md ${
                          pathname === item.href || pathname.startsWith(`${item.href}/`)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))
                  }
                  {!isLoggedIn && (
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Button className="w-full mb-2" asChild>
                        <Link href="/customer/auth/login">
                          <LogIn className="h-5 w-5 mr-2" />
                          Log in
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/customer/auth/signup">
                          Sign up
                        </Link>
                      </Button>
                    </div>
                  )}
                  {isLoggedIn && (
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-5 w-5 mr-2" />
                        Log out
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container px-4 py-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <Tag className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold">SaverSpot</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SaverSpot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}