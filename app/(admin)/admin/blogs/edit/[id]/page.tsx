"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import BlogItemEditor from "@/components/Admin/BlogItemEditor";
import { Blog } from "@/types/blog";

export default function EditBlogPage({ params }) {
  const blogId = params.id;
  const router = useRouter();
  const { language } = useLanguage();
  const currentLang = language || "id";

  const [blog, setBlog] = useState<Blog | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      setIsLoading(true);
      try {
        // Get blogs document from firestore
        const blogDocRef = doc(firestore, "blog", "blogs");
        const blogDocSnap = await getDoc(blogDocRef);

        if (blogDocSnap.exists()) {
          const blogData = blogDocSnap.data();
          const blogsArray = blogData[currentLang] || [];

          // Find the blog with matching ID
          const foundBlog = blogsArray.find(
            (blog) => blog._id.toString() === blogId,
          );

          if (foundBlog) {
            setBlog(foundBlog);
          } else {
            setError("Blog post not found");
          }
        } else {
          setError("Blog data not found");
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Failed to load blog. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [blogId, currentLang]);

  const handleTextChange = (_index: number, field: string, value: string) => {
    setBlog((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleContentChange = (
    _index: number,
    field: string,
    value: string,
  ) => {
    setBlog((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!blog) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!blog.title) throw new Error("Blog title is required");
      if (!blog.slug) throw new Error("Blog slug is required");

      // Get existing blogs
      const blogDocRef = doc(firestore, "blog", "blogs");
      const blogDocSnap = await getDoc(blogDocRef);

      if (!blogDocSnap.exists()) {
        throw new Error("Blog document not found");
      }

      const blogData = blogDocSnap.data();
      const blogsArray = blogData[currentLang] || [];

      // Find and update the blog in the array
      const updatedBlogs = blogsArray.map((item) =>
        item._id.toString() === blogId
          ? { ...blog, updatedAt: new Date().toISOString() }
          : item,
      );

      // Update the blogs array in the data
      blogData[currentLang] = updatedBlogs;

      // Update Firestore
      await setDoc(blogDocRef, blogData);

      // Redirect to the blogs list
      router.push("/admin/blogs");
    } catch (err) {
      console.error("Error updating blog:", err);
      setError(err.message || "Failed to update blog. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="shadow-default dark:bg-boxdark flex h-64 items-center justify-center rounded-sm border border-stroke bg-white dark:border-strokedark">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-4 dark:border-strokedark md:p-6 xl:p-7.5">
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
                {error || "Blog not found"}
              </p>
              <button
                onClick={() => router.push("/admin/blogs")}
                className="mt-2 rounded-md bg-red-100 px-3 py-1 text-sm text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-100 dark:hover:bg-red-900/70"
              >
                Return to Blogs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-4 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Edit Blog Post
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update your blog post content.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
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
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <BlogItemEditor
            blog={blog}
            index={0}
            onRemove={() => {}} // Not used in edit mode
            onTextChange={handleTextChange}
            onContentChange={handleContentChange}
            activeTab={currentLang}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/admin/blogs")}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Update Blog Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
