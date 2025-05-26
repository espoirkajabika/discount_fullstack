'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { updatePassword } from '@/lib/auth';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Lock, EyeOff, Eye, AlertTriangle } from 'lucide-react';

export default function UpdatePassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get reset token from URL parameters
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }
    setToken(resetToken);
  }, [searchParams]);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return false;
    }

    return true;
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Note: You'll need to modify this based on your FastAPI implementation
      // This assumes you have an endpoint that accepts the token and new password
      const result = await updatePassword(password, token);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?reset=success');
      }, 3000);
    } catch (err) {
      setError('Failed to update password. Please try again or request a new reset link.');
      console.error('Update password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show error if no token
  if (!token && !error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E2F5A] px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="rounded-xl shadow-xl bg-white">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="mt-3 text-xl text-gray-900">Invalid Reset Link</CardTitle>
              <CardDescription className="mt-2">
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
              <Button 
                className="mt-4 bg-[#FF7139] hover:bg-[#e6632e] text-white"
                asChild
              >
                <Link href="/auth/reset-password">
                  Request New Reset Link
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E2F5A] px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="rounded-xl shadow-xl bg-white">
          {success ? (
            <CardContent className="pt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="mt-3 text-xl">Password updated successfully</CardTitle>
              <CardDescription className="mt-2">
                Your password has been updated. You will be redirected to the login page shortly.
              </CardDescription>
              <Button 
                variant="link" 
                className="mt-4 text-[#FF7139] hover:underline"
                asChild
              >
                <Link href="/auth/login">
                  Go to login
                </Link>
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader className="px-6 pt-6 pb-2 text-center">
                <CardTitle className="text-2xl font-bold mb-1 text-gray-900">
                  Set New Password
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Create a strong, unique password for your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-6 py-4">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-semibold">
                      New password
                    </Label>
                    <div className="relative">
                      <Lock 
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" 
                        size={18} 
                      />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword.password ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a new password"
                        className="pl-8 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword.password ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">
                      Confirm new password
                    </Label>
                    <div className="relative">
                      <Lock 
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" 
                        size={18} 
                      />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword.confirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="pl-8 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#FF7139] hover:bg-[#e6632e] text-white text-md font-semibold mt-4"
                    disabled={isLoading || !password || !confirmPassword}
                  >
                    {isLoading ? 'Updating password...' : 'Update password'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Button variant="link" className="text-gray-600" asChild>
                    <Link href="/auth/login">
                      Back to login
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}