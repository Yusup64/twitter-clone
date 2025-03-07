'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, Button } from '@heroui/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImagePreviewProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // 当initialIndex变化时更新currentIndex
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // 添加键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 检查当前媒体是否为视频
  const isVideo = (url: string) => url.match(/\.(mp4|webm|ogg|mov)($|\?)/i);
  const currentMedia = images[currentIndex];
  const currentIsVideo = isVideo(currentMedia);

  return (
    <Modal
      backdrop="blur"
      className="z-50"
      isOpen={isOpen}
      size="full"
      onClose={onClose}
    >
      <ModalContent className="bg-black/90 flex items-center justify-center">
        <div className="absolute top-4 right-4 z-10">
          <Button
            isIconOnly
            className="bg-black/50 text-white hover:bg-black/70"
            radius="full"
            variant="flat"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/30 px-3 py-1 rounded-full text-white">
          {currentIndex + 1} / {images.length}
        </div>

        <div className="flex items-center justify-center w-full h-full">
          {images.length > 1 && (
            <Button
              isIconOnly
              className="absolute left-4 bg-black/50 text-white hover:bg-black/70 z-10"
              radius="full"
              variant="flat"
              onClick={handlePrevious}
            >
              <ChevronLeft />
            </Button>
          )}

          <div className="max-h-[90vh] max-w-[90vw] flex items-center justify-center">
            {currentIsVideo ? (
              <video
                autoPlay
                controls
                playsInline
                className="max-h-[90vh] max-w-[90vw]"
              >
                <source
                  src={currentMedia}
                  type={`video/${currentIsVideo[1]}`}
                />
                <track kind="captions" label="中文" src="" />
                您的浏览器不支持视频播放
              </video>
            ) : (
              <img
                alt={`预览 ${currentIndex + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                src={currentMedia}
              />
            )}
          </div>

          {images.length > 1 && (
            <Button
              isIconOnly
              className="absolute right-4 bg-black/50 text-white hover:bg-black/70 z-10"
              radius="full"
              variant="flat"
              onClick={handleNext}
            >
              <ChevronRight />
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};
