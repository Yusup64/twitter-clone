import request from '@/libs/request';
import { User } from '@/types/user';

const PREFIX = '/users';

export const getCurrentUser = async () => {
  return request.get<User>(`${PREFIX}/me`);
};

export const getUserByUsername = async (username: string) => {
  return request.get<User>(`${PREFIX}/getByUsername/${username}`);
};

export const updateProfile = async (data: any) => {
  return request.put<User>(`${PREFIX}/profile`, data);
};

export const followUser = async (userId: string) => {
  return request.post(`${PREFIX}/${userId}/follow`);
};

export const unfollowUser = async (userId: string) => {
  return request.post(`${PREFIX}/${userId}/unfollow`);
};

export const getFollowers = async (userId: string, params?: any) => {
  return request.get(`${PREFIX}/${userId}/followers`, params);
};

export const getFollowing = async (userId: string, params?: any) => {
  return request.get(`${PREFIX}/${userId}/following`, params);
};

export const searchUsers = async (params: {
  query: string;
  limit?: number;
}) => {
  return request.get(`${PREFIX}/search`, params);
};

export const getSuggestedUsers = async (params?: any) => {
  return request.get(`${PREFIX}/suggested`, params);
};

export const uploadProfilePhoto = async (file: File) => {
  const formData = new FormData();

  formData.append('file', file);

  return request.post<{ url: string }>(
    `${PREFIX}/upload-profile-photo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
};

export const uploadCoverPhoto = async (file: File) => {
  const formData = new FormData();

  formData.append('file', file);

  return request.post<{ url: string }>(
    `${PREFIX}/upload-cover-photo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
};
