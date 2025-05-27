'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, getCategories, uploadProductImage } from '@/lib/products';
import { BusinessRoute } from '@/components/ProtectedRoute';
import BusinessRegistrationCheck from '@/components/BusinessRegistrationCheck';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function NewProductContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category_id: '',
  });
  
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const result = await getCategories();
        
        if (result.error) {
          console.error('Error fetching categories:', result.error);
          // Continue without categories - they're optional
          setCategories([]);
        } else {
          setCategories(result.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    setFormData(prev => ({
      ...prev,
      price: value
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }));
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
      const result = await uploadProductImage(imageFile);
      
      if (result.error) {
        setImageError(result.error);
        return null;
      }

      // Return the storage path, not the full URL
      return result.path;
    } catch (err) {
      console.error('Error uploading image:', err);
      setImageError('Failed to upload image. Please try again.');
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
        const uploadedPath = await uploadImage();
        if (uploadedPath) {
          imageUrl = uploadedPath; // Store the path, not full URL
        } else if (imageFile) {
          // If image upload failed but an image was selected, stop submission
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        image_url: imageUrl || null,
        category_id: formData.category_id || null,
      };

      console.log('Creating product with data:', productData);

      const result = await createProduct(productData);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect to product details page
      router.push(`/products/${result.product.id}`);
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }));
    setImageError('');
    
    // Reset the file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2 p-0 h-auto"
          onClick={() => router.push('/products')}
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
                    maxLength={200}
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
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={handleCategoryChange}
                    disabled={isCategoriesLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {isCategoriesLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <span className="animate-spin mr-2">⋮</span>
                          Loading categories...
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="p-2 text-center text-sm text-gray-500">
                          No categories available
                        </div>
                      ) : (
                        categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                    maxLength={1000}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Product Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                  {imagePreview ? (
                    <div className="relative w-full">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="mx-auto max-h-48 max-w-full object-contain rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 mx-auto block"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4 mr-2" />
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
                        JPEG, PNG, GIF, WEBP up to 5MB
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
                  <Label htmlFor="image_url">Or Image URL (Optional)</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                    disabled={!!imageFile}
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
                onClick={() => router.push('/products')}
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

export default function NewProductPage() {
  return (
    <BusinessRoute>
      <BusinessRegistrationCheck>
        <NewProductContent />
      </BusinessRegistrationCheck>
    </BusinessRoute>
  );
}