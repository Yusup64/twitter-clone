// app/auth/server-auth.ts
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { verifyToken } from '@/api/user';

interface AuthOptions {
  redirectPath?: string;
  roles?: string[];
  required?: boolean;
}

/**
 * 验证请求中提供的token
 * 这个函数可以在Server Components和Server Actions中使用
 */
export async function verifyAuthToken(token: string | null) {
  if (!token) {
    return null;
  }

  try {
    const response = await verifyToken(
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response;
  } catch (error) {
    console.error('Token verification error:', error);

    return null;
  }
}

/**
 * 在服务器组件中检查认证状态的方法
 * 使用X-Auth-Token头（或提供显式token参数）
 */
export async function checkAuthInServerComponent(options: AuthOptions = {}) {
  const currentPath = options.redirectPath || '/user/profile';
  const required = options.required ?? true;

  // 从请求头中获取token (仅在使用middleware时有效)
  // 或者直接在客户端传递token到服务器动作
  const cookieStore = await cookies();
  const token = cookieStore.get('temp_auth_token')?.value || null;

  if (!token && !required) {
    return null;
  }

  if (!token && required) {
    redirect(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  const user = await verifyAuthToken(token);

  if (!user && required) {
    redirect(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  }

  return user;
}

/**
 * 用于服务器动作的认证验证
 * 客户端组件可以调用这个动作并传递token
 */
export async function verifyAuth(token: string, options: AuthOptions = {}) {
  const currentPath = options.redirectPath || '/user/profile';
  const required = options.required ?? true;

  if (!token && !required) {
    return { authenticated: false, user: null };
  }

  if (!token && required) {
    return {
      authenticated: false,
      redirectTo: `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
    };
  }

  const user = await verifyAuthToken(token);

  if (!user && required) {
    return {
      authenticated: false,
      redirectTo: `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
    };
  }

  return { authenticated: true, user };
}
