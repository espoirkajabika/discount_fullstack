// lib/auth.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'auth_user';
  }

  // Get stored token
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Store auth data
  setAuthData(token, user) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear auth data
  clearAuthData() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Make authenticated request
  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // Handle 401 - token expired
    if (response.status === 401) {
      this.clearAuthData();
      window.location.href = '/auth/login';
      return null;
    }

    return response;
  }

  // Sign up user
  async signUp(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different types of API errors
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // FastAPI validation errors
            const errorMessages = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
            return { error: `Validation errors - ${errorMessages}` };
          } else {
            return { error: data.detail };
          }
        }
        return { error: data.message || 'Registration failed' };
      }

      // Store auth data
      this.setAuthData(data.access_token, data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Sign in user
  async signIn(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different types of API errors
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // FastAPI validation errors
            const errorMessages = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
            return { error: `Validation errors - ${errorMessages}` };
          } else {
            return { error: data.detail };
          }
        }
        return { error: data.message || 'Login failed' };
      }

      // Store auth data
      this.setAuthData(data.access_token, data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Sign out user
  async signOut() {
    try {
      // Call logout endpoint
      await this.makeAuthenticatedRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      this.clearAuthData();
    }
  }

  // Get current user from API
  async getCurrentUser() {
    try {
      const response = await this.makeAuthenticatedRequest('/auth/me');
      
      if (!response || !response.ok) {
        return { error: 'Failed to get user data' };
      }

      const user = await response.json();
      
      // Update stored user data
      this.setAuthData(this.getToken(), user);
      
      return { user };
    } catch (error) {
      console.error('Get current user error:', error);
      return { error: 'Network error' };
    }
  }

  // Update user profile
  async updateProfile(updateData) {
    try {
      const response = await this.makeAuthenticatedRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (!response || !response.ok) {
        const data = await response.json();
        return { error: data.detail || 'Update failed' };
      }

      const user = await response.json();
      
      // Update stored user data
      this.setAuthData(this.getToken(), user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      // Note: This endpoint doesn't exist in your FastAPI yet
      // You'll need to implement password reset in your FastAPI
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || 'Password reset failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      // Note: This endpoint doesn't exist in your FastAPI yet
      // You'll need to implement password update in your FastAPI
      const response = await this.makeAuthenticatedRequest('/auth/update-password', {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response || !response.ok) {
        const data = await response.json();
        return { error: data.detail || 'Password update failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Register business user (combined registration)
  async registerBusinessUser(registrationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/business/register-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different types of API errors
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            // FastAPI validation errors
            const errorMessages = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
            return { error: `Validation errors - ${errorMessages}` };
          } else {
            return { error: data.detail };
          }
        }
        return { error: data.message || 'Business registration failed' };
      }

      // Store auth data
      this.setAuthData(data.access_token, data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Business registration error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }

  // Register business for existing user
  async registerBusiness(businessData) {
    try {
      const response = await this.makeAuthenticatedRequest('/business/register', {
        method: 'POST',
        body: JSON.stringify(businessData),
      });

      if (!response || !response.ok) {
        const data = await response.json();
        return { error: data.detail || 'Business registration failed' };
      }

      const business = await response.json();
      return { success: true, business };
    } catch (error) {
      console.error('Business registration error:', error);
      return { error: 'Network error. Please try again.' };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Export convenience functions
export const signUp = (userData) => authService.signUp(userData);
export const signIn = (email, password) => authService.signIn(email, password);
export const signOut = () => authService.signOut();
export const getCurrentUser = () => authService.getCurrentUser();
export const updateProfile = (updateData) => authService.updateProfile(updateData);
export const resetPassword = (email) => authService.resetPassword(email);
export const updatePassword = (newPassword) => authService.updatePassword(newPassword);
export const registerBusinessUser = (registrationData) => authService.registerBusinessUser(registrationData);
export const registerBusiness = (businessData) => authService.registerBusiness(businessData);

// Export auth utilities
export const getToken = () => authService.getToken();
export const getUser = () => authService.getUser();
export const isAuthenticated = () => authService.isAuthenticated();
export const clearAuthData = () => authService.clearAuthData();
export const makeAuthenticatedRequest = (url, options) => authService.makeAuthenticatedRequest(url, options);

export default authService;