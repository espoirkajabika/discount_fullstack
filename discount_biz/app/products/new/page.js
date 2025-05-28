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
import { 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  X, 
  Building2,
  Home,
  Package,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Tag,
  Save,
  Plus
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Page components
function PageContainer({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 ${className}`}>
      {children}
    </div>
  );
}

function PageHeader({ 
  title, 
  subtitle, 
  backButton = true, 
  backUrl = null,
  backLabel = "Back",
  children 
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top navigation bar with logo */}
        <div className="flex items-center justify-between h-16 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => router.push('/products')}
                className="text-gray-500 hover:text-green-600 transition-colors"
              >
                Products
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Add New</span>
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-green-600"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Page header */}
        <div className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              {backButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex-shrink-0 -ml-2 text-gray-600 hover:text-green-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {backLabel}
                </Button>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>

            {children && (
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentContainer({ children, className = "" }) {
  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

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
    
    // Clear error when user starts typing
    if (error) setError('');
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
    
    if (error) setError('');
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

  // Calculate form progress for preview
  const calculateProgress = () => {
    let completedFields = 0;
    const totalFields = 4; // name, price, description, image

    if (formData.name.trim()) completedFields++;
    if (formData.price && parseFloat(formData.price) > 0) completedFields++;
    if (formData.description.trim()) completedFields++;
    if (imageFile || formData.image_url) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const progress = calculateProgress();

  return (
    <PageContainer>
      <PageHeader
        title="Add New Product"
        subtitle="Create a new product for your business catalog"
        backUrl="/products"
        backLabel="Back to Products"
      />

      <ContentContainer>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <Package className="h-5 w-5 mr-2 text-green-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 font-semibold">
                      Product Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      maxLength={200}
                      className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-gray-700 font-semibold">
                      Price *
                    </Label>
                    <div className="relative mt-2">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handlePriceChange}
                        required
                        className="h-12 pl-10 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category_id" className="text-gray-700 font-semibold">
                      Category (Optional)
                    </Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={handleCategoryChange}
                      disabled={isCategoriesLoading}
                    >
                      <SelectTrigger className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Select a category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {isCategoriesLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent mr-2"></div>
                            Loading categories...
                          </div>
                        ) : categories.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            No categories available
                          </div>
                        ) : (
                          categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center space-x-2">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Product Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="description" className="text-gray-700 font-semibold">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-2 h-32 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                      placeholder="Describe your product features, benefits, and details..."
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.description.length}/1000 characters
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Image */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-900">
                    <ImageIcon className="h-5 w-5 mr-2 text-green-600" />
                    Product Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-700 font-semibold">Upload Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-2 flex flex-col items-center justify-center hover:border-green-400 transition-colors">
                      {imagePreview ? (
                        <div className="relative w-full">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="mx-auto max-h-64 max-w-full object-contain rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-4 mx-auto block border-red-200 text-red-600 hover:bg-red-50"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Upload className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="text-gray-700 font-medium mb-2">
                            Drag and drop or click to upload
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            JPEG, PNG, GIF, WEBP up to 5MB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('image-upload').click()}
                            className="border-green-200 text-green-600 hover:bg-green-50"
                          >
                            <Upload className="h-4 w-4 mr-2" />
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
                      <Alert variant="destructive" className="mt-2 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">{imageError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="image_url" className="text-gray-700 font-semibold">
                      Or Image URL (Optional)
                    </Label>
                    <Input
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="mt-2 h-12 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      disabled={!!imageFile}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Provide a URL or upload an image above
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Progress Card */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-gray-900">
                      <Tag className="h-5 w-5 mr-2 text-green-600" />
                      Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completion</span>
                        <span className="text-sm font-medium text-gray-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Product Name</span>
                          <span className={formData.name.trim() ? "text-green-600" : "text-gray-400"}>
                            {formData.name.trim() ? "✓" : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Price</span>
                          <span className={formData.price && parseFloat(formData.price) > 0 ? "text-green-600" : "text-gray-400"}>
                            {formData.price && parseFloat(formData.price) > 0 ? "✓" : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Description</span>
                          <span className={formData.description.trim() ? "text-green-600" : "text-gray-400"}>
                            {formData.description.trim() ? "✓" : "○"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Image</span>
                          <span className={imageFile || formData.image_url ? "text-green-600" : "text-gray-400"}>
                            {imageFile || formData.image_url ? "✓" : "○"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Preview */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-gray-900">
                      <Package className="h-5 w-5 mr-2 text-green-600" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Image preview */}
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                        ) : formData.image_url ? (
                          <img
                            src={formData.image_url}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No image</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Product details */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {formData.name || 'Product Name'}
                          </h3>
                          {formData.price && (
                            <p className="text-xl font-bold text-green-600">
                              ${parseFloat(formData.price).toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        {formData.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {formData.description}
                          </p>
                        )}
                        
                        {formData.category_id && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Tag className="h-3 w-3 mr-1" />
                            {categories.find(c => c.id === formData.category_id)?.name || 'Category'}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isUploading || !formData.name.trim() || !formData.price}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSubmitting || isUploading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>{isUploading ? 'Uploading...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Product
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/products')}
                    disabled={isSubmitting || isUploading}
                    className="w-full h-12 border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  
                  {formData.name.trim() && formData.price && parseFloat(formData.price) > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // This would create the product and then redirect to create offer
                          // For now, just show it's available
                        }}
                        disabled={isSubmitting || isUploading}
                        className="w-full h-10 text-sm border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create & Add Offer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </ContentContainer>
    </PageContainer>
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