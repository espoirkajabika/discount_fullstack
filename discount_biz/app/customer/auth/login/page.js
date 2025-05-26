'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/CustomerAuthContext';

// Import UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import { Mail, Lock, EyeOff, Eye, Tag, CheckCircle } from 'lucide-react';

export default function CustomerLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isLoggedIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check for URL parameters
  useEffect(() => {
    // Check if user is coming from registration
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('Account created successfully! You can now log in.');
      setShowSuccessMessage(true);
    }
    
    // Check if user is coming from password reset
    const reset = searchParams.get('reset');
    if (reset === 'success') {
      setSuccessMessage('Password has been reset successfully! You can now log in with your new password.');
      setShowSuccessMessage(true);
    }
    
    // Redirect if already logged in
    if (isLoggedIn) {
      router.push('/customer');
    }
  }, [searchParams, isLoggedIn, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Redirect to customer home page on successful login
      router.push('/customer');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials and try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <Link href="/customer" className="inline-flex items-center justify-center">
            <Tag className="h-10 w-10 text-blue-600" />
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-gray-500">Sign in to your SaverSpot account</p>
        </div>
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your email and password to log in
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {showSuccessMessage && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-100">
                <CheckCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold">
                  Email address
                </Label>
                <div className="relative">
                  <Mail 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    size={18} 
                  />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">
                    Password
                  </Label>
                  <Link 
                    href="/customer/auth/reset-password" 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    size={18} 
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  {/* Toggle show password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/customer/auth/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}