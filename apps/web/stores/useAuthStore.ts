import { create } from 'zustand';
import { User } from 'database/types';

import {
  getUserInfo,
  loginUser,
  registerUser,
  updateUserProfile,
} from '@/api/user';

// 安全获取localStorage
const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }

  return null;
};

// add the functionality to restore the state from local storage when initializing
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    };
  }

  const storage = getLocalStorage();
  const token = storage?.getItem('accessToken');

  return {
    user: null,
    isLoading: false, // if there is a token, it will automatically start loading
    isAuthenticated: !!token, // if there is a token, assume it is authenticated
  };
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialized: boolean;

  login: (credentials: any) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => boolean;
  getUser: () => User | null;
  set: (state: Partial<AuthState>) => void;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...getInitialState(),
  initialized: false,

  set: (state: Partial<AuthState>) => set(state),

  initialize: async () => {
    // prevent duplicate initialization
    if (get().initialized) return;

    const storage = getLocalStorage();

    if (!storage) {
      set({ initialized: true, isLoading: false, isAuthenticated: false });

      return;
    }

    const token = storage.getItem('accessToken');

    if (!token) {
      set({ initialized: true, isLoading: false, isAuthenticated: false });

      return;
    }

    set({ isLoading: true });
    try {
      await get().refreshUser();
      set({ initialized: true, isLoading: false });
    } catch (error) {
      console.error('Initialize auth state failed:', error);
      set({ initialized: true, isLoading: false, isAuthenticated: false });
    }
  },

  checkAuth: () => {
    const storage = getLocalStorage();

    if (!storage) return false;

    const token = storage.getItem('accessToken');
    const { isAuthenticated, user, initialized } = get();

    // If not initialized, start the initialization process
    if (!initialized && typeof window !== 'undefined') {
      get().initialize();
    }

    // If there is a token but no user information, try to refresh the user
    if (token && !user && !get().isLoading && typeof window !== 'undefined') {
      get().refreshUser();
    }

    return !!token && isAuthenticated;
  },

  login: async (credentials) => {
    set({ isLoading: true });

    try {
      const response = (await loginUser(credentials)) as any;

      const { accessToken, refreshToken, user, err } = response;

      if (err) {
        throw new Error(err);
      }

      // Store tokens in localStorage
      const storage = getLocalStorage();

      if (storage) {
        storage.setItem('accessToken', accessToken);
        storage.setItem('refreshToken', refreshToken);
      }

      // Set user information and authentication status
      set({ user, isLoading: false, isAuthenticated: true, initialized: true });
    } catch (error) {
      console.log('🚀 ~ login: ~ error:', error);
      set({ isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear tokens in localStorage
      const storage = getLocalStorage();

      if (storage) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
      }

      set({ user: null, isAuthenticated: false });

      // Use a safe way to redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the request fails, clear the local state
      const storage = getLocalStorage();

      if (storage) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
      }

      set({ user: null, isAuthenticated: false });

      // Use a safe way to redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = (await registerUser(data)) as any;
      const { accessToken, refreshToken, ...userData } = response;

      // Store tokens in localStorage
      const storage = getLocalStorage();

      if (storage) {
        storage.setItem('accessToken', accessToken);
        storage.setItem('refreshToken', refreshToken);
      }

      set({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
        initialized: true,
      });

      // Use a safe way to redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      await updateUserProfile(data);
      await get().refreshUser();
    } catch (error) {
      throw error;
    }
  },

  refreshUser: async () => {
    try {
      const response = (await getUserInfo()) as unknown as User;

      set({ user: response, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // When the refresh fails, clear the token to avoid infinite attempts
      const storage = getLocalStorage();

      if (storage) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
      }
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  getUser: () => {
    if (get().isAuthenticated && get().user) {
      return get().user;
    } else {
      if (get().isLoading) {
        return null;
      }

      const storage = getLocalStorage();

      if (!storage) return null;

      const token = storage.getItem('accessToken');

      // Prevent infinite loop: only refresh the user when there is no refresh in progress and there is a token
      if (token && !get().isLoading && typeof window !== 'undefined') {
        // Set isLoading to true to prevent duplicate calls
        set({ isLoading: true });
        get().refreshUser();
      }
    }

    return null;
  },

  setUser: (user) => {
    set({ user, isLoading: false });
  },
}));
