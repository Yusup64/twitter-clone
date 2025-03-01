import { CloudinaryUploadResponse, MediaFile } from '@/types/cloudinary';

const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

export const uploadToCloudinary = async (file: File): Promise<MediaFile> => {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_UPLOAD_PRESET}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data: CloudinaryUploadResponse = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    type: data.format === 'mp4' ? 'video' : 'image',
  };
};

export const uploadMultipleFiles = async (
  files: File[],
): Promise<MediaFile[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file));

  return Promise.all(uploadPromises);
};
