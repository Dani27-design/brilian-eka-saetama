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
import { usePageHeader } from "@/app/context/PageHeaderContext";

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

  usePageHeader("Media Library", "Upload and manage media files");

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
    <div className="flex h-full flex-col">
      {/* Search & Upload */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari file berdasarkan nama..."
            className="h-10 w-full rounded-lg border border-stroke bg-white px-4 pl-10 text-sm outline-none transition-colors focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            <span className="font-medium">{filteredFiles.length}</span> dari{" "}
            <span className="font-medium">{files.length}</span> file
          </span>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
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
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Terjadi Kesalahan</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div className="mb-4 rounded-lg border border-white/80 bg-white shadow-sm p-4">
          <div className="mb-2 flex justify-between">
            <span>Uploading file...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm">
        <div className="styled-scrollbar min-h-0 flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* File grid */}
            <div
              className={`${
                selectedFile ? "md:col-span-8" : "md:col-span-12"
              } space-y-4`}
            >
          {isLoading ? (
            <div className="grid gap-2 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-md border border-gray-100">
                  <div className="aspect-square animate-pulse bg-gray-200" />
                  <div className="p-1.5">
                    <div className="h-2.5 w-3/4 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="grid gap-2 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`group cursor-pointer overflow-hidden rounded-md border bg-white transition-all hover:shadow-md ${
                    selectedFile?.id === file.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedFile(file);
                    setDescription(file.description || "");
                    setIsEditing(false);
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {file.type === "image" ? (
                      <Image
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        quality={60}
                      />
                    ) : file.type === "video" ? (
                      <div className="flex h-full items-center justify-center bg-gray-900">
                        <div className="rounded-full bg-white/20 p-2">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {file.type === "document" && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          )}
                          {file.type === "audio" && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          )}
                          {file.type === "other" && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          )}
                        </svg>
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase leading-tight text-white">
                      {file.type}
                    </div>
                  </div>

                  {/* File info */}
                  <div className="p-1.5">
                    <p className="truncate text-[10px] font-medium text-gray-700" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-stroke bg-white">
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
              <p className="text-gray-500">
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
                <div className="rounded-lg border border-white/80 bg-white shadow-sm">
                  {/* Header with close button */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Detail File</h3>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4">
                    {/* Preview — compact */}
                    <div className="mb-3">
                      {selectedFile.type === "image" ? (
                        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-50">
                          <Image
                            src={selectedFile.url}
                            alt={selectedFile.name}
                            fill
                            className="object-contain"
                            sizes="300px"
                            quality={80}
                          />
                        </div>
                      ) : selectedFile.type === "video" ? (
                        <video
                          src={selectedFile.url}
                          controls
                          className="w-full rounded-md"
                          poster="/images/video-thumbnail-placeholder.png"
                        />
                      ) : selectedFile.type === "audio" ? (
                        <audio src={selectedFile.url} controls className="w-full" />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-gray-50">
                          <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Metadata — compact grid */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nama</span>
                        <span className="ml-2 truncate text-right font-medium text-gray-700" title={selectedFile.name}>
                          {selectedFile.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tipe</span>
                        <span className="capitalize text-gray-700">{selectedFile.type}</span>
                      </div>
                      {selectedFile.size && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ukuran</span>
                          <span className="text-gray-700">{formatFileSize(selectedFile.size)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Diunggah</span>
                        <span className="text-gray-700">{formatDate(selectedFile.createdAt)}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Deskripsi</span>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-[10px] font-medium text-primary hover:underline"
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
                            className="w-full rounded-md border border-stroke bg-white px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
                            rows={2}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setDescription(selectedFile.description || "");
                                setIsEditing(false);
                              }}
                              className="rounded-md border border-stroke px-2 py-1 text-[10px] hover:bg-gray-50"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleUpdateDescription}
                              className="rounded-md bg-primary px-2 py-1 text-[10px] text-white hover:bg-opacity-90"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">
                          {selectedFile.description || "Belum ada deskripsi"}
                        </p>
                      )}
                    </div>

                    {/* URL */}
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <span className="mb-1 block text-xs text-gray-400">URL</span>
                      <div className="flex items-center">
                        <input
                          type="text"
                          readOnly
                          value={selectedFile.url}
                          className="w-full truncate rounded-l-md border border-stroke bg-gray-50 px-2.5 py-1.5 text-[10px] focus:outline-none"
                        />
                        <button
                          onClick={() => handleCopyUrl(selectedFile.url)}
                          className="whitespace-nowrap rounded-r-md border border-l-0 border-stroke bg-gray-100 px-2.5 py-1.5 text-[10px] font-medium hover:bg-gray-200"
                        >
                          {urlCopied === selectedFile.url ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <a
                        href={selectedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-md border border-stroke py-1.5 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Buka
                      </a>
                      <button
                        onClick={() => handleDeleteFile(selectedFile)}
                        className="flex-1 rounded-md border border-red-200 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
