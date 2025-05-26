'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/auth';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import { Mail, Lock, EyeOff, Eye, CheckCircle } from 'lucide-react';

export default function BusinessLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for success messages from URL params
    const registered = searchParams.get('registered');
    const reset = searchParams.get('reset');

    if (registered === 'true') {
      setSuccessMessage('Account created successfully! Please log in.');
    } else if (reset === 'success') {
      setSuccessMessage('Password updated successfully! Please log in with your new password.');
    }
  }, [searchParams]);

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
      
      // Check if the user has business privileges
      if (result.user && !result.user.is_business) {
        setError('This account is not registered as a business. Please use the customer login or register a business account.');
        return;
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials and try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E2F5A] px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="rounded-xl shadow-xl bg-white">
          <CardHeader className="px-6 pt-6 pb-2 text-center">
            <CardTitle className="text-2xl font-bold mb-1 text-gray-900">
              Business Login
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              First time logging in?{' '}
              <Link 
                href="/auth/signup" 
                className="text-[#FF7139] font-semibold italic hover:underline"
              >
                Sign up
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-4">
            {successMessage && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" 
                    size={18} 
                  />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="pl-8"
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
                    href="/auth/reset-password" 
                    className="text-sm text-[#FF7139] hover:underline italic"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock 
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" 
                    size={18} 
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="pl-8 pr-10"
                  />
                  {/* Toggle show password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-[#FF7139] hover:bg-[#e6632e] text-white text-md font-semibold mt-4"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}