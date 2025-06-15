import { api } from './api';
import { User } from '../types/user';

// Define the user update payload type
export interface UpdateUserPayload {
  display_name?: string;
  theme?: 'light' | 'dark';
  password?: string;
  full_name?: string;
}

// Get current user's profile
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/me');
  return response.data;
};

// Update current user's profile
export const updateCurrentUser = async (data: UpdateUserPayload): Promise<User> => {
  const response = await api.put('/users/me', data);
  return response.data;
};

// Update user's theme preference
export const updateUserTheme = async (theme: 'light' | 'dark'): Promise<User> => {
  const response = await api.put('/users/me', { theme });
  return response.data;
};

// Update user's display name
export const updateDisplayName = async (displayName: string): Promise<User> => {
  const response = await api.put('/users/me', { display_name: displayName });
  return response.data;
};
