'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/CustomerAuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { User, Mail, Phone, Save, CheckCircle2 } from 'lucide-react';

export default function ProfileForm() {
  const { user, customer, updateProfile, isInitialized } = useAuth();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Initialize form data when customer data is available
  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone_number: customer.phone_number || '',
      });
    }
  }, [customer]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await updateProfile(formData);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
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
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your personal details
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="pl-10 bg-gray-50"
              />
            </div>
            <p className="text-xs text-gray-500">
              Your email cannot be changed
            </p>
          </div>
          
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Your first name"
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Your last name"
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+1 (234) 567-8901"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500">
              Your phone number helps with account recovery
            </p>
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
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}