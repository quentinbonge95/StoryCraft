export interface User {
  id: number;
  email: string;
  full_name: string | null;
  display_name: string | null;
  theme: 'light' | 'dark';
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
