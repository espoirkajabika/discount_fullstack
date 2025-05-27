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
import { CheckCircle, Lock, EyeOff, Eye, AlertTriangle, Building2, ArrowLeft } from 'lucide-react';

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          </div>
          
          <Card className="rounded-2xl shadow-xl bg-ivory border-0">
            <CardContent className="pt-8 pb-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900 mb-2">Invalid Reset Link</CardTitle>
              <CardDescription className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
              <Button 
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg"
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Password</h1>
          <p className="text-gray-600">Create a secure password for your account</p>
        </div>

        <Card className="rounded-2xl shadow-xl bg-ivory border-0">
          {success ? (
            <CardContent className="pt-8 pb-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900 mb-2">Password Updated!</CardTitle>
              <CardDescription className="text-gray-600 mb-6">
                Your password has been successfully updated. You will be redirected to the login page shortly.
              </CardDescription>
              <Button 
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                asChild
              >
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Login
                </Link>
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader className="px-8 pt-8 pb-4 text-center">
                <CardTitle className="text-2xl font-bold mb-2 text-gray-900">
                  Set New Password
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Create a strong, unique password for your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-8 pb-8">
                {error && (
                  <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                      New password
                    </Label>
                    <div className="relative">
                      <Lock 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
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
                        className="pl-10 pr-12 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword.password ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm">
                      Confirm new password
                    </Label>
                    <div className="relative">
                      <Lock 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
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
                        className="pl-10 pr-12 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading || !password || !confirmPassword}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating password...</span>
                      </div>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <Button 
                    variant="link" 
                    className="text-green-600 hover:text-green-700 font-medium" 
                    asChild
                  >
                    <Link href="/auth/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
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