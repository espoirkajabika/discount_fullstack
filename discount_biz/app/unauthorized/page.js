'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0E2F5A] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You don't have permission to access this page. This area is restricted to business users only.
          </p>
          
          <div className="space-y-2">
            <Button 
              className="w-full bg-[#FF7139] hover:bg-[#e6632e] text-white"
              asChild
            >
              <Link href="/auth/signup">
                <Home className="w-4 h-4 mr-2" />
                Register Business Account
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 mt-4">
            Already have a business account?{' '}
            <Link 
              href="/auth/login" 
              className="text-[#FF7139] hover:underline font-medium"
            >
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}