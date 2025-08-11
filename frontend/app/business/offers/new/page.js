'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Tag,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Percent,
  DollarSign,
  ShoppingCart,
  Gift,
  Calendar,
  Info
} from 'lucide-react'

// Import API functions
import { createOffer } from '@/lib/offers'
import { getProducts } from '@/lib/products'

export default function CreateOfferPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProductId = searchParams.get('product_id')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_id: preselectedProductId || '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: '',
    expiry_date: '',
    max_claims: '',
    terms_conditions: '',
    // For minimum purchase offers
    minimum_purchase_amount: '',
    // For quantity discount offers
    minimum_quantity: '',
    // For BOGO offers
    buy_quantity: '',
    get_quantity: '',
    get_discount_percentage: '100'
  })
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Set default start date to today
  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 7) // Default to 1 week from now
    
    setFormData(prev => ({
      ...prev,
      start_date: today.toISOString().split('T')[0],
      expiry_date: tomorrow.toISOString().split('T')[0]
    }))
  }, [])

  const fetchProducts = async () => {
    try {
      const result = await getProducts({ page: 1, limit: 100 })
      if (result.success) {
        setProducts(result.products || [])
      } else {
        console.error('Failed to fetch products:', result.error)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
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

  const handleDiscountTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      discount_type: value,
      // Reset type-specific fields
      minimum_purchase_amount: '',
      minimum_quantity: '',
      buy_quantity: '',
      get_quantity: '',
      get_discount_percentage: value === 'bogo' ? '100' : ''
    }))
  }

  const validateForm = () => {
    const requiredFields = ['product_id', 'discount_type', 'start_date', 'expiry_date']
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field.replace('_', ' ')} is required`)
        return false
      }
    }

    // Validate dates
    const startDate = new Date(formData.start_date)
    const expiryDate = new Date(formData.expiry_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      setError('Start date cannot be in the past')
      return false
    }

    if (expiryDate <= startDate) {
      setError('Expiry date must be after start date')
      return false
    }

    // Validate discount type specific fields
    if (formData.discount_type === 'percentage' || formData.discount_type === 'fixed') {
      if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
        setError('Discount value must be greater than 0')
        return false
      }
      if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
        setError('Percentage discount cannot exceed 100%')
        return false
      }
    }

    if (formData.discount_type === 'minimum_purchase') {
      if (!formData.discount_value || !formData.minimum_purchase_amount) {
        setError('Discount value and minimum purchase amount are required')
        return false
      }
      if (parseFloat(formData.minimum_purchase_amount) <= 0) {
        setError('Minimum purchase amount must be greater than 0')
        return false
      }
    }

    if (formData.discount_type === 'quantity_discount') {
      if (!formData.discount_value || !formData.minimum_quantity) {
        setError('Discount value and minimum quantity are required')
        return false
      }
      if (parseInt(formData.minimum_quantity) <= 0) {
        setError('Minimum quantity must be greater than 0')
        return false
      }
    }

    if (formData.discount_type === 'bogo') {
      if (!formData.buy_quantity || !formData.get_quantity || !formData.get_discount_percentage) {
        setError('Buy quantity, get quantity, and discount percentage are required for BOGO offers')
        return false
      }
      if (parseInt(formData.buy_quantity) <= 0 || parseInt(formData.get_quantity) <= 0) {
        setError('Buy and get quantities must be greater than 0')
        return false
      }
      if (parseFloat(formData.get_discount_percentage) <= 0 || parseFloat(formData.get_discount_percentage) > 100) {
        setError('Discount percentage must be between 1 and 100')
        return false
      }
    }

    if (formData.max_claims && parseInt(formData.max_claims) <= 0) {
      setError('Maximum claims must be greater than 0')
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
      // Prepare offer data
      const offerData = {
        title: formData.title.trim() || undefined,
        description: formData.description.trim() || undefined,
        product_id: formData.product_id,
        discount_type: formData.discount_type,
        start_date: formData.start_date,
        expiry_date: formData.expiry_date,
        max_claims: formData.max_claims ? parseInt(formData.max_claims) : undefined,
        terms_conditions: formData.terms_conditions.trim() || undefined,
        is_active: true
      }

      // Add type-specific fields
      if (formData.discount_type === 'percentage' || formData.discount_type === 'fixed') {
        offerData.discount_value = parseFloat(formData.discount_value)
      }

      if (formData.discount_type === 'minimum_purchase') {
        offerData.discount_value = parseFloat(formData.discount_value)
        offerData.minimum_purchase_amount = parseFloat(formData.minimum_purchase_amount)
      }

      if (formData.discount_type === 'quantity_discount') {
        offerData.discount_value = parseFloat(formData.discount_value)
        offerData.minimum_quantity = parseInt(formData.minimum_quantity)
      }

      if (formData.discount_type === 'bogo') {
        offerData.buy_quantity = parseInt(formData.buy_quantity)
        offerData.get_quantity = parseInt(formData.get_quantity)
        offerData.get_discount_percentage = parseFloat(formData.get_discount_percentage)
      }

      console.log('Creating offer with data:', offerData)

      const result = await createOffer(offerData)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/business/offers')
        }, 2000)
      } else {
        setError(result.error || 'Failed to create offer')
      }
    } catch (error) {
      console.error('Error creating offer:', error)
      setError('An error occurred while creating the offer')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id === formData.product_id)

  const getDiscountPreview = () => {
    if (!selectedProduct || !formData.discount_type) return null

    const price = parseFloat(selectedProduct.price) || 0
    
    switch (formData.discount_type) {
      case 'percentage':
        if (formData.discount_value) {
          const discount = (price * parseFloat(formData.discount_value)) / 100
          return `Save $${discount.toFixed(2)} (${formData.discount_value}% off $${price.toFixed(2)})`
        }
        break
      case 'fixed':
        if (formData.discount_value) {
          return `Save $${formData.discount_value} (was $${price.toFixed(2)})`
        }
        break
      case 'minimum_purchase':
        if (formData.discount_value && formData.minimum_purchase_amount) {
          return `Save $${formData.discount_value} on orders over $${formData.minimum_purchase_amount}`
        }
        break
      case 'quantity_discount':
        if (formData.discount_value && formData.minimum_quantity) {
          return `Buy ${formData.minimum_quantity}+ items, get ${formData.discount_value}% off each`
        }
        break
      case 'bogo':
        if (formData.buy_quantity && formData.get_quantity && formData.get_discount_percentage) {
          const discountText = formData.get_discount_percentage === '100' ? 'FREE' : `${formData.get_discount_percentage}% off`
          return `Buy ${formData.buy_quantity}, get ${formData.get_quantity} ${discountText}`
        }
        break
    }
    return null
  }

  if (!user || !user.is_business) {
    return null // BusinessLayout will handle the redirect
  }

  return (
    <BusinessLayout
      title="Create Offer"
      subtitle="Create a promotional offer for your products"
      activeTab="offers"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-6 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offers
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#e94e1b]" />
                  Offer Details
                </CardTitle>
                <CardDescription>
                  Configure your promotional offer
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
                      Offer created successfully! Redirecting to offers page...
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product_id" className="text-sm font-medium text-gray-700">
                        Product *
                      </Label>
                      <Select 
                        value={formData.product_id} 
                        onValueChange={(value) => handleSelectChange('product_id', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a product for this offer" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} {product.price && `- $${parseFloat(product.price).toFixed(2)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                        Offer Title (Optional)
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Leave blank to auto-generate"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        If left blank, we'll create a title based on your discount type
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your offer..."
                        rows={3}
                        className="mt-1 resize-none"
                      />
                    </div>
                  </div>

                  {/* Discount Configuration */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Discount Type *
                      </Label>
                      <Tabs value={formData.discount_type} onValueChange={handleDiscountTypeChange}>
                        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
                          <TabsTrigger value="percentage" className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Percentage
                          </TabsTrigger>
                          <TabsTrigger value="fixed" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Fixed Amount
                          </TabsTrigger>
                          <TabsTrigger value="minimum_purchase" className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Min Purchase
                          </TabsTrigger>
                          <TabsTrigger value="quantity_discount" className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Bulk Discount
                          </TabsTrigger>
                          <TabsTrigger value="bogo" className="flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            BOGO
                          </TabsTrigger>
                        </TabsList>

                        {/* Percentage Discount */}
                        <TabsContent value="percentage" className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="discount_value" className="text-sm font-medium text-gray-700">
                              Discount Percentage *
                            </Label>
                            <div className="relative">
                              <Input
                                id="discount_value"
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.discount_value}
                                onChange={handleInputChange}
                                placeholder="20"
                                className="pr-8 mt-1"
                              />
                              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            </div>
                          </div>
                        </TabsContent>

                        {/* Fixed Amount Discount */}
                        <TabsContent value="fixed" className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="discount_value" className="text-sm font-medium text-gray-700">
                              Discount Amount *
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                id="discount_value"
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.discount_value}
                                onChange={handleInputChange}
                                placeholder="10.00"
                                className="pl-10 mt-1"
                              />
                            </div>
                          </div>
                        </TabsContent>

                        {/* Minimum Purchase Discount */}
                        <TabsContent value="minimum_purchase" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="discount_value" className="text-sm font-medium text-gray-700">
                                Discount Amount *
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  id="discount_value"
                                  name="discount_value"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.discount_value}
                                  onChange={handleInputChange}
                                  placeholder="5.00"
                                  className="pl-10 mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="minimum_purchase_amount" className="text-sm font-medium text-gray-700">
                                Minimum Purchase *
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  id="minimum_purchase_amount"
                                  name="minimum_purchase_amount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={formData.minimum_purchase_amount}
                                  onChange={handleInputChange}
                                  placeholder="50.00"
                                  className="pl-10 mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Quantity Discount */}
                        <TabsContent value="quantity_discount" className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="minimum_quantity" className="text-sm font-medium text-gray-700">
                                Minimum Quantity *
                              </Label>
                              <Input
                                id="minimum_quantity"
                                name="minimum_quantity"
                                type="number"
                                min="1"
                                value={formData.minimum_quantity}
                                onChange={handleInputChange}
                                placeholder="3"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="discount_value" className="text-sm font-medium text-gray-700">
                                Discount Percentage *
                              </Label>
                              <div className="relative">
                                <Input
                                  id="discount_value"
                                  name="discount_value"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={formData.discount_value}
                                  onChange={handleInputChange}
                                  placeholder="15"
                                  className="pr-8 mt-1"
                                />
                                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* BOGO Discount */}
                        <TabsContent value="bogo" className="space-y-4 mt-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="buy_quantity" className="text-sm font-medium text-gray-700">
                                Buy Quantity *
                              </Label>
                              <Input
                                id="buy_quantity"
                                name="buy_quantity"
                                type="number"
                                min="1"
                                value={formData.buy_quantity}
                                onChange={handleInputChange}
                                placeholder="2"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="get_quantity" className="text-sm font-medium text-gray-700">
                                Get Quantity *
                              </Label>
                              <Input
                                id="get_quantity"
                                name="get_quantity"
                                type="number"
                                min="1"
                                value={formData.get_quantity}
                                onChange={handleInputChange}
                                placeholder="1"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="get_discount_percentage" className="text-sm font-medium text-gray-700">
                                Get Discount % *
                              </Label>
                              <div className="relative">
                                <Input
                                  id="get_discount_percentage"
                                  name="get_discount_percentage"
                                  type="number"
                                  step="0.01"
                                  min="1"
                                  max="100"
                                  value={formData.get_discount_percentage}
                                  onChange={handleInputChange}
                                  placeholder="100"
                                  className="pr-8 mt-1"
                                />
                                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            100% = Free, 50% = Half price, etc.
                          </p>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>

                  {/* Dates and Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
                        Start Date *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="start_date"
                          name="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          className="pl-10 mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="expiry_date" className="text-sm font-medium text-gray-700">
                        End Date *
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="expiry_date"
                          name="expiry_date"
                          type="date"
                          value={formData.expiry_date}
                          onChange={handleInputChange}
                          className="pl-10 mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="max_claims" className="text-sm font-medium text-gray-700">
                        Maximum Claims (Optional)
                      </Label>
                      <Input
                        id="max_claims"
                        name="max_claims"
                        type="number"
                        min="1"
                        value={formData.max_claims}
                        onChange={handleInputChange}
                        placeholder="Unlimited"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div>
                    <Label htmlFor="terms_conditions" className="text-sm font-medium text-gray-700">
                      Terms & Conditions (Optional)
                    </Label>
                    <Textarea
                      id="terms_conditions"
                      name="terms_conditions"
                      value={formData.terms_conditions}
                      onChange={handleInputChange}
                      placeholder="Enter any terms and conditions for this offer..."
                      rows={3}
                      className="mt-1 resize-none"
                    />
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
                      disabled={loading || !formData.product_id}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Offer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-0 shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-[#e94e1b]" />
                  Offer Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProduct ? (
                  <div className="space-y-4">
                    {/* Product Info */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {selectedProduct.name}
                      </h4>
                      {selectedProduct.price && (
                        <p className="text-sm text-gray-600">
                          Original Price: ${parseFloat(selectedProduct.price).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Discount Preview */}
                    {getDiscountPreview() && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-1">
                          Savings Preview
                        </h5>
                        <p className="text-sm text-green-700">
                          {getDiscountPreview()}
                        </p>
                      </div>
                    )}

                    {/* Offer Duration */}
                    {formData.start_date && formData.expiry_date && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-1">
                          Offer Duration
                        </h5>
                        <p className="text-sm text-blue-700">
                          {new Date(formData.start_date).toLocaleDateString()} - {new Date(formData.expiry_date).toLocaleDateString()}
                        </p>
                        {formData.max_claims && (
                          <p className="text-sm text-blue-700 mt-1">
                            Limited to {formData.max_claims} claims
                          </p>
                        )}
                      </div>
                    )}

                    {/* Discount Type Info */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">
                        Discount Type: {formData.discount_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                      <div className="text-xs text-gray-600 space-y-1">
                        {formData.discount_type === 'percentage' && (
                          <p>Customer gets a percentage off the product price</p>
                        )}
                        {formData.discount_type === 'fixed' && (
                          <p>Customer gets a fixed dollar amount off</p>
                        )}
                        {formData.discount_type === 'minimum_purchase' && (
                          <p>Discount applies when minimum purchase amount is met</p>
                        )}
                        {formData.discount_type === 'quantity_discount' && (
                          <p>Bulk discount when buying multiple items</p>
                        )}
                        {formData.discount_type === 'bogo' && (
                          <p>Buy specified quantity, get additional items at discount</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Select a product to see offer preview
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BusinessLayout>
  )
}