import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  accentColor: string | null;
  favoriteGenres: string[];
  createdAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error?: string; emailConfirmationRequired?: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    bio?: string;
    avatar?: string;
    accentColor?: string;
    favoriteGenres?: string[];
  }) => Promise<{ error?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };
      set({ user: data.user });
      return {};
    } catch {
      return { error: 'Network error' };
    }
  },

  register: async (email, password, name) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Registration failed' };
      if (data.emailConfirmationRequired) {
        return { emailConfirmationRequired: true };
      }
      set({ user: data.user });
      return {};
    } catch {
      return { error: 'Network error' };
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { error: result.error || 'Update failed' };
      set({ user: result });
      return {};
    } catch {
      return { error: 'Network error' };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // continue even if request fails
    }
    set({ user: null });
  },
}));
