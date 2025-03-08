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
    isLoading: !!token, // if there is a token, it will automatically start loading
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
      console.error('初始化认证状态失败:', error);
      set({ initialized: true, isLoading: false, isAuthenticated: false });
    }
  },

  checkAuth: () => {
    const storage = getLocalStorage();

    if (!storage) return false;

    const token = storage.getItem('accessToken');
    const { isAuthenticated, user, initialized } = get();

    // 如果尚未初始化，开始初始化过程
    if (!initialized && typeof window !== 'undefined') {
      get().initialize();
    }

    // 如果有token但没有用户信息，尝试刷新用户
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

      // 存储 tokens 到 localStorage
      const storage = getLocalStorage();

      if (storage) {
        storage.setItem('accessToken', accessToken);
        storage.setItem('refreshToken', refreshToken);
      }

      // 设置用户信息和认证状态
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

      // 清除 localStorage 中的 tokens
      const storage = getLocalStorage();

      if (storage) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
      }

      set({ user: null, isAuthenticated: false });

      // 使用安全的方式进行重定向
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使请求失败也清除本地状态
      const storage = getLocalStorage();

      if (storage) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
      }

      set({ user: null, isAuthenticated: false });

      // 使用安全的方式进行重定向
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

      // 存储 tokens 到 localStorage
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

      // 使用安全的方式进行重定向
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

      set({ user: response, isAuthenticated: true });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // 刷新失败时清除令牌，避免无限尝试
      const storage = getLocalStorage();

      if (storage) {
        storage.removeItem('accessToken');
        storage.removeItem('refreshToken');
      }
      set({ isAuthenticated: false, user: null });
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

      // 防止无限循环：只有当没有刷新中且有token时才刷新用户
      if (token && !get().isLoading && typeof window !== 'undefined') {
        // 设置isLoading为true防止重复调用
        set({ isLoading: true });
        get().refreshUser();
      }
    }

    return null;
  },

  setUser: (user) => {
    set({ user });
  },
}));
