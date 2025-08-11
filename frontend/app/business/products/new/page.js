'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ShoppingBag,
  Upload,
  X,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  FileImage
} from 'lucide-react'

// Import API functions
import { createProduct, getCategories, uploadProductImage } from '@/lib/products'

export default function CreateProductPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    sku: '',
    tags: '',
    image_url: '',
    is_active: true
  })
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const result = await getCategories()
      if (result.success) {
        setCategories(result.categories || [])
      } else {
        console.error('Failed to fetch categories:', result.error)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }

      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      setError(null)
    }
  }

  const uploadImage = async () => {
    if (!imageFile) return null

    setImageUploading(true)
    try {
      const result = await uploadProductImage(imageFile)
      if (result.success) {
        return result.path || result.url
      } else {
        setError('Failed to upload image: ' + result.error)
        return null
      }
    } catch (error) {
      setError('Error uploading image')
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required')
      return false
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      setError('Please enter a valid price')
      return false
    }

    if (formData.stock_quantity && isNaN(parseInt(formData.stock_quantity))) {
      setError('Please enter a valid stock quantity')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Upload image first if selected
      let imagePath = formData.image_url
      if (imageFile) {
        imagePath = await uploadImage()
        if (!imagePath) {
          setLoading(false)
          return
        }
      }

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id && formData.category_id !== 'none' ? formData.category_id : null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        sku: formData.sku.trim() || null,
        tags: formData.tags.trim() || null,
        image_url: imagePath || null,
        is_active: formData.is_active
      }

      console.log('Creating product with data:', productData)

      const result = await createProduct(productData)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/business/products')
        }, 2000)
      } else {
        setError(result.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      setError('An error occurred while creating the product')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !user.is_business) {
    return null // BusinessLayout will handle the redirect
  }

  return (
    <BusinessLayout
      title="Create Product"
      subtitle="Add a new product to your catalog"
      activeTab="products"
    >
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-6 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <Card className="bg-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#e94e1b]" />
              Product Information
            </CardTitle>
            <CardDescription>
              Enter the details for your new product
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Product created successfully! Redirecting to products page...
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                  Product Image
                </Label>
                
                {imagePreview ? (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label htmlFor="image" className="cursor-pointer">
                      <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload product image
                      </p>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG, GIF or WebP (Max 5MB)
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                    Price
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="pl-10 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="stock_quantity" className="text-sm font-medium text-gray-700">
                    Stock Quantity
                  </Label>
                  <Input
                    id="stock_quantity"
                    name="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="Available quantity"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category_id" className="text-sm font-medium text-gray-700">
                    Category
                  </Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => handleSelectChange('category_id', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sku" className="text-sm font-medium text-gray-700">
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Product SKU"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product..."
                  rows={4}
                  className="mt-1 resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                  Tags
                </Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="tag1, tag2, tag3"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate tags with commas
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#e94e1b] hover:bg-[#d13f16] text-white"
                  disabled={loading || imageUploading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
}