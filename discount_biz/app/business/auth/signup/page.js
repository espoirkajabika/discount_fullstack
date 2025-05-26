'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// Icons
import { EyeOff, Eye, Lock } from 'lucide-react';

export default function BusinessSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    phone_number: '',
    business_website: '',
    business_address: '',
    social_media_links: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (social media links)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setActiveTab('account');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setActiveTab('account');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...dataToSend } = formData;
      
      const result = await signUp(dataToSend);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Redirect to login page with success message
      router.push('/business/auth/login?registered=true');
    } catch (err) {
      setError('Failed to sign up. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E2F5A] px-4 py-8">
      <div className="w-full max-w-2xl">
        <Card className="rounded-xl shadow-xl bg-white">
          <CardHeader className="px-6 pt-6 pb-2 text-center">
            <CardTitle className="text-2xl font-bold mb-1 text-gray-900">
              Create Business Account
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/business/auth/login" 
                className="text-[#FF7139] font-semibold italic hover:underline"
              >
                Sign in
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Tabs 
                defaultValue="account" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="business">Business</TabsTrigger>
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-semibold">
                        Password
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
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a password"
                          className="pl-8 pr-10"
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
                        Confirm Password
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
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          className="pl-8 pr-10"
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
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      className="bg-[#FF7139] hover:bg-[#e6632e] text-white"
                      onClick={() => setActiveTab('business')}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-gray-700 font-semibold">
                      Business Name
                    </Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      type="text"
                      required
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Enter your business name"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-gray-700 font-semibold">
                        Phone Number
                      </Label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_website" className="text-gray-700 font-semibold">
                        Website
                      </Label>
                      <Input
                        id="business_website"
                        name="business_website"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.business_website}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_address" className="text-gray-700 font-semibold">
                      Business Address
                    </Label>
                    <Textarea
                      id="business_address"
                      name="business_address"
                      rows={3}
                      value={formData.business_address}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab('account')}
                    >
                      Previous
                    </Button>
                    <Button 
                      type="button" 
                      className="bg-[#FF7139] hover:bg-[#e6632e] text-white"
                      onClick={() => setActiveTab('social')}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="social_media_links.facebook" className="text-gray-700 font-semibold">
                      Facebook
                    </Label>
                    <Input
                      id="social_media_links.facebook"
                      name="social_media_links.facebook"
                      type="url"
                      value={formData.social_media_links.facebook}
                      onChange={handleChange}
                      placeholder="Optional Facebook page URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_media_links.instagram" className="text-gray-700 font-semibold">
                      Instagram
                    </Label>
                    <Input
                      id="social_media_links.instagram"
                      name="social_media_links.instagram"
                      type="url"
                      value={formData.social_media_links.instagram}
                      onChange={handleChange}
                      placeholder="Optional Instagram profile URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_media_links.twitter" className="text-gray-700 font-semibold">
                      Twitter
                    </Label>
                    <Input
                      id="social_media_links.twitter"
                      name="social_media_links.twitter"
                      type="url"
                      value={formData.social_media_links.twitter}
                      onChange={handleChange}
                      placeholder="Optional Twitter profile URL"
                    />
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab('business')}
                    >
                      Previous
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#FF7139] hover:bg-[#e6632e] text-white"
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}