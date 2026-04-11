"use client";

import { useEffect, useCallback, memo } from "react";
import Image from "next/image";
import Modal from "@/components/Admin/Modal";

interface PhotoGalleryModalProps {
  photoGallery: string[];
  isPhotoGalleryOpen: boolean;
  onClosePhotoGallery: () => void;
  currentPhotoIndex: number;
  onSetPhotoIndex: (index: number) => void;
}

function PhotoGalleryModal({
  photoGallery,
  isPhotoGalleryOpen,
  onClosePhotoGallery,
  currentPhotoIndex,
  onSetPhotoIndex,
}: PhotoGalleryModalProps) {
  const nextPhoto = useCallback(() => {
    onSetPhotoIndex(
      currentPhotoIndex >= photoGallery.length - 1 ? 0 : currentPhotoIndex + 1,
    );
  }, [currentPhotoIndex, photoGallery.length, onSetPhotoIndex]);

  const prevPhoto = useCallback(() => {
    onSetPhotoIndex(
      currentPhotoIndex <= 0 ? photoGallery.length - 1 : currentPhotoIndex - 1,
    );
  }, [currentPhotoIndex, photoGallery.length, onSetPhotoIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isPhotoGalleryOpen) return;
      if (event.key === "ArrowLeft") prevPhoto();
      else if (event.key === "ArrowRight") nextPhoto();
      else if (event.key === "Escape") onClosePhotoGallery();
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isPhotoGalleryOpen, prevPhoto, nextPhoto, onClosePhotoGallery]);

  return (
    <Modal
      isOpen={isPhotoGalleryOpen}
      onClose={onClosePhotoGallery}
      title={`Galeri Foto Inspeksi (${currentPhotoIndex + 1}/${photoGallery.length})`}
    >
      {photoGallery.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="relative flex justify-center">
            <Image
              src={photoGallery[currentPhotoIndex]}
              alt={`Foto inspeksi ${currentPhotoIndex + 1}`}
              width={800}
              height={600}
              className="max-h-[70vh] w-auto rounded object-contain"
            />
            {photoGallery.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
          {photoGallery.length > 1 && (
            <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2 overflow-x-auto">
              {photoGallery.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => onSetPhotoIndex(index)}
                  className={`relative flex-shrink-0 rounded border-2 ${
                    index === currentPhotoIndex
                      ? "border-blue-500"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    width={60}
                    height={60}
                    className="h-15 w-15 rounded object-cover"
                  />
                  {index === currentPhotoIndex && (
                    <div className="absolute inset-0 rounded bg-blue-500/20"></div>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 text-sm text-gray-600">
            Gunakan tombol panah atau klik thumbnail untuk navigasi
          </div>
        </div>
      )}
    </Modal>
  );
}

export default memo(PhotoGalleryModal);
