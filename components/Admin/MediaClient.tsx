"use client";

import { useState, useEffect, useRef } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { storage, firestore } from "@/db/firebase/firebaseConfig";
import Image from "next/image";
import AdminPageHeader from "./AdminPageHeader";

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

export default function MediaClient() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [urlCopied, setUrlCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files from Firestore
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get files from Firestore
      const mediaCollection = collection(firestore, "media");
      const q = query(mediaCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const mediaFiles: MediaFile[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MediaFile[];

      setFiles(mediaFiles);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load media files. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload with progress tracking
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);

      const file = files[0];
      const fileName = file.name;
      const timestamp = Date.now();
      const fileNameWithTimestamp = `${timestamp}_${fileName}`;
      const storageRef = ref(storage, `media/${fileNameWithTimestamp}`);

      // Create upload task with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Track upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setError("Failed to upload file. Please try again.");
          setIsUploading(false);
        },
        async () => {
          // Upload completed successfully
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Get file extension for type detection
            const extension = fileName.split(".").pop()?.toLowerCase() || "";
            const fileType = getFileType(extension);

            // Add file metadata to Firestore
            const mediaCollection = collection(firestore, "media");
            const docRef = await addDoc(mediaCollection, {
              name: fileName,
              url: downloadURL,
              type: fileType,
              fullPath: `media/${fileNameWithTimestamp}`,
              createdAt: serverTimestamp(),
              size: file.size,
              description: "",
            });

            // Add the new file to the state
            const newFile = {
              id: docRef.id,
              name: fileName,
              url: downloadURL,
              type: fileType,
              fullPath: `media/${fileNameWithTimestamp}`,
              createdAt: new Date(),
              size: file.size,
              description: "",
            };

            setFiles((prev) => [newFile, ...prev]);

            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }

            // Reset upload state
            setTimeout(() => {
              setUploadProgress(0);
              setIsUploading(false);
            }, 1000);
          } catch (err) {
            console.error("Error saving file metadata:", err);
            setError("Upload completed but metadata could not be saved.");
            setIsUploading(false);
          }
        },
      );
    } catch (err) {
      console.error("Upload setup error:", err);
      setError("Failed to start upload. Please try again.");
      setIsUploading(false);
    }
  };

  // Update file description
  const handleUpdateDescription = async () => {
    if (!selectedFile) return;

    try {
      setIsEditing(false);

      const docRef = doc(firestore, "media", selectedFile.id);
      await updateDoc(docRef, {
        description: description,
      });

      // Update files state
      setFiles((prev) =>
        prev.map((file) =>
          file.id === selectedFile.id ? { ...file, description } : file,
        ),
      );

      // Update selected file
      setSelectedFile({
        ...selectedFile,
        description,
      });
    } catch (err) {
      console.error("Error updating description:", err);
      setError("Failed to update description.");
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (file: MediaFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }

    try {
      // Delete from Firebase Storage
      const fileRef = ref(storage, file.fullPath);
      await deleteObject(fileRef);

      // Delete from Firestore
      await deleteDoc(doc(firestore, "media", file.id));

      // Update state
      setFiles((prev) => prev.filter((f) => f.id !== file.id));

      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      setError("Failed to delete file. Please try again.");
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setUrlCopied(url);

    setTimeout(() => {
      setUrlCopied(null);
    }, 2000);
  };

  // Helper function to determine file type
  const getFileType = (extension: string): string => {
    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"];
    const videoTypes = ["mp4", "webm", "ogg", "mov", "avi"];
    const audioTypes = ["mp3", "wav", "ogg", "aac"];
    const documentTypes = [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
      "json",
    ];

    if (imageTypes.includes(extension)) return "image";
    if (videoTypes.includes(extension)) return "video";
    if (audioTypes.includes(extension)) return "audio";
    if (documentTypes.includes(extension)) return "document";
    return "other";
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";

    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  // Format date
  const formatDate = (date: any): string => {
    if (!date) return "Unknown date";

    if (typeof date.toDate === "function") {
      // Convert Firestore timestamp to Date
      date = date.toDate();
    }

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter files based on search term
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto">
      <AdminPageHeader
        title="Media Library"
        description="Upload and manage media files"
        actions={
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search files..."
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90">
              Upload
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        }
      />

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div className="mb-6 rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
          <div className="mb-2 flex justify-between">
            <span>Uploading file...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* File grid */}
        <div
          className={`${
            selectedFile ? "md:col-span-8" : "md:col-span-12"
          } space-y-4`}
        >
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-square animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="space-y-2">
                  <div
                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-black ${
                      selectedFile?.id === file.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedFile(file);
                      setDescription(file.description || "");
                      setIsEditing(false);
                    }}
                  >
                    {/* File preview */}
                    {file.type === "image" ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={file.url}
                          alt={file.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          priority={true} // For above-the-fold images
                          quality={80} // Balance between quality and size
                          loading="eager" // For critical images
                        />
                      </div>
                    ) : file.type === "video" ? (
                      <div className="relative h-full w-full bg-gray-900">
                        <video
                          src={file.url}
                          className="h-full w-full object-contain"
                          preload="metadata"
                          muted
                          poster="/images/video-thumbnail-placeholder.png"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 p-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {/* File type icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {file.type === "document" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          )}
                          {file.type === "audio" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                          )}
                          {file.type === "other" && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          )}
                        </svg>
                      </div>
                    )}

                    {/* File type badge */}
                    <div className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs uppercase text-white">
                      {file.type}
                    </div>
                  </div>

                  {/* Show filename below the preview */}
                  <p
                    className="truncate text-sm text-gray-700 dark:text-gray-300"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-stroke bg-white dark:border-strokedark dark:bg-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-2 h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No files match your search."
                  : "No files uploaded yet."}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-opacity-90"
              >
                Upload your first file
              </button>
            </div>
          )}
        </div>

        {/* File details sidebar */}
        {selectedFile && (
          <div className="md:col-span-4">
            <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
              <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                File Details
              </h3>

              <div className="mb-4">
                {selectedFile.type === "image" ? (
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={true} // For above-the-fold images
                      quality={80} // Balance between quality and size
                      loading="eager" // For critical images
                    />
                  </div>
                ) : selectedFile.type === "video" ? (
                  <video
                    src={selectedFile.url}
                    controls
                    className="w-full rounded-lg"
                    poster="/images/video-thumbnail-placeholder.png"
                  ></video>
                ) : selectedFile.type === "audio" ? (
                  <audio
                    src={selectedFile.url}
                    controls
                    className="w-full"
                  ></audio>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Name
                  </p>
                  <p className="break-all text-sm">{selectedFile.name}</p>
                </div>

                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Type
                  </p>
                  <p className="text-sm capitalize">{selectedFile.type}</p>
                </div>

                {selectedFile.size && (
                  <div>
                    <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                      Size
                    </p>
                    <p className="text-sm">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    Uploaded
                  </p>
                  <p className="text-sm">
                    {formatDate(selectedFile.createdAt)}
                  </p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Description
                    </p>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded border border-stroke bg-white px-3 py-2 text-xs focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black"
                        rows={3}
                      ></textarea>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setDescription(selectedFile.description || "");
                            setIsEditing(false);
                          }}
                          className="rounded border border-stroke px-2 py-1 text-xs hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateDescription}
                          className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-opacity-90"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">
                      {selectedFile.description || "No description"}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    URL
                  </p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={selectedFile.url}
                      className="w-full truncate rounded-l-lg border border-stroke bg-gray-50 px-3 py-2 text-xs focus:outline-none dark:border-strokedark dark:bg-gray-800"
                    />
                    <button
                      onClick={() => handleCopyUrl(selectedFile.url)}
                      className="rounded-r-lg border border-l-0 border-stroke bg-gray-100 px-3 py-2 text-xs hover:bg-gray-200 dark:border-strokedark dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      {urlCopied === selectedFile.url ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <a
                  href={selectedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg border border-stroke px-3 py-2 text-center text-sm hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-800"
                >
                  Open
                </a>
                <button
                  onClick={() => handleDeleteFile(selectedFile)}
                  className="flex-1 rounded-lg border border-red-500 px-3 py-2 text-sm text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
