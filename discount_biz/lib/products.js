// lib/products.js
import { makeAuthenticatedRequest } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

class ProductsService {
  // Get all products for current business
  async getProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add sorting
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      // Add search
      if (params.search) queryParams.append('search', params.search);
      
      const url = `/business/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to fetch products' };
      }
      
      const data = await response.json();
      return { 
        success: true, 
        products: data.products || [],
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Get products error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get single product by ID
  async getProduct(productId) {
    try {
      const response = await makeAuthenticatedRequest(`/business/products/${productId}`);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Product not found' };
      }
      
      const data = await response.json();
      return { success: true, product: data.product || data };
    } catch (error) {
      console.error('Get product error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Create new product
  async createProduct(productData) {
    try {
      console.log('Creating product with data:', productData);
      
      const response = await makeAuthenticatedRequest('/business/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      
      if (!response || !response.ok) {
        let data = null;
        let errorMessage = `Request failed with status ${response?.status || 'unknown'}`;
        
        try {
          data = await response?.json();
          console.error('Product creation failed:', data);
          
          if (data && data.detail) {
            if (Array.isArray(data.detail)) {
              const errorMessages = data.detail.map(err => {
                const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
                return `${field}: ${err.msg}`;
              }).join(', ');
              errorMessage = `Validation errors - ${errorMessages}`;
            } else {
              errorMessage = data.detail;
            }
          } else if (data && data.message) {
            errorMessage = data.message;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          console.error('Raw response:', response);
          
          // For server errors, provide a more user-friendly message
          if (response?.status >= 500) {
            errorMessage = 'Server error occurred. Please try again or contact support.';
          }
        }
        
        return { error: errorMessage };
      }
      
      const data = await response.json();
      console.log('Product created successfully:', data);
      return { success: true, product: data.product || data };
    } catch (error) {
      console.error('Create product error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Update existing product
  async updateProduct(productId, productData) {
    try {
      const response = await makeAuthenticatedRequest(`/business/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(productData),
      });
      
      if (!response || !response.ok) {
        const data = await response?.json();
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            const errorMessages = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
            return { error: `Validation errors - ${errorMessages}` };
          } else {
            return { error: data.detail };
          }
        }
        return { error: data?.message || 'Failed to update product' };
      }
      
      const data = await response.json();
      return { success: true, product: data.product || data };
    } catch (error) {
      console.error('Update product error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      const response = await makeAuthenticatedRequest(`/business/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to delete product' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Delete product error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Upload product image with proper token handling
  async uploadImage(imageFile) {
    try {
      console.log('Uploading image file:', imageFile.name, imageFile.size, 'bytes');
      
      const formData = new FormData();
      formData.append('image', imageFile);

      // Get the token for authorization
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { error: 'Authentication required' };
      }

      const response = await fetch(`${API_BASE_URL}/business/products/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Image upload failed:', data);
        return { error: data.detail || 'Failed to upload image' };
      }

      const data = await response.json();
      console.log('Image uploaded successfully:', data);
      
      return { 
        success: true, 
        path: data.path, 
        url: data.url,
        compression_info: data.compression_info
      };
    } catch (error) {
      console.error('Upload image error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get product offers
  async getProductOffers(productId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const url = `/business/products/${productId}/offers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      if (!response || !response.ok) {
        const data = await response?.json();
        return { error: data?.detail || 'Failed to fetch product offers' };
      }
      
      const data = await response.json();
      return { 
        success: true, 
        offers: data.offers || [],
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Get product offers error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Get categories for dropdown
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/`);
      
      if (!response.ok) {
        return { error: 'Failed to fetch categories' };
      }
      
      const data = await response.json();
      return { success: true, categories: data };
    } catch (error) {
      console.error('Get categories error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }
}

// Create singleton instance
const productsService = new ProductsService();

// Export convenience functions
export const getProducts = (params) => productsService.getProducts(params);
export const getProduct = (id) => productsService.getProduct(id);
export const createProduct = (data) => productsService.createProduct(data);
export const updateProduct = (id, data) => productsService.updateProduct(id, data);
export const deleteProduct = (id) => productsService.deleteProduct(id);
export const uploadProductImage = (file) => productsService.uploadImage(file);
export const getProductOffers = (id, params) => productsService.getProductOffers(id, params);
export const getCategories = () => productsService.getCategories();

export default productsService;