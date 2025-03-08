import request from 'libs/request';

// const PREFIX = '/api/v1/users';

export const getUser = async () => {
  return request.get(`/articles`);
};

export const registerUser = async (data: any) => {
  return request.post(`/auth/register`, data);
};

export const loginUser = async (data: any) => {
  return request.post(`/auth/login`, data);
};

export const refreshToken = async (data: any) => {
  return request.post(`/auth/refresh`, data);
};

export const getUserInfo = async () => {
  return request.get(`/auth/me`);
};

export const updateUserProfile = async (data: any) => {
  return request.post(`/auth/update-profile`, data);
};

export const verifyToken = async (body: any, config: any) => {
  return request.post(`/auth/verify`, body, config);
};

const PREFIX = '/users';

export const getUserProfile = async (username: string) => {
  return request.get(`${PREFIX}/getByUsername/${username}`);
};

export const followUser = async (userId: string) => {
  return request.post(`${PREFIX}/${userId}/follow`);
};

export const unfollowUser = async (userId: string) => {
  return request.post(`${PREFIX}/${userId}/unfollow`);
};

export const getUserTweets = async (username: string, params?: any) => {
  return request.get(`${PREFIX}/${username}/tweets`, params);
};

export const searchUsers = async (query: string) => {
  return request.get(`${PREFIX}/search`, { query });
};
