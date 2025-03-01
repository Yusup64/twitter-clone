// 从本地存储获取认证令牌
export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('token');
};

// 设置认证令牌到本地存储
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('token', token);
};

// 从本地存储移除认证令牌
export const removeToken = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('token');
};

// 检查用户是否已认证
export const isAuthenticated = (): boolean => {
  return !!getToken();
};
