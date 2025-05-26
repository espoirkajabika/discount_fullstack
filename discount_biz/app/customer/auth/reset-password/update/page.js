'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/CustomerAuthContext';

// Import UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Lock, EyeOff, Eye, Tag } from 'lucide-react';

export default function UpdatePassword() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
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
      const result = await updatePassword(password);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/customer/auth/login?reset=success');
      }, 3000);
    } catch (err) {
      setError('Failed to update password. Please try again.');
      console.error('Update password error:', err);
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
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Create a new password</h1>
          <p className="mt-1 text-gray-500">Choose a strong password for your account</p>
        </div>

        <Card className="w-full">
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
                className="mt-4 text-blue-600 hover:underline"
                asChild
              >
                <Link href="/customer/auth/login">
                  Go to login
                </Link>
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Set new password</CardTitle>
                <CardDescription>
                  Create a new password for your account
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
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
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating password...' : 'Update password'}
                  </Button>
                </form>
              </CardContent>
              
              <CardFooter className="flex justify-center">
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