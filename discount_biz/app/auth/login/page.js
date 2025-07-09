'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import { Mail, Lock, EyeOff, Eye, CheckCircle, Building2 } from 'lucide-react';

export default function BusinessLogin() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Remove useSearchParams for now to avoid the Suspense issue
  useEffect(() => {
    // We'll check URL params manually if needed
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const registered = urlParams.get('registered');
      const reset = urlParams.get('reset');

      if (registered === 'true') {
        setSuccessMessage('Account created successfully! Please log in.');
      } else if (reset === 'success') {
        setSuccessMessage('Password updated successfully! Please log in with your new password.');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting login process...');
      
      const result = await signIn(email, password);
      
      if (result.error) {
        console.error('Login failed:', result.error);
        setError(result.error);
        return;
      }
      
      if (result.user && !result.user.is_business) {
        setError('This account is not registered as a business. Please use the customer login or register a business account.');
        return;
      }

      console.log('Login successful, user:', result.user);
      login(result.user);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Login</h1>
          <p className="text-gray-600">Sign in to your business account</p>
        </div>

        <Card className="rounded-2xl shadow-xl bg-ivory border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your credentials to access your business dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {successMessage && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                  Email address
                </Label>
                <div className="relative">
                  <Mail 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    size={18} 
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    size={18} 
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-12 h-12 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-ivory text-gray-500">Don't have an account?</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                asChild
              >
                <Link href="/auth/signup">
                  Create business account
                </Link>
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}