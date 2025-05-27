// lib/api/base.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage safely
  let token = null;
  try {
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('access_token');
    }
  } catch (e) {
    console.warn('Could not access localStorage:', e);
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }
  
  const config = {
    headers: defaultHeaders,
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      console.warn('Failed to parse response:', parseError);
      data = null;
    }
    
    if (!response.ok) {
      // Return error information instead of throwing
      return {
        success: false,
        error: true,
        status: response.status,
        message: data?.detail || data?.message || `HTTP error! status: ${response.status}`,
        data: data
      };
    }
    
    // Return successful response
    return {
      success: true,
      error: false,
      status: response.status,
      data: data,
      ...data // Spread the actual data for backward compatibility
    };
    
  } catch (error) {
    // Network errors, etc.
    console.warn('Network error:', error);
    return {
      success: false,
      error: true,
      status: 0,
      message: `Network error: ${error.message}`,
      data: null
    };
  }
};

// Helper functions that return safe responses
export const apiGet = async (endpoint) => {
  const result = await apiRequest(endpoint, { method: 'GET' });
  return result;
};

export const apiPost = async (endpoint, data) => {
  const result = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
};

export const apiPut = async (endpoint, data) => {
  const result = await apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return result;
};

export const apiPatch = async (endpoint, data) => {
  const result = await apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result;
};

export const apiDelete = async (endpoint) => {
  const result = await apiRequest(endpoint, { method: 'DELETE' });
  return result;
};

export const apiUpload = async (endpoint, formData) => {
  const result = await apiRequest(endpoint, {
    method: 'POST',
    body: formData,
    headers: {}, // Let the browser set Content-Type for FormData
  });
  return result;
};