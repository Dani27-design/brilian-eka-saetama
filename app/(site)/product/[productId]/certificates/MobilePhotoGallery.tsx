"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";

const translations = {
  id: {
    noPhotos: "Belum Ada Foto",
    noPhotosDesc: "Tidak ada foto inspeksi untuk sertifikat ini.",
    photoOf: "Foto",
    of: "dari",
    imageUnavailable: "Gagal memuat",
  },
  en: {
    noPhotos: "No Photos Available",
    noPhotosDesc: "No inspection photos were captured for this certificate.",
    photoOf: "Photo",
    of: "of",
    imageUnavailable: "Failed to load",
  },
};

interface MobilePhotoGalleryProps {
  photos: string[];
  certificateNumber: string;
}

export function MobilePhotoGallery({
  photos,
  certificateNumber,
}: MobilePhotoGalleryProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.id;
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (selectedPhoto === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      switch (event.key) {
        case "Escape": closePhotoModal(); break;
        case "ArrowLeft": if (photos.length > 1) navigatePhoto("prev"); break;
        case "ArrowRight": if (photos.length > 1) navigatePhoto("next"); break;
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.body.style.overflow = "unset";
    };
  }, [selectedPhoto, photos.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && photos.length > 1) navigatePhoto("next");
    if (distance < -50 && photos.length > 1) navigatePhoto("prev");
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="py-8 text-center">
        <svg className="mx-auto mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.noPhotos}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.noPhotosDesc}</p>
      </div>
    );
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => { const s = new Set(prev); s.add(index); return s; });
  };

  const openPhotoModal = (index: number) => {
    if (!imageErrors.has(index)) setSelectedPhoto(index);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (selectedPhoto === null) return;
    const total = photos.length;
    let idx = selectedPhoto;
    idx = direction === "prev" ? (idx === 0 ? total - 1 : idx - 1) : (idx === total - 1 ? 0 : idx + 1);
    let attempts = 0;
    while (imageErrors.has(idx) && attempts < total) {
      idx = direction === "prev" ? (idx === 0 ? total - 1 : idx - 1) : (idx === total - 1 ? 0 : idx + 1);
      attempts++;
    }
    if (attempts >= total) { closePhotoModal(); return; }
    setSelectedPhoto(idx);
  };

  return (
    <div>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            onClick={() => openPhotoModal(index)}
          >
            {imageErrors.has(index) ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{t.imageUnavailable}</p>
              </div>
            ) : (
              <>
                <Image
                  src={photo}
                  alt={`${t.photoOf} ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                  onError={() => handleImageError(index)}
                  loading="lazy"
                />
                <div className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  {index + 1}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Modal */}
      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-[999999] bg-black/95"
          onClick={(e) => { if (e.target === e.currentTarget) closePhotoModal(); }}
        >
          <div
            className="relative flex h-full w-full items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) closePhotoModal(); }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); closePhotoModal(); }}
              className="absolute right-3 top-3 z-[1000000] rounded-full bg-black/60 p-2 text-white backdrop-blur-sm"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Nav */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhoto("prev"); }}
                  className="absolute left-2 top-1/2 z-[1000001] -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhoto("next"); }}
                  className="absolute right-2 top-1/2 z-[1000001] -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image */}
            <div className="flex h-full w-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <img
                src={photos[selectedPhoto]}
                alt={`${t.photoOf} ${selectedPhoto + 1}`}
                className="max-h-full max-w-full rounded-lg object-contain"
                style={{ maxHeight: "calc(100vh - 100px)", maxWidth: "calc(100vw - 32px)" }}
                onError={() => { handleImageError(selectedPhoto); navigatePhoto("next"); }}
              />
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                {t.photoOf} {selectedPhoto + 1} {t.of} {photos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
