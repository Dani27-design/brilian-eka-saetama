"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Blog } from "@/types/blog";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const currentLang = language || "id";

  // Fetch blog data
  const fetchBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get blogs document from firestore
      const blogDocRef = doc(firestore, "blog", "blogs");
      const blogDoc = await getDocs(collection(firestore, "blog"));

      let blogData: any = {};
      blogDoc.forEach((doc) => {
        if (doc.id === "blogs") {
          blogData = doc.data();
        }
      });

      // Extract and process blogs for current language
      const blogsArray = blogData[currentLang] || [];

      // Sort blogs by creation date (newest first)
      const sortedBlogs = [...blogsArray].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setBlogs(sortedBlogs);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentLang]);

  // Delete blog handler
  const handleDeleteBlog = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        // Filter out the blog to delete
        const updatedBlogs = blogs.filter((blog) => blog._id !== blogId);

        // Update the blogs document in Firestore
        const blogDocRef = doc(firestore, "blog", "blogs");
        const blogDoc = await getDocs(collection(firestore, "blog"));

        let blogData: any = {};
        blogDoc.forEach((doc) => {
          if (doc.id === "blogs") {
            blogData = doc.data();
          }
        });

        // Update the current language array
        blogData[currentLang] = updatedBlogs;

        // Update Firestore
        await deleteDoc(doc(firestore, "blog", "blogs"));
        await setDoc(doc(firestore, "blog", "blogs"), blogData);

        // Update local state
        setBlogs(updatedBlogs);
      } catch (err) {
        console.error("Error deleting blog:", err);
        setError("Failed to delete blog. Please try again.");
      }
    }
  };

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-4 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Manage Blog Posts
        </h2>
        <Link
          href="/admin/blogs/create"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Blog Post
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
              <button
                onClick={fetchBlogs}
                className="mt-2 rounded-md bg-red-100 px-3 py-1 text-sm text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-100 dark:hover:bg-red-900/70"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-800">
          <svg
            className="mb-3 h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No blog posts yet
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new blog post
          </p>
          <Link
            href="/admin/blogs/create"
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
          >
            Create Blog Post
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <div
              key={blog._id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="relative h-48 w-full overflow-hidden">
                {blog.mainImage ? (
                  <Image
                    src={blog.mainImage}
                    alt={blog.title}
                    fill
                    className="object-cover object-center transition-all hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <svg
                      className="h-16 w-16 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="mb-2 line-clamp-1 text-lg font-medium text-gray-900 dark:text-white">
                  {blog.title || "Untitled Blog Post"}
                </h3>
                <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {blog.metadata || "No description available"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {blog.publishDate
                      ? new Date(blog.publishDate).toLocaleDateString()
                      : "No date"}
                  </span>
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/blogs/edit/${blog._id}`}
                      className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteBlog(blog._id)}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
