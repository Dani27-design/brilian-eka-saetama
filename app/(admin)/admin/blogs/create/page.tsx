"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import BlogItemEditor from "@/components/Admin/BlogItemEditor";
import { Blog } from "@/types/blog";

export default function CreateBlogPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const currentLang = language || "id";
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [blog, setBlog] = useState<Blog>({
    _id: Date.now(),
    title: "",
    slug: "",
    metadata: "",
    content: "",
    mainImage: "",
    author: "",
    publishDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
  });

  const handleTextChange = (_index: number, field: string, value: string) => {
    setBlog((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContentChange = (
    _index: number,
    field: string,
    value: string,
  ) => {
    setBlog((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!blog.title) throw new Error("Blog title is required");
      if (!blog.slug) throw new Error("Blog slug is required");

      // Generate slug if not provided
      let slug = blog.slug;
      if (!slug) {
        slug = blog.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");
        blog.slug = slug;
      }

      // Get existing blogs
      const blogDocRef = doc(firestore, "blog", "blogs");
      const blogDocSnap = await getDoc(blogDocRef);

      let blogData: any = {};
      if (blogDocSnap.exists()) {
        blogData = blogDocSnap.data();
      }

      // Initialize the language array if it doesn't exist
      if (!blogData[currentLang]) {
        blogData[currentLang] = [];
      }

      // Add the new blog to the beginning of the array
      blogData[currentLang] = [blog, ...blogData[currentLang]];

      // Update Firestore
      await setDoc(blogDocRef, blogData);

      // Redirect to the blogs list
      router.push("/admin/blogs");
    } catch (err) {
      console.error("Error saving blog:", err);
      setError(err.message || "Failed to save blog. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-4 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Create New Blog Post
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Write and publish a new blog post on your website.
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
            onRemove={() => {}} // Not used in create mode
            disableRemove={true}
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
            {isSaving ? "Saving..." : "Publish Blog Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
