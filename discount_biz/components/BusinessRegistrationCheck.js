// components/BusinessRegistrationCheck.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { makeAuthenticatedRequest } from '@/lib/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Building } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      <p className="mt-4 text-gray-600">Checking business registration...</p>
    </div>
  </div>
);

const BusinessRegistrationPrompt = () => {
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Business Registration Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              You need to register your business before you can create products and offers.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/business/register')}
                className="w-full"
              >
                Register My Business
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export function BusinessRegistrationCheck({ children }) {
  const { user } = useAuth();
  const [hasBusinessProfile, setHasBusinessProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkBusinessRegistration = async () => {
      if (!user) return;

      try {
        const response = await makeAuthenticatedRequest('/business/profile');
        
        if (response && response.ok) {
          const data = await response.json();
          setHasBusinessProfile(!!data.business);
        } else if (response && response.status === 404) {
          // Business not found - user needs to register
          setHasBusinessProfile(false);
        } else {
          // Other error
          setError('Failed to check business registration status');
        }
      } catch (err) {
        console.error('Error checking business registration:', err);
        setError('Network error checking business registration');
      } finally {
        setIsLoading(false);
      }
    };

    checkBusinessRegistration();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (hasBusinessProfile === false) {
    return <BusinessRegistrationPrompt />;
  }

  // User has business profile, render children
  return children;
}

export default BusinessRegistrationCheck;