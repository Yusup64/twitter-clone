import request from "@/libs/request";

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  return request.post('/auth/change-password', data);
};
