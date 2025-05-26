'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';

export default function BusinessLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      
      // Check if the account is suspended
      if (result.error && result.business?.subscription_status === 'suspended') {
        setError('This business account has been suspended. Please contact support.');
        return;
      }

      // Redirect to dashboard on successful login
      router.push('/business/dashboard');
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
                href="/business/auth/signup" 
                className="text-[#FF7139] font-semibold italic hover:underline"
              >
                Sign up
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-4">
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
                    href="/business/auth/reset-password" 
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