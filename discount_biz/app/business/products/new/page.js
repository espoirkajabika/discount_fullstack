'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StorageImage } from '@/components/ui/storage-image';
import { getStorageUrl } from '@/lib/utils';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePriceChange = (e) => {
    // Allow only numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to two decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }
    
    setFormData({
      ...formData,
      price: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset image error
    setImageError('');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setImageError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setIsUploading(true);
    setImageError('');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/business/products/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      
      // Return the storage path rather than the full URL
      return data.path;
    } catch (err) {
      console.error('Error uploading image:', err);
      setImageError(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    // Reset error
    setError('');

    // Check required fields
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }

    // Validate price
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl && imageFile) {
          // If image upload failed but an image was selected, stop submission
          setIsSubmitting(false);
          return;
        }
      }

      // Create product
      const response = await fetch('/api/business/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          image_url: imageUrl,
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const data = await response.json();
      
      // Redirect to product details page
      router.push(`/business/products/${data.product.id}`);
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-0 h-auto"
          onClick={() => router.push('/business/products')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="required">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    className="mt-1"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="required">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handlePriceChange}
                    required
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 h-32"
                    placeholder="Describe your product"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Product Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  {imagePreview ? (
                    <div className="relative w-full">
                      {/* If it's a data URL (from file input) */}
                      {imagePreview.startsWith('data:') ? (
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="mx-auto max-h-48 max-w-full object-contain rounded"
                        />
                      ) : (
                        /* If it's a storage path or URL */
                        <StorageImage
                          path={imagePreview}
                          alt="Product preview"
                          className="mx-auto max-h-48 max-w-full object-contain rounded"
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 mx-auto block"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setFormData({
                            ...formData,
                            image_url: '',
                          });
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        Drag and drop or click to upload
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        JPEG, PNG, GIF up to 5MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload').click()}
                      >
                        Select Image
                      </Button>
                    </>
                  )}
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/jpeg, image/png, image/gif, image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {imageError && (
                  <p className="text-sm text-red-600 mt-1">{imageError}</p>
                )}
                
                <div>
                  <Label htmlFor="image_url">Image URL (Optional)</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a URL or upload an image above
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/business/products')}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
              >
                {(isSubmitting || isUploading) ? (
                  <>
                    <span className="animate-spin mr-2">⋮</span>
                    {isUploading ? 'Uploading...' : 'Creating...'}
                  </>
                ) : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}