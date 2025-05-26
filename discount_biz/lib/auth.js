// lib/auth.js

export async function signIn(email, password) {
  try {
    const response = await fetch('/api/business/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Include cookies with request
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Login failed' };
    }

    // No need to manually handle cookies here - the API route sets them
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'An error occurred during sign in' };
  }
}

export async function signOut() {
  try {
    const response = await fetch('/api/business/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Include cookies with request
    });

    // For added security, also clear cookies on client side
    // This provides a fallback in case the server-side cookie clearing fails
    document.cookie = 'sb-access-token=; Max-Age=0; path=/; SameSite=Lax';
    document.cookie = 'sb-refresh-token=; Max-Age=0; path=/; SameSite=Lax';
    
    return await response.json();
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: 'An error occurred during sign out' };
  }
}

export async function getSession() {
  try {
    // Fetch session data from the server using HTTP-only cookies
    const response = await fetch('/api/business/auth/session', {
      credentials: 'include' // Include cookies with request
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.authenticated) {
      return { authenticated: false };
    }

    return data;
  } catch (error) {
    console.error('Get session error:', error);
    return { authenticated: false, error: 'Failed to fetch session' };
  }
}
  
/**
 * Send a password reset email
 * @param {string} email - The email to send the reset link to
 * @returns {Promise<Object>} - The reset result
 */
export async function resetPassword(email) {
  try {
    const response = await fetch('/api/business/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      credentials: 'include' // Include cookies with request
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to send reset email' };
    }

    return data;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Update password after reset
 * @param {string} password - The new password
 * @returns {Promise<Object>} - The update result
 */
export async function updatePassword(password) {
  try {
    const response = await fetch('/api/business/auth/reset-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
      credentials: 'include' // Include cookies with request
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to update password' };
    }

    return data;
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Sign up a new business user
 * @param {Object} userData - User data including email, password, business_name, etc.
 * @returns {Promise<Object>} - The signup result
 */
export async function signUp(userData) {
  try {
    const response = await fetch('/api/business/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include' // Include cookies with request
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Signup failed' };
    }

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    return { error: 'An error occurred during sign up' };
  }
}