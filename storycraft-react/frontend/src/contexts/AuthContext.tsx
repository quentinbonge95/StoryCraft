import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  login as loginApi,
  LoginCredentials,
  logout as logoutApi,
  register as registerApi,
  RegisterData
} from '../services/authService';
import { User } from '../types/user';

type ToastVariant = 'default' | 'success' | 'destructive' | null | undefined;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  interface LocationState {
    from?: {
      pathname: string;
    };
  }
  
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  // Check authentication status on mount and when the token changes
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('[AuthContext] Checking auth, token exists:', !!token);
        
        if (token) {
          try {
            const userData = await getCurrentUser();
            console.log('[AuthContext] User data from /users/me:', userData);
            
            if (isMounted) {
              setUser(userData);
              setError(null);
            }
          } catch (err) {
            console.error('[AuthContext] Failed to fetch user data:', err);
            if (isMounted) {
              localStorage.removeItem('token');
              setUser(null);
            }
          }
        } else if (isMounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Auth check failed:', error);
        if (isMounted) {
          localStorage.removeItem('token');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('[AuthContext] Starting login process...');
    console.log('[AuthContext] Current location:', window.location.href);
    console.log('[AuthContext] Location state:', state);
    
    try {
      setError(null);
      console.log('[AuthContext] Calling loginApi with credentials');
      const { user, token } = await loginApi(credentials);
      
      console.log('[AuthContext] Login successful, storing token and user data');
      console.log('[AuthContext] User data:', user);
      
      // Store token and update user state
      localStorage.setItem('token', token);
      setUser(user);
      
      // Get the redirect path from location state or default to '/'
      const redirectPath = state?.from?.pathname || '/';
      console.log(`[AuthContext] Redirecting to: ${redirectPath}`);
      
      // Navigate to the target page
      navigate(redirectPath, { 
        replace: true,
        state: { from: redirectPath }
      });
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [navigate, state]);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      setError(null);
      const { user, token } = await registerApi(userData);
      setUser(user);
      const redirectPath = state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [navigate, state]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
      setUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, we still want to clear the local state
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      return { ...prevUser, ...userData };
    });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user,
    }),
    [user, loading, error, login, register, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
