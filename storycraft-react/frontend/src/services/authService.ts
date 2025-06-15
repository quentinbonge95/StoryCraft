import { User } from '../types/user';
import { clearToken, getToken, isTokenExpired, setToken } from '../utils/token';
import { api, apiPost } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  full_name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token?: string;
}

/**
 * Log in a user with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.group('Login Process');
    console.log('Login attempt with email:', credentials.email);
    
    // Convert to OAuth2 password flow format
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');
    
    console.log('Sending login request to /auth/token');
    
    // Use the token endpoint with proper content type
    const response = await api.post<{
      access_token: string;
      token_type: string;
    }>('/auth/token', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      // Disable the default error handling to handle 401s ourselves
      validateStatus: (status) => status < 500
    });
    
    console.log('Login response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    if (response.status !== 200) {
      const errorData = response.data as any;
      const errorMessage = errorData?.detail || errorData?.message || 'Login failed';
      console.error('Login error:', errorMessage, { status: response.status, data: response.data });
      throw new Error(errorMessage);
    }
    
    const { access_token: token } = response.data;
    if (!token) {
      throw new Error('No access token in response');
    }
    
    console.log('Token received, storing token and fetching user data');
    
    // Store the token before making the user info request
    setToken(token);
    
    // Fetch the user data using the new token
    console.log('Fetching user data from /users/me');
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Failed to fetch user data after login');
    }
    
    console.log('Login successful, user data:', user);
    return { user, token };
  } catch (error) {
    clearToken();
    throw error;
  }
};

/**
 * Register a new user
 */
export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiPost<AuthResponse>('/auth/register', {
      ...userData,
      full_name: userData.full_name,
    });
    setToken(response.token);
    return response;
  } catch (error) {
    clearToken();
    throw error;
  }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await apiPost('/auth/logout');
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    clearToken();
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  console.group('getCurrentUser');
  
  try {
    // Check token expiration
    if (isTokenExpired()) {
      const error = new Error('Session expired. Please log in again.');
      console.error('Token is expired');
      throw error;
    }
    
    const token = getToken();
    console.log('Current token exists:', !!token);
    
    console.log('Making request to /users/me');
    
    // Make the request with detailed logging
    const response = await api.get<User>('/users/me');
    const userData = response.data;
    
    console.log('Extracted user data:', userData);
    
    // Validate the user data structure
    if (!userData || typeof userData !== 'object') {
      const error = new Error(`Invalid user data format: ${typeof userData}`);
      console.error(error.message);
      throw error;
    }
    
    // Check for required fields
    const requiredFields = ['id', 'email'];
    const missingFields = requiredFields.filter(field => !(field in userData));
    
    if (missingFields.length > 0) {
      const error = new Error(`Missing required user fields: ${missingFields.join(', ')}`);
      console.error(error.message);
      console.log('Available fields:', Object.keys(userData));
      throw error;
    }
    
    // Map to User type with defaults
    const user: User = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name || '',
      display_name: userData.display_name || userData.full_name || userData.email.split('@')[0],
      theme: userData.theme || 'light',
      is_active: userData.is_active ?? true,
      is_superuser: userData.is_superuser ?? false,
      created_at: userData.created_at || new Date().toISOString(),
      updated_at: userData.updated_at || new Date().toISOString()
    };
    
    console.log('Successfully mapped user:', user);
    return user;
    
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error; // Re-throw to be handled by the caller
    
  } finally {
    console.groupEnd();
  }
};

/**
 * Refresh the authentication token
 */
export const refreshToken = async (): Promise<{ token: string }> => {
  try {
    const response = await api.post<{ data: { token: string } }>('/auth/refresh');
    const { token } = response.data.data;
    setToken(token);
    return { token };
  } catch (error) {
    clearToken();
    throw new Error('Failed to refresh token. Please log in again.');
  }
};

/**
 * Check if the user is authenticated
 * This checks both the presence and validity of the token
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  // Check if token is expired
  return !isTokenExpired();
};
