'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/CustomerAuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Save
} from 'lucide-react';

export default function NotificationPreferences() {
  const { customer, updateProfile, isInitialized } = useAuth();
  
  const [preferences, setPreferences] = useState({
    email: {
      offers: true,
      reminders: true,
      updates: false,
    },
    push: {
      offers: false,
      reminders: false,
      updates: false,
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Initialize preferences when customer data is available
  useEffect(() => {
    if (customer?.notification_preferences) {
      setPreferences(customer.notification_preferences);
    }
  }, [customer]);
  
  // Handle toggle changes
  const handleToggleChange = (category, type) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type]
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Update profile with new notification preferences
      const result = await updateProfile({
        notification_preferences: preferences
      });
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      setSuccess('Notification preferences updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Failed to update notification preferences:', err);
      setError('Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading state
  if (!isInitialized) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Success Message */}
          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Email Notifications */}
          <div className="space-y-3">
            <h3 className="text-base font-medium flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              Email Notifications
            </h3>
            
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <Label htmlFor="email-offers" className="font-medium">New Offers</Label>
                <p className="text-sm text-gray-500">Get notified about new offers from your favorite businesses</p>
              </div>
              <Switch
                id="email-offers"
                checked={preferences.email.offers}
                onCheckedChange={() => handleToggleChange('email', 'offers')}
              />
            </div>
            
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <Label htmlFor="email-reminders" className="font-medium">Offer Reminders</Label>
                <p className="text-sm text-gray-500">Receive reminders about offers before they expire</p>
              </div>
              <Switch
                id="email-reminders"
                checked={preferences.email.reminders}
                onCheckedChange={() => handleToggleChange('email', 'reminders')}
              />
            </div>
            
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <Label htmlFor="email-updates" className="font-medium">Account Updates</Label>
                <p className="text-sm text-gray-500">Get updates about your account activity</p>
              </div>
              <Switch
                id="email-updates"
                checked={preferences.email.updates}
                onCheckedChange={() => handleToggleChange('email', 'updates')}
              />
            </div>
          </div>
          
          {/* Push Notifications */}
          <div className="space-y-3">
            <h3 className="text-base font-medium flex items-center">
              <Smartphone className="mr-2 h-4 w-4" />
              Push Notifications
            </h3>
            
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <Label htmlFor="push-offers" className="font-medium">New Offers</Label>
                <p className="text-sm text-gray-500">Get notified about new offers from your favorite businesses</p>
              </div>
              <Switch
                id="push-offers"
                checked={preferences.push.offers}
                onCheckedChange={() => handleToggleChange('push', 'offers')}
              />
            </div>
            
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <Label htmlFor="push-reminders" className="font-medium">Offer Reminders</Label>
                <p className="text-sm text-gray-500">Receive reminders about offers before they expire</p>
              </div>
              <Switch
                id="push-reminders"
                checked={preferences.push.reminders}
                onCheckedChange={() => handleToggleChange('push', 'reminders')}
              />
            </div>
            
            <div className="grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <Label htmlFor="push-updates" className="font-medium">Account Updates</Label>
                <p className="text-sm text-gray-500">Get updates about your account activity</p>
              </div>
              <Switch
                id="push-updates"
                checked={preferences.push.updates}
                onCheckedChange={() => handleToggleChange('push', 'updates')}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⋮</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}