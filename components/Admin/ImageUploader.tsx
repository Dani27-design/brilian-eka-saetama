"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { storage, firestore } from "@/db/firebase/firebaseConfig";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  fullPath: string;
  createdAt: any;
  size?: number;
  description?: string;
}

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: "square" | "landscape" | "portrait";
}

const ImageUploader = ({
  value,
  onChange,
  folder = "services",
  aspectRatio = "landscape",
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<MediaFile[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get aspect ratio class based on prop
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "portrait":
        return "aspect-[3/4]";
      case "landscape":
      default:
        return "aspect-[16/9]";
    }
  };

  // Load gallery images from Firestore media collection
  const loadGalleryImages = async () => {
    try {
      setIsLoadingGallery(true);
      setError(null);

      // Query media collection from Firestore
      const mediaCollection = collection(firestore, "media");
      // Get only image type files, ordered by creation date descending
      const q = query(
        mediaCollection,
        where("type", "==", "image"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);

      const mediaFiles: MediaFile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<MediaFile, "id">;
        mediaFiles.push({
          id: doc.id,
          ...data,
        });
      });

      setGalleryImages(mediaFiles);
    } catch (err) {
      console.error("Error loading gallery images:", err);
      setError("Failed to load gallery images");
    } finally {
      setIsLoadingGallery(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Create a unique filename with timestamp
      const timestamp = new Date().getTime();
      const filename = `${timestamp}_${file.name
        .replace(/\s+/g, "-")
        .toLowerCase()}`;
      const storageRef = ref(storage, `media/${folder}/${filename}`);

      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);
      setUploadProgress(100);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Add metadata to Firestore media collection
      const mediaCollection = collection(firestore, "media");
      await addDoc(mediaCollection, {
        name: file.name,
        url: downloadURL,
        type: "image",
        fullPath: `media/${folder}/${filename}`,
        createdAt: serverTimestamp(),
        size: file.size,
        description: "",
      });

      // Set the upload URL as selected
      onChange(downloadURL);

      // Refresh gallery
      await loadGalleryImages();
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match("image.*")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      handleFileUpload(file);
    }
  };

  // Toggle gallery
  const toggleGallery = async () => {
    const newState = !showGallery;
    setShowGallery(newState);

    if (newState && galleryImages.length === 0) {
      await loadGalleryImages();
    }
  };

  // Select image from gallery
  const selectImage = (mediaFile: MediaFile) => {
    onChange(mediaFile.url);
    setShowGallery(false);
  };

  // Clear selected image
  const clearImage = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Format date for display
  const formatDate = (date: any): string => {
    if (!date) return "";

    if (typeof date.toDate === "function") {
      // Convert Firestore timestamp to Date
      date = date.toDate();
    }

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      {/* Main container - flex layout for side-by-side positioning */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Left side: Image preview */}
        {value ? (
          <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 sm:w-1/2">
            <div className="relative overflow-hidden rounded-md">
              <div className={`relative w-full ${getAspectRatioClass()}`}>
                <Image
                  src={value}
                  alt="Selected image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={(err: any) => {
                    // Handle Firebase Storage errors
                    const error = err?.target?.error;
                    const storagePath = value.includes("firebase")
                      ? `Firebase Storage (${value
                          .split("?")[0]
                          .split("/")
                          .pop()})`
                      : "storage";

                    if (value.includes("firebasestorage.googleapis.com")) {
                      setError(
                        `Failed to load image from ${storagePath}: The file may have been deleted or you don't have permission to view it.`,
                      );
                    } else {
                      setError(
                        `Failed to load image: ${
                          error?.message || "Unknown error"
                        }`,
                      );
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                aria-label="Remove image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-[120px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 sm:w-1/2">
            <p className="text-sm text-gray-400">No image selected</p>
          </div>
        )}

        {/* Right side: Upload controls */}
        <div className="flex w-full flex-col justify-start gap-2 sm:w-1/2">
          {/* Upload from device */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="m-0 p-0 text-center">
                    Uploading {uploadProgress}%
                  </p>
                </span>
              ) : (
                <span className="flex w-full items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="m-0 p-0 text-center">Upload from Device</p>
                </span>
              )}
            </label>
          </div>

          {/* Select from gallery */}
          <button
            type="button"
            onClick={toggleGallery}
            className="flex h-10 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {showGallery ? "Close Gallery" : "Choose from Gallery"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      {/* Gallery modal */}
      {showGallery && (
        <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select from media library
            </h4>
            <button
              type="button"
              onClick={() => loadGalleryImages()}
              className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {isLoadingGallery ? (
            <div className="flex h-40 items-center justify-center">
              <svg
                className="h-8 w-8 animate-spin text-gray-400"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-gray-500">
              No images found in media library
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {galleryImages.map((mediaFile) => (
                <div
                  key={mediaFile.id}
                  className={`group relative cursor-pointer rounded-md border-2 p-1 transition-all duration-200 ${
                    mediaFile.url === value
                      ? "border-primary"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => selectImage(mediaFile)}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded">
                    <Image
                      src={mediaFile.url}
                      alt={mediaFile.name || `Gallery image`}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="object-cover"
                      onError={(err: any) => {
                        // Handle Firebase Storage errors
                        const error = err?.target?.error;
                        const storagePath = value.includes("firebase")
                          ? `Firebase Storage (${value
                              .split("?")[0]
                              .split("/")
                              .pop()})`
                          : "storage";

                        if (value.includes("firebasestorage.googleapis.com")) {
                          setError(
                            `Failed to load image from ${storagePath}: The file may have been deleted or you don't have permission to view it.`,
                          );
                        } else {
                          setError(
                            `Failed to load image: ${
                              error?.message || "Unknown error"
                            }`,
                          );
                        }
                      }}
                    />
                  </div>

                  {/* Hover overlay with file name */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs text-white">
                      {mediaFile.name}
                    </p>
                    <p className="text-xs text-gray-300">
                      {formatDate(mediaFile.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
