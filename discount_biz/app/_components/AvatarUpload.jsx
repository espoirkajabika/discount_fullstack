'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/CustomerAuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { StorageImage } from '@/components/ui/storage-image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";

// Icons
import { 
  UserCircle2, 
  Upload, 
  Trash2, 
  Camera, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function AvatarUpload() {
  const { customer, updateAvatar, isInitialized } = useAuth();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('Image size must be less than 2MB');
      return;
    }
    
    // Reset states
    setError('');
    setSuccess('');
    setIsUploading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      
      // Call the API
      const response = await fetch('/api/customer/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }
      
      // Update avatar in auth context
      await updateAvatar(data.path);
      
      // Complete progress and show success
      setUploadProgress(100);
      setSuccess('Avatar updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Remove avatar
  const handleRemoveAvatar = async () => {
    setError('');
    setSuccess('');
    setIsUploading(true);
    
    try {
      // Update avatar to null in auth context
      await updateAvatar(null);
      
      setSuccess('Avatar removed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Avatar removal error:', err);
      setError('Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = () => {
    if (!customer) return 'U';
    
    const firstInitial = customer.first_name?.[0]?.toUpperCase() || '';
    const lastInitial = customer.last_name?.[0]?.toUpperCase() || '';
    
    return firstInitial + lastInitial || customer.email?.[0]?.toUpperCase() || 'U';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>
          Upload a profile photo to personalize your account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center">
        {/* Success Message */}
        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200 mb-4 w-full">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-4 w-full">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Avatar Preview */}
        <div className="w-32 h-32 mb-4 relative">
          {isUploading ? (
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
              {uploadProgress > 0 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                  <div 
                    className="h-1 bg-blue-500"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <Avatar className="w-32 h-32 border-2 border-gray-200">
              {customer?.avatar ? (
                <StorageImage
                  path={customer.avatar}
                  alt="Profile"
                  fallbackSize="200x200"
                  className="w-full h-full object-cover"
                  emptyIcon={<UserCircle2 className="h-16 w-16 text-gray-300" />}
                />
              ) : (
                <>
                  <AvatarImage src="" alt="" />
                  <AvatarFallback className="text-3xl bg-blue-100 text-blue-600">
                    {getInitials()}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {/* Upload button */}
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {customer?.avatar ? 'Change Photo' : 'Upload Photo'}
          </Button>
          
          {customer?.avatar && (
            <Button 
              variant="outline" 
              onClick={handleRemoveAvatar}
              disabled={isUploading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <p className="text-xs text-gray-500 w-full text-center">
          Recommended: Square image, at least 200x200 pixels, less than 2MB
        </p>
      </CardFooter>
    </Card>
  );
}