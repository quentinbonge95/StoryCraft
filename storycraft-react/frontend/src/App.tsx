// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { NotFound } from './pages/NotFound';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { StoryForm } from './pages/StoryForm';
import { StoryView } from './pages/StoryView';

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const [initialCheck, setInitialCheck] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // This effect runs after the component mounts and when auth state changes
    if (!loading && initialCheck) {
      setInitialCheck(false);
      console.log('[ProtectedRoute] Initial auth check complete', { isAuthenticated, user });
    }
  }, [loading, isAuthenticated, initialCheck, user]);

  // Show loading state while checking auth status
  if (loading || initialCheck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login', { from: location.pathname });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] User authenticated, rendering children', { user });
  return <Outlet />;
};

// This component handles the main routing and layout
const AppContent = () => {
  const { toast } = useToast();
  
  // Show welcome toast on mount
  React.useEffect(() => {
    toast({
      title: 'Welcome to StoryCraft!',
      description: 'Start creating and managing your stories.',
      variant: 'success' as const
    });
  }, [toast]);
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute />
      }>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stories/new" element={<StoryForm />} />
          <Route path="/stories/:id" element={<StoryView />} />
          <Route path="/stories/:id/edit" element={<StoryForm />} />
        </Route>
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;