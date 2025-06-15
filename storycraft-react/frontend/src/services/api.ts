import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getToken, clearToken, setToken } from '../utils/token';

// API configuration
// In production, use relative URL to avoid CORS issues
// In development, use the full URL if specified in .env
const isProduction = import.meta.env.PROD;
let API_BASE_URL = import.meta.env.VITE_API_URL || '';

if (!API_BASE_URL) {
  // If no explicit API URL is set, use relative URL in production
  // and default to localhost in development
  API_BASE_URL = isProduction ? '/api/v1' : 'http://localhost:8000/api/v1';
}

// Ensure base URL doesn't end with a slash as we'll append paths with leading slashes
const baseURL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Create a custom interface for our API response
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

// Extend AxiosError with our custom response type
interface CustomAxiosError<T = any> extends AxiosError<ApiResponse<T>> {
  config: any;
  response?: AxiosResponse<ApiResponse<T>>;
  isAxiosError: boolean;
  toJSON: () => object;
}

// Create axios instance with custom config
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000, // 30 second timeout
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      
      // Add auth token if available
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request details with auth status
      console.group('API Request');
      console.log('URL:', `${config.method?.toUpperCase()} ${config.url}`);
      console.log('Base URL:', config.baseURL);
      console.log('Headers:', {
        ...config.headers,
        // Don't log the full auth token for security
        Authorization: config.headers.Authorization ? 'Bearer [TOKEN]' : 'Not set'
      });
      console.log('Data:', config.data);
      console.log('Has Token:', !!token);
      console.groupEnd();
      
      return config;
    },
    (error) => {
      console.error('Request Interceptor Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // You can modify the response data here before it's passed to the component
      return response;
    },
    async (error: CustomAxiosError) => {
      // Log error details in a structured way
      console.group('API Error');
      console.error('Message:', error.message);
      console.error('Request:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        headers: {
          ...error.config?.headers,
          Authorization: error.config?.headers?.Authorization ? 'Bearer [TOKEN]' : 'Not set'
        },
        data: error.config?.data
      });
      console.error('Response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      console.groupEnd();

      const originalRequest = error.config;
      
      // If the error is due to an expired token and we haven't already tried to refresh it
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const response = await axios.post<ApiResponse<{ token: string }>>(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          
          const { token } = response.data.data;
          setToken(token);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return instance(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear the token and redirect to login
          clearToken();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      // For other errors, just reject with the error
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create the API client
export const api = createApiClient();

// Helper function to handle API errors
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const err = error as CustomAxiosError;
    const message = err.response?.data?.message || err.message || 'An error occurred';
    throw new Error(message);
  }
  throw new Error('An unexpected error occurred');
};

// Wrapper functions for common HTTP methods with TypeScript generics
export const apiGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await api.get<ApiResponse<T>>(url, config);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const apiPost = async <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const apiPut = async <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const apiDelete = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const apiPatch = async <T = any, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await api.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Add request interceptor for adding auth token if needed
api.interceptors.request.use((config) => {
  console.log('Request:', config.method?.toUpperCase(), config.url);
  // Add auth token here if needed
  return config;
}, (error) => {
  console.error('Request Error:', error);
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);