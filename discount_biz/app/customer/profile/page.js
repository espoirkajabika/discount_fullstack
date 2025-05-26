'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// Import components
import ProfileForm from '@/app/_components/ProfileForm';
import AvatarUpload from '@/app/_components/AvatarUpload';
import NotificationPreferences from '@/app/_components/NotificationPreferences';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Icons
import { 
  User, 
  Settings, 
  Bell, 
  Heart, 
  Shield, 
  LogOut,
  AlertCircle,
  Ticket,
  Clock
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, customer, isLoggedIn, isInitialized, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState({
    savedOffers: 0,
    claimedOffers: 0,
    activeOffers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Redirect if not logged in
  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      router.push('/customer/auth/login?redirect=/customer/profile');
    } else if (isLoggedIn) {
      fetchProfileStats();
    }
  }, [isLoggedIn, isInitialized, router]);
  
  // Fetch profile stats
  const fetchProfileStats = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      // Handle response text first to prevent JSON parsing errors on empty responses
      const text = await response.text();
      
      // If the response is not OK, handle the error gracefully
      if (!response.ok) {
        console.error('Error response from profile API:', response.status, text);
        // Don't throw here, just return from the function with error state set
        setStats({
          savedOffers: 0,
          claimedOffers: 0,
          activeOffers: 0
        });
        return;
      }
      
      // Only try to parse if we have text content
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data.profile?.stats) {
            setStats(data.profile.stats);
          }
        } catch (parseError) {
          console.error('Error parsing profile data:', parseError);
        }
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/customer');
  };
  
  // If still initializing auth, show loading
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }
  
  // If not logged in, show login prompt (this shouldn't usually be visible due to the redirect)
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication required</AlertTitle>
          <AlertDescription>
            You need to be logged in to view your profile.
          </AlertDescription>
        </Alert>
        
        <Button asChild>
          <Link href="/customer/auth/login?redirect=/customer/profile">
            Log in to continue
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-gray-500 mt-1">
            Manage your profile, preferences, and saved content
          </p>
        </div>
        
        <Button 
          variant="outline" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
      
      {/* Account Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Saved Offers</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats.savedOffers}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 mt-2 h-auto" 
              asChild
            >
              <Link href="/customer/saved-offers">View Saved Offers</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Claimed Offers</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats.claimedOffers}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 mt-2 h-auto" 
              asChild
            >
              <Link href="/customer/claimed">View Claimed Offers</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Active Offers</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{stats.activeOffers}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <Button 
              variant="link" 
              className="p-0 mt-2 h-auto" 
              asChild
            >
              <Link href="/customer/claimed?status=active">View Active Offers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Tabs */}
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <AvatarUpload />
            </div>
            
            <div className="md:col-span-2">
              <ProfileForm />
            </div>
          </div>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your security preferences and password
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-medium">Change Password</h3>
                <p className="text-sm text-gray-500">
                  For security reasons, you'll need to reset your password via email.
                </p>
                <Button asChild>
                  <Link href="/customer/auth/reset-password">
                    Reset Password
                  </Link>
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-medium">Account Activity</h3>
                <p className="text-sm text-gray-500">
                  Keep track of where you're signed in and manage your active sessions.
                </p>
                <Button variant="outline" disabled>
                  View Sessions (Coming Soon)
                </Button>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account.
                </p>
                <Button variant="outline" disabled>
                  Enable 2FA (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}