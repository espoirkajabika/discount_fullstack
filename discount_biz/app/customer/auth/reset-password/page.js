'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// Import UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, Tag } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await resetPassword(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/customer" className="inline-flex items-center justify-center">
            <Tag className="h-10 w-10 text-blue-600" />
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="mt-1 text-gray-500">We'll send you a link to reset your password</p>
        </div>

        <Card>
          {/* Success state */}
          {isSubmitted ? (
            <CardContent className="pt-8 pb-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>

              <CardTitle className="mt-4 text-gray-900">
                Check your email
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                We've sent a password reset link to <span className="font-medium">{email}</span>.
                Please check your inbox and spam folder.
              </CardDescription>

              <Button variant="link" className="mt-4 text-blue-600" asChild>
                <Link href="/customer/auth/login">Return to login</Link>
              </Button>
            </CardContent>
          ) : (
            <>
              {/* Form header */}
              <CardHeader>
                <CardTitle>Reset password</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a reset link.
                </CardDescription>
              </CardHeader>

              {/* Form body */}
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                        size={18} 
                      />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send reset link'}
                  </Button>
                </form>
              </CardContent>

              {/* Footer link */}
              <CardFooter className="justify-center">
                <Button variant="link" className="text-blue-600" asChild>
                  <Link href="/customer/auth/login">Back to login</Link>
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}