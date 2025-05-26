'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/lib/auth';
import {
  AlertCircle,
  Upload,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Twitter,
} from 'lucide-react';

// Business hours component (will create separately)
import BusinessHours from '../../_components/BusinessHours';

export default function BusinessSettingsPage() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState({
    business_name: '',
    email: '',
    phone_number: '',
    business_website: '',
    business_address: '',
    business_description: '',
    social_media_links: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
    business_hours: null, // We'll add this to the database
  });

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch business profile data
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const sessionData = await getSession();

        if (!sessionData.authenticated) {
          console.log('Session not authenticated, redirecting to login');
          // Add a small delay to ensure the message is displayed before redirect
          setError('Your session has expired. Redirecting to login...');
          setTimeout(() => {
            router.push('/business/auth/login');
          }, 1500);
          return;
        }

        if (sessionData.error) {
          console.error('Session error:', sessionData.error);
          setError(`Authentication error: ${sessionData.error}`);
          return;
        }

        setUser(sessionData.user);

        if (sessionData.business) {
          // Format the data to match the state structure
          const business = sessionData.business;
          
          setBusinessData({
            business_name: business.business_name || '',
            email: business.email || (sessionData.user ? sessionData.user.email : ''),
            phone_number: business.phone_number || '',
            business_website: business.business_website || '',
            business_address: business.business_address || '',
            business_description: business.business_description || '',
            social_media_links: business.social_media_links || {
              facebook: '',
              instagram: '',
              twitter: '',
            },
            business_hours: business.business_hours || null,
            avatar: business.avatar || '',
          });

          if (business.avatar) {
            setAvatarPreview(business.avatar);
          }
        } else {
          console.warn('No business data found in session');
          setError('Your business profile could not be loaded. Please try refreshing the page.');
        }
      } catch (err) {
        console.error('Error fetching business profile:', err);
        setError(`Failed to load business profile: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfile();
  }, [router]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (social media links)
      const [parent, child] = name.split('.');
      setBusinessData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setBusinessData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle avatar/logo upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset any errors
    setError('');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setError('Image size must be less than 2MB');
      return;
    }

    setAvatarFile(file);

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload avatar to storage
  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    try {
      const formData = new FormData();
      formData.append('image', avatarFile);

      console.log("Uploading avatar:", avatarFile.name, avatarFile.type, avatarFile.size);

      const response = await fetch('/api/business/settings/upload-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      // First check if response exists
      if (!response) {
        throw new Error('Network error: No response received');
      }

      // Try to parse JSON, but handle cases where response isn't JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse server response');
      }

      // Then check response status
      if (!response.ok) {
        throw new Error(data?.error || `Server error: ${response.status}`);
      }

      // Success - log the result and return URL
      console.log("Avatar upload successful:", data);
      return data.url; // Return the avatar URL
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(`Avatar upload failed: ${err.message}`);
      return null;
    }
  };

  // Handle business hours update
  const handleHoursUpdate = (updatedHours) => {
    setBusinessData((prev) => ({
      ...prev,
      business_hours: updatedHours,
    }));
  };

  // Form validation
  const validateForm = () => {
    // Reset errors
    setError('');

    // Required fields check
    if (!businessData.business_name?.trim()) {
      setError('Business name is required');
      setActiveTab('profile');
      return false;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (businessData.email && !emailPattern.test(businessData.email)) {
      setError('Please enter a valid email address');
      setActiveTab('profile');
      return false;
    }

    // Website validation (if provided)
    if (
      businessData.business_website &&
      !businessData.business_website.match(/^(https?:\/\/)?([\w\-])+\.([a-z]{2,})(\/.*)*$/i)
    ) {
      setError('Please enter a valid website URL');
      setActiveTab('profile');
      return false;
    }

    // Social media URL validation (if provided)
    const urlPattern = /^(https?:\/\/)?([\w\-])+\.([a-z]{2,})(\/.*)*$/i;
    
    if (businessData.social_media_links?.facebook && !urlPattern.test(businessData.social_media_links.facebook)) {
      setError('Please enter a valid Facebook URL');
      setActiveTab('social');
      return false;
    }
    
    if (businessData.social_media_links?.instagram && !urlPattern.test(businessData.social_media_links.instagram)) {
      setError('Please enter a valid Instagram URL');
      setActiveTab('social');
      return false;
    }
    
    if (businessData.social_media_links?.twitter && !urlPattern.test(businessData.social_media_links.twitter)) {
      setError('Please enter a valid Twitter URL');
      setActiveTab('social');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Upload avatar if a new one is selected
      let avatarUrl = businessData.avatar;
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar();
          if (!avatarUrl && avatarFile) {
            console.warn("Avatar upload returned no URL, but didn't throw an error");
            setError("Unable to upload avatar image. Profile update canceled.");
            setIsSaving(false);
            return; // Stop if avatar upload failed silently
          }
        } catch (uploadError) {
          console.error("Avatar upload error:", uploadError);
          setError(`Avatar upload failed: ${uploadError.message || "Unknown error"}`);
          setIsSaving(false);
          return; // Stop if avatar upload failed with error
        }
      }

      // Prepare the data for submission
      const updatedBusinessData = {
        ...businessData,
        avatar: avatarUrl,
      };

      // Update business profile via API
      const response = await fetch('/api/business/settings/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBusinessData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update business profile');
      }

      // Get the updated business data
      const data = await response.json();

      // Update state with new data
      setBusinessData({
        ...data.business,
        social_media_links: data.business.social_media_links || {
          facebook: '',
          instagram: '',
          twitter: '',
        },
      });

      // Clear avatar file state after successful upload
      setAvatarFile(null);

      // Show success message
      setSuccessMessage('Business profile updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating business profile:', err);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Business Settings</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Business Settings</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/business/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile">Business Profile</TabsTrigger>
            <TabsTrigger value="contact">Contact & Location</TabsTrigger>
            <TabsTrigger value="social">Social Media & Hours</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>
                  Manage your business's basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <Label htmlFor="avatar">Business Logo</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Business logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Building className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload').click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/jpeg, image/png, image/gif, image/webp"
                        onChange={handleAvatarChange}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Recommended size: 512x512px. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="business_name" className="required">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        id="business_name"
                        name="business_name"
                        value={businessData.business_name}
                        onChange={handleChange}
                        placeholder="Your Business Name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email">Business Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={businessData.email}
                        onChange={handleChange}
                        placeholder="contact@yourbusiness.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="business_description">Business Description</Label>
                    <Textarea
                      id="business_description"
                      name="business_description"
                      value={businessData.business_description || ''}
                      onChange={handleChange}
                      placeholder="Tell customers about your business..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be displayed on your business profile
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact & Location Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact & Location</CardTitle>
                <CardDescription>
                  Manage your contact details and location information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        id="phone_number"
                        name="phone_number"
                        value={businessData.phone_number || ''}
                        onChange={handleChange}
                        placeholder="+1 (123) 456-7890"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="business_website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        id="business_website"
                        name="business_website"
                        value={businessData.business_website || ''}
                        onChange={handleChange}
                        placeholder="https://yourbusiness.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="business_address">Business Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                      <Textarea
                        id="business_address"
                        name="business_address"
                        value={businessData.business_address || ''}
                        onChange={handleChange}
                        placeholder="123 Business St, City, State, ZIP"
                        className="pl-10 pt-2"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media & Hours Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Social Media & Business Hours</CardTitle>
                <CardDescription>
                  Connect your social profiles and set your business hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Social Media Links</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="social_media_links.facebook">Facebook</Label>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="social_media_links.facebook"
                          name="social_media_links.facebook"
                          value={businessData.social_media_links?.facebook || ''}
                          onChange={handleChange}
                          placeholder="https://facebook.com/yourbusiness"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="social_media_links.instagram">Instagram</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="social_media_links.instagram"
                          name="social_media_links.instagram"
                          value={businessData.social_media_links?.instagram || ''}
                          onChange={handleChange}
                          placeholder="https://instagram.com/yourbusiness"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="social_media_links.twitter">Twitter</Label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="social_media_links.twitter"
                          name="social_media_links.twitter"
                          value={businessData.social_media_links?.twitter || ''}
                          onChange={handleChange}
                          placeholder="https://twitter.com/yourbusiness"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="font-medium mb-4">Business Hours</h3>
                    {/* The BusinessHours component will be created separately */}
                    <BusinessHours 
                      hours={businessData.business_hours} 
                      onUpdate={handleHoursUpdate} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => router.push('/business/dashboard')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}