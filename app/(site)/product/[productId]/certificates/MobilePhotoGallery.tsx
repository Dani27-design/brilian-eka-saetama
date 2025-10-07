"use client";

import { useState, useEffect } from "react";

interface MobilePhotoGalleryProps {
  photos: string[];
  certificateNumber: string;
}

export function MobilePhotoGallery({
  photos,
  certificateNumber,
}: MobilePhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Handle keyboard navigation and modal management
  useEffect(() => {
    if (selectedPhoto === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      switch (event.key) {
        case "Escape":
          closePhotoModal();
          break;
        case "ArrowLeft":
          if (photos.length > 1) {
            navigatePhoto("prev");
          }
          break;
        case "ArrowRight":
          if (photos.length > 1) {
            navigatePhoto("next");
          }
          break;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.body.style.overflow = "unset";
    };
  }, [selectedPhoto, photos.length]);

  // Handle touch gestures for swipe navigation
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
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && photos.length > 1) {
      navigatePhoto("next");
    }
    if (isRightSwipe && photos.length > 1) {
      navigatePhoto("prev");
    }

    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 flex justify-center">
          <svg
            className="h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No Photos Available
        </h3>
        <p className="text-sm text-gray-600">
          No inspection photos were captured for this certificate.
        </p>
      </div>
    );
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => {
      const newErrors = new Set(prev);
      newErrors.add(index);
      return newErrors;
    });
  };

  const openPhotoModal = (index: number) => {
    if (!imageErrors.has(index)) {
      setSelectedPhoto(index);
    }
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (selectedPhoto === null) return;

    const totalPhotos = photos.length;
    let newIndex = selectedPhoto;

    if (direction === "prev") {
      newIndex = selectedPhoto === 0 ? totalPhotos - 1 : selectedPhoto - 1;
    } else {
      newIndex = selectedPhoto === totalPhotos - 1 ? 0 : selectedPhoto + 1;
    }

    // Skip broken images when navigating
    let attempts = 0;
    while (imageErrors.has(newIndex) && attempts < totalPhotos) {
      if (direction === "prev") {
        newIndex = newIndex === 0 ? totalPhotos - 1 : newIndex - 1;
      } else {
        newIndex = newIndex === totalPhotos - 1 ? 0 : newIndex + 1;
      }
      attempts++;
    }

    // If all images are broken, close the modal
    if (attempts >= totalPhotos) {
      closePhotoModal();
      return;
    }

    setSelectedPhoto(newIndex);
  };

  return (
    <div className="space-y-4">
      {/* Gallery Header */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-2 flex items-center font-semibold text-gray-900">
          <svg
            className="mr-2 h-5 w-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Inspection Photos
        </h4>
        <p className="text-sm text-gray-600">
          {photos.length} photo{photos.length !== 1 ? "s" : ""} captured during
          inspection
        </p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-shadow hover:shadow-md"
            onClick={() => openPhotoModal(index)}
          >
            {imageErrors.has(index) ? (
              // Error State
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                <svg
                  className="mb-2 h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="px-2 text-center text-xs text-gray-500">
                  Image unavailable
                </p>
              </div>
            ) : (
              <>
                {/* Photo */}
                <img
                  src={photo}
                  alt={`Inspection photo ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(index)}
                  loading="lazy"
                />

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-200 hover:bg-opacity-20">
                  <div className="rounded-full bg-white bg-opacity-90 p-2 opacity-0 transition-opacity hover:opacity-100">
                    <svg
                      className="h-4 w-4 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Photo Index */}
                <div className="absolute left-2 top-2 rounded-full bg-black bg-opacity-60 px-2 py-1 text-xs text-white">
                  {index + 1}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Gallery Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364-.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-900">Photo Gallery</h4>
            <p className="mt-1 text-sm text-blue-700">
              Tap any photo to view in full screen. Photos show the actual
              condition of equipment during inspection and provide visual
              evidence for compliance records.
            </p>
          </div>
        </div>
      </div>

      {/* Full Screen Photo Modal */}
      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-[999999] bg-black bg-opacity-95"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            // Close modal when clicking the backdrop
            if (e.target === e.currentTarget) {
              closePhotoModal();
            }
          }}
        >
          {/* Modal Content Container */}
          <div
            className="relative flex h-full w-full items-center justify-center"
            onClick={(e) => {
              // Only close if clicking the container itself, not child elements
              if (e.target === e.currentTarget) {
                closePhotoModal();
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close Button - Higher z-index */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closePhotoModal();
              }}
              className="absolute right-4 top-4 touch-manipulation rounded-full bg-black bg-opacity-70 p-2 text-white transition-all duration-200 hover:bg-opacity-90 sm:p-3"
              style={{ backdropFilter: "blur(4px)", zIndex: 1000000 }}
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Navigation Buttons - Higher z-index */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto("prev");
                  }}
                  className="absolute left-2 top-1/2 z-[10001] -translate-y-1/2 transform touch-manipulation rounded-full bg-black bg-opacity-70 p-2 text-white transition-all duration-200 hover:bg-opacity-90 sm:left-4 sm:p-3"
                  style={{ backdropFilter: "blur(4px)" }}
                >
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigatePhoto("next");
                  }}
                  className="absolute right-2 top-1/2 z-[10001] -translate-y-1/2 transform touch-manipulation rounded-full bg-black bg-opacity-70 p-2 text-white transition-all duration-200 hover:bg-opacity-90 sm:right-4 sm:p-3"
                  style={{ backdropFilter: "blur(4px)" }}
                >
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Photo Container */}
            <div
              className="relative flex h-full w-full items-center justify-center p-4 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[selectedPhoto]}
                alt={`Inspection photo ${selectedPhoto + 1}`}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                style={{
                  maxHeight: "calc(100vh - 120px)",
                  maxWidth: "calc(100vw - 32px)",
                }}
                onError={() => {
                  handleImageError(selectedPhoto);
                  navigatePhoto("next");
                }}
                onLoad={() => {
                  if (imageErrors.has(selectedPhoto)) {
                    setImageErrors((prev) => {
                      const newErrors = new Set(prev);
                      newErrors.delete(selectedPhoto);
                      return newErrors;
                    });
                  }
                }}
              />
            </div>

            {/* Photo Info - Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-[10000] bg-gradient-to-t from-black via-black/80 to-transparent p-4 text-white sm:p-6">
              <div className="text-center">
                <p className="text-sm font-medium sm:text-base">
                  Photo {selectedPhoto + 1} of {photos.length}
                </p>
                <p className="mt-1 text-xs text-gray-300 sm:text-sm">
                  Certificate: {certificateNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
