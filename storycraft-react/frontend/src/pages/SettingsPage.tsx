import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '../components/ui/ToastProvider';
import { useAuth } from '../contexts/AuthContext';
import { updateUserTheme } from '../services/userApi';

type SettingsFormData = {
  theme: 'light' | 'dark';
};

export const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<SettingsFormData>({
    defaultValues: {
      theme: user?.theme || 'light',
    },
  });

  // Watch for theme changes to update the UI immediately
  const currentTheme = watch('theme');

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        theme: user.theme || 'light',
      });
    }
  }, [user, reset]);

  // Apply theme to document
  useEffect(() => {
    if (currentTheme) {
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [currentTheme]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const updatedUser = await updateUserTheme(data.theme);
      updateUser(updatedUser);
      
      toast({
        title: 'Settings updated',
        description: 'Your settings have been updated successfully.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive' as const,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your application settings
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Customize how StoryCraft looks on your device.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="light-theme"
                    type="radio"
                    value="light"
                    {...register('theme')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="light-theme" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span>Light</span>
                    <p className="text-gray-500 text-sm font-normal">Use light theme</p>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="dark-theme"
                    type="radio"
                    value="dark"
                    {...register('theme')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="dark-theme" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span>Dark</span>
                    <p className="text-gray-500 text-sm font-normal">Use dark theme</p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || isLoading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
