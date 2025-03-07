'use client';

import React from 'react';
import { Button } from '@heroui/react';
import { X } from 'lucide-react';

interface MediaUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  files,
  onFilesChange,
}) => {
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];

    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  // 获取文件预览URL
  const getFilePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  // 检查文件是否为视频
  const isVideo = (file: File) => {
    return file.type.startsWith('video/');
  };

  // 根据文件数量确定网格布局类
  const getGridClass = (count: number): string => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
      default:
        return 'grid-cols-2';
    }
  };

  // 根据文件数量和索引确定每个媒体项的类
  const getItemClass = (count: number, index: number): string => {
    switch (count) {
      case 1:
        return 'aspect-[16/9]';
      case 2:
        return 'aspect-square';
      case 3:
        return index === 0 ? 'aspect-square col-span-2' : 'aspect-square';
      case 4:
      default:
        return 'aspect-square';
    }
  };

  return (
    <div className="mt-3">
      <div className={`grid gap-2 ${getGridClass(files.length)}`}>
        {files.map((file, index) => (
          <div
            key={index}
            className={`relative rounded-xl overflow-hidden ${getItemClass(files.length, index)}`}
          >
            {isVideo(file) && getFilePreview(file) ? (
              <video
                className="w-full h-full object-cover"
                src={getFilePreview(file)}
              >
                <source src={getFilePreview(file)} type={file.type} />
                <track kind="captions" label="中文" src="" />
              </video>
            ) : (
              <img
                alt={`Upload preview ${index + 1}`}
                className="w-full h-full object-cover"
                src={getFilePreview(file)}
              />
            )}
            <Button
              isIconOnly
              className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
              radius="full"
              size="sm"
              variant="flat"
              onClick={() => handleRemoveFile(index)}
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
