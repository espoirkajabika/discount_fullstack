'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Tag,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Package,
  Eye,
  Calendar,
  DollarSign,
  Percent
} from 'lucide-react'

// Import API functions
import { getOffer, updateOffer } from '@/lib/offers'
import { getProducts } from '@/lib/products'

export default function EditOfferPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const offerId = params.id
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_id: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: '',
    expiry_date: '',
    max_claims: '',
    terms_conditions: '',
    minimum_purchase_amount: '',
    minimum_quantity: '',
    buy_quantity: '',
    get_quantity: '',
    get_discount_percentage: '100'
  })
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user && user.is_business && offerId) {
      fetchOfferAndProducts()
    }
  }, [user, offerId])

  const fetchOfferAndProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch offer details
      const offerResult = await getOffer(offerId)
      if (!offerResult.success) {
        setError(offerResult.error || 'Failed to fetch offer')
        return
      }
      
      // Fetch products for the dropdown
      const productsResult = await getProducts({ page: 1, limit: 100 })
      if (productsResult.success) {
        setProducts(productsResult.products || [])
      }
      
      // Populate form with offer data
      const offer = offerResult.offer
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        product_id: offer.product_id || '',
        discount_type: offer.discount_type || 'percentage',
        discount_value: offer.discount_value?.toString() || '',
        start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
        expiry_date: offer.expiry_date ? offer.expiry_date.split('T')[0] : '',
        max_claims: offer.max_claims?.toString() || '',
        terms_conditions: offer.terms_conditions || '',
        minimum_purchase_amount: offer.minimum_purchase_amount?.toString() || '',
        minimum_quantity: offer.minimum_quantity?.toString() || '',
        buy_quantity: offer.buy_quantity?.toString() || '',
        get_quantity: offer.get_quantity?.toString() || '',
        get_discount_percentage: offer.get_discount_percentage?.toString() || '100'
      })
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load offer data. Please try again.')
    } finally {
      setLoading(false)
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
      // Reset type-specific fields when changing type
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
    const startDate = new Date(formData.start_date + 'T00:00:00')
    const expiryDate = new Date(formData.expiry_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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

    setSaving(true)
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
        terms_conditions: formData.terms_conditions.trim() || undefined
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
        offerData.discount_value = 0 // BOGO offers don't use discount_value, but DB requires it
      }

      console.log('Updating offer with data:', offerData)

      const result = await updateOffer(offerId, offerData)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/business/offers/${offerId}`)
        }, 2000)
      } else {
        setError(result.error || 'Failed to update offer')
      }
    } catch (error) {
      console.error('Error updating offer:', error)
      setError('An error occurred while updating the offer')
    } finally {
      setSaving(false)
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
    return null
  }

  if (loading) {
    return (
      <BusinessLayout
        title="Loading Offer..."
        subtitle="Please wait while we load the offer details"
        activeTab="offers"
      >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
          <span className="ml-3 text-gray-600">Loading offer...</span>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout
      title="Edit Offer"
      subtitle="Update your promotional offer details"
      activeTab="offers"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => router.push(`/business/offers/${offerId}`)}
          className="mb-4 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offer
        </Button>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Form */}
          <div className="xl:col-span-3">
            <Card className="bg-[#1e3a5f] border-2 border-[#00a8e6] shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <Tag className="h-5 w-5 text-[#00a8e6]" />
                  Edit Offer Details
                </CardTitle>
                <CardDescription className="text-blue-200 text-sm">
                  Update your promotional offer configuration
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-400 bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-400 bg-green-900/20">
                    <AlertCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      Offer updated successfully! Redirecting to offer details...
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Top Row: Product + Title + Description */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white font-medium text-sm">Product *</Label>
                      <Select 
                        value={formData.product_id} 
                        onValueChange={(value) => handleSelectChange('product_id', value)}
                      >
                        <SelectTrigger className="bg-[#1e3a5f] border-white/20 text-white h-10">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} className="text-gray-900 hover:bg-gray-100">
                              {product.name} {product.price && `- $${parseFloat(product.price).toFixed(2)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white font-medium text-sm">Offer Title (Optional)</Label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Auto-generated if blank"
                        className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white font-medium text-sm">Description</Label>
                      <Input
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief description"
                        className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 h-10"
                      />
                    </div>
                  </div>

                  {/* Discount Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-white font-medium text-sm">Discount Type *</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'percentage', label: 'Percentage', icon: Percent },
                        { value: 'fixed', label: 'Fixed Amount', icon: DollarSign },
                        { value: 'minimum_purchase', label: 'Min Purchase', icon: DollarSign },
                        { value: 'quantity_discount', label: 'Bulk Discount', icon: Package },
                        { value: 'bogo', label: 'BOGO', icon: Package }
                      ].map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          onClick={() => handleDiscountTypeChange(type.value)}
                          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                            formData.discount_type === type.value 
                              ? 'bg-[#00a8e6] text-white shadow-lg border-2 border-[#00a8e6]' 
                              : 'bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40'
                          }`}
                        >
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </Button>
                      ))}
                    </div>

                    {/* Dynamic Discount Configuration */}
                    <div className="mt-4 p-4 bg-white/5 rounded-lg">
                      {formData.discount_type === 'percentage' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Discount Percentage *</Label>
                            <div className="relative">
                              <Input
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.discount_value}
                                onChange={handleInputChange}
                                placeholder="20"
                                className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 pr-10 h-10"
                              />
                              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.discount_type === 'fixed' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Discount Amount *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.discount_value}
                                onChange={handleInputChange}
                                placeholder="10.00"
                                className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 pl-10 h-10"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.discount_type === 'minimum_purchase' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Discount Amount *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.discount_value}
                                onChange={handleInputChange}
                                placeholder="5.00"
                                className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 pl-10 h-10"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Minimum Purchase *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                name="minimum_purchase_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.minimum_purchase_amount}
                                onChange={handleInputChange}
                                placeholder="50.00"
                                className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 pl-10 h-10"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.discount_type === 'quantity_discount' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Minimum Quantity *</Label>
                            <Input
                              name="minimum_quantity"
                              type="number"
                              min="1"
                              value={formData.minimum_quantity}
                              onChange={handleInputChange}
                              placeholder="3"
                              className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Discount Percentage *</Label>
                            <div className="relative">
                              <Input
                                name="discount_value"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.discount_value}
                                onChange={handleInputChange}
                                placeholder="15"
                                className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 pr-10 h-10"
                              />
                              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.discount_type === 'bogo' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Buy Quantity *</Label>
                            <Input
                              name="buy_quantity"
                              type="number"
                              min="1"
                              value={formData.buy_quantity}
                              onChange={handleInputChange}
                              placeholder="2"
                              className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Get Quantity *</Label>
                            <Input
                              name="get_quantity"
                              type="number"
                              min="1"
                              value={formData.get_quantity}
                              onChange={handleInputChange}
                              placeholder="1"
                              className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white font-medium text-sm">Get Discount % *</Label>
                            <div className="relative">
                              <Input
                                name="get_discount_percentage"
                                type="number"
                                step="0.01"
                                min="1"
                                max="100"
                                value={formData.get_discount_percentage}
                                onChange={handleInputChange}
                                placeholder="100"
                                className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 pr-10 h-10"
                              />
                              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date and Claims Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white font-medium text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Start Date *
                      </Label>
                      <Input
                        name="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="bg-[#1e3a5f] border-white/20 text-white h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white font-medium text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        End Date *
                      </Label>
                      <Input
                        name="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={handleInputChange}
                        className="bg-[#1e3a5f] border-white/20 text-white h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white font-medium text-sm">Maximum Claims (Optional)</Label>
                      <Input
                        name="max_claims"
                        type="number"
                        min="1"
                        value={formData.max_claims}
                        onChange={handleInputChange}
                        placeholder="Unlimited"
                        className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 h-10"
                      />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-2">
                    <Label className="text-white font-medium text-sm">Terms & Conditions (Optional)</Label>
                    <Textarea
                      name="terms_conditions"
                      value={formData.terms_conditions}
                      onChange={handleInputChange}
                      placeholder="Enter any terms and conditions for this offer..."
                      rows={3}
                      className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/business/offers/${offerId}`)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10 h-11"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#e94e1b] hover:bg-[#d13f16] text-white h-11"
                      disabled={saving || !formData.product_id}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Offer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="xl:col-span-1">
            <Card className="bg-[#1e3a5f] border-2 border-[#00a8e6] shadow-lg sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Eye className="h-5 w-5 text-[#00a8e6]" />
                  Offer Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProduct ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <h4 className="font-medium text-white mb-1 text-sm">
                        {selectedProduct.name}
                      </h4>
                      {selectedProduct.price && (
                        <p className="text-xs text-blue-200">
                          Original Price: ${parseFloat(selectedProduct.price).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {getDiscountPreview() && (
                      <div className="p-3 bg-green-900/20 border border-green-400 rounded-lg">
                        <h5 className="font-medium text-green-300 mb-1 text-sm flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Savings Preview
                        </h5>
                        <p className="text-xs text-green-200">
                          {getDiscountPreview()}
                        </p>
                      </div>
                    )}

                    {formData.start_date && formData.expiry_date && (
                      <div className="p-3 bg-blue-900/20 border border-blue-400 rounded-lg">
                        <h5 className="font-medium text-blue-300 mb-1 text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Offer Duration
                        </h5>
                        <p className="text-xs text-blue-200">
                          {new Date(formData.start_date).toLocaleDateString()} - {new Date(formData.expiry_date).toLocaleDateString()}
                        </p>
                        {formData.max_claims && (
                          <p className="text-xs text-blue-200 mt-1">
                            Limited to {formData.max_claims} claims
                          </p>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-white/5 rounded-lg">
                      <h5 className="font-medium text-white mb-2 text-sm">
                        Discount Type: {formData.discount_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                      <div className="text-xs text-blue-200 space-y-1">
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
                    <Package className="h-12 w-12 text-blue-200 mx-auto mb-3" />
                    <p className="text-blue-200 text-sm">
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