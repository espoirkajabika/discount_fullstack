'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerBusinessUser } from '@/lib/auth';

// Import shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { EyeOff, Eye, Lock } from 'lucide-react';

export default function BusinessSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // User fields
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    
    // Business fields
    business_name: '',
    business_description: '',
    business_address: '',
    business_phone: '',
    business_website: '',
    avatar_url: '',
    business_hours: null,
    category_id: null
  });
  
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const loadCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'}/categories/`);
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category_id: value
    }));
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

    if (!formData.email || !formData.business_name) {
      setError('Email and business name are required');
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
      // Prepare data for API (remove confirmPassword and format for API)
      const { confirmPassword, ...dataToSend } = formData;
      
      // Map business_phone to phone_number if provided
      if (dataToSend.business_phone) {
        dataToSend.phone_number = dataToSend.business_phone;
        delete dataToSend.business_phone;
      }

      // Ensure category_id is properly formatted
      if (dataToSend.category_id) {
        dataToSend.category_id = dataToSend.category_id;
      } else {
        delete dataToSend.category_id; // Remove if null/undefined
      }

      console.log('Sending registration data:', dataToSend); // Debug log

      const result = await registerBusinessUser(dataToSend);
      
      if (result.error) {
        // Handle different types of errors
        if (typeof result.error === 'object') {
          // If it's a validation error object from FastAPI
          if (result.error.detail) {
            if (Array.isArray(result.error.detail)) {
              // Handle FastAPI validation errors
              const errorMessages = result.error.detail.map(err => `${err.loc[1]}: ${err.msg}`).join(', ');
              setError(`Validation errors: ${errorMessages}`);
            } else {
              setError(result.error.detail);
            }
          } else {
            setError('Registration failed. Please check your information and try again.');
          }
        } else {
          setError(result.error);
        }
        return;
      }
      
      // Redirect to dashboard on successful registration
      router.push('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to create account. Please try again.');
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
                href="/auth/login" 
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
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-gray-700 font-semibold">
                        First Name
                      </Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Your first name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-gray-700 font-semibold">
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Your last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">
                      Email address *
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

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-semibold">
                        Password *
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
                        Confirm Password *
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
                      Business Name *
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

                  <div className="space-y-2">
                    <Label htmlFor="business_description" className="text-gray-700 font-semibold">
                      Business Description
                    </Label>
                    <Textarea
                      id="business_description"
                      name="business_description"
                      rows={3}
                      value={formData.business_description}
                      onChange={handleChange}
                      placeholder="Describe your business..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_id" className="text-gray-700 font-semibold">
                      Business Category
                    </Label>
                    <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="business_phone" className="text-gray-700 font-semibold">
                        Business Phone
                      </Label>
                      <Input
                        id="business_phone"
                        name="business_phone"
                        type="tel"
                        value={formData.business_phone}
                        onChange={handleChange}
                        placeholder="Business phone number"
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
                      onClick={() => setActiveTab('details')}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
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
                      placeholder="Enter your business address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar_url" className="text-gray-700 font-semibold">
                      Business Logo URL
                    </Label>
                    <Input
                      id="avatar_url"
                      name="avatar_url"
                      type="url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      placeholder="https://example.com/logo.jpg"
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