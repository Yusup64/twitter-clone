export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export interface MediaFile {
  url: string;
  publicId: string;
  type: 'image' | 'video';
}
