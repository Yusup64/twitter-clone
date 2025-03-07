import { refreshToken } from '@/api/user';

interface RequestConfig extends RequestInit {
  baseURL?: string;
  headers?: { [key: string]: string };
}

const isServer = typeof window === 'undefined';

const createDefaultConfig = async (): Promise<RequestConfig> => {
  let token = null;

  if (isServer) {
    // 动态导入 cookies，只在服务端使用
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const authorization = headersList.get('Authorization');

    token = authorization?.replace('Bearer ', '');
  } else {
    // 客户端从 localStorage 获取 token
    token = localStorage.getItem('accessToken');
  }

  return {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

interface SuccessResponse<T = any> {
  [key: string]: T;
}
// interface SuccessResponse<T = any> {
//   data: T; // 成功时的数据
// }

interface ErrorResponse {
  statusCode: number; // 外部 HTTP 状态码
  timestamp: string;
  path: string;
  message: string; // 错误时的消息
  err: string; // 错误时的类型
}

// 定义返回类型
type RequestResult<T> = SuccessResponse<T>;

class Request {
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  private async send<T>(
    url: string,
    config: RequestConfig = {},
  ): Promise<RequestResult<T>> {
    try {
      const defaultConfig = await createDefaultConfig();
      const mergedConfig = this.mergeConfig(defaultConfig, config);
      const response = await fetch(this.getFullURL(url), mergedConfig);

      let parsedData: any;

      try {
        parsedData = await response.json();
      } catch (error) {
        return Promise.reject({
          statusCode: response.status,
          message: 'Failed to parse response body',
          error: 'Invalid response format',
        } as unknown as ErrorResponse);
      }

      if (!response.ok) {
        // 只在客户端处理 token 刷新
        if (response.status === 401 && !isServer) {
          try {
            const newToken = await this.handleTokenRefresh();

            if (newToken) {
              mergedConfig.headers = {
                ...mergedConfig.headers,
                Authorization: `Bearer ${newToken}`,
              };
              const retryResponse = await fetch(
                this.getFullURL(url),
                mergedConfig,
              );

              parsedData = await retryResponse.json();
            }
          } catch (error) {
            return Promise.reject({
              statusCode: response.status,
              message: parsedData?.message || 'Unexpected error occurred',
              error: parsedData?.error || 'Unknown error',
            } as unknown as ErrorResponse);
          }
        } else {
          return Promise.reject({
            statusCode: response.status,
            message: parsedData?.message || 'Unexpected error occurred',
            error: parsedData?.error || 'Unknown error',
          } as unknown as ErrorResponse);
        }
      }

      const internalStatusCode = parsedData?.statusCode || 200;

      if (internalStatusCode === 200) {
        return Promise.resolve(parsedData?.data);
      } else if (internalStatusCode === 401) {
        location.href = '/auth/login';

        return Promise.reject({
          statusCode: 401,
          message: parsedData?.message || 'Unexpected error occurred',
          error: parsedData?.error || 'Unknown error',
        } as unknown as ErrorResponse);
      } else {
        return Promise.reject(parsedData as ErrorResponse);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (isServer) return null;

    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');

      if (!refreshTokenValue) return null;

      const { accessToken } = (await refreshToken(refreshTokenValue)) as any;

      localStorage.setItem('accessToken', accessToken);

      return accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      return null;
    }
  }

  private getFullURL(url: string): string {
    return url.startsWith('http') ? url : `${this.baseURL}${url}`;
  }

  private mergeConfig(
    defaultConfig: RequestConfig,
    customConfig: RequestConfig,
  ): RequestConfig {
    return {
      ...defaultConfig,
      ...customConfig,
      headers: {
        ...defaultConfig.headers,
        ...customConfig.headers,
      },
    };
  }

  async get<T>(
    url: string,
    params?: any,
    config: RequestConfig = {},
  ): Promise<RequestResult<T>> {
    const queryString = params
      ? Object.entries(params)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : '';

    return this.send<T>(`${url}${queryString ? `?${queryString}` : ''}`, {
      ...config,
      method: 'GET',
    });
  }

  async post<T>(
    url: string,
    body?: any,
    config: RequestConfig = {},
  ): Promise<RequestResult<T>> {
    return this.send<T>(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(
    url: string,
    body: any,
    config: RequestConfig = {},
  ): Promise<RequestResult<T>> {
    return this.send<T>(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(
    url: string,
    config: RequestConfig = {},
  ): Promise<RequestResult<T>> {
    return this.send<T>(url, { ...config, method: 'DELETE' });
  }
}

export default new Request();
