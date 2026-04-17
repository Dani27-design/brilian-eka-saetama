"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import BlogItemEditor from "@/components/Admin/BlogItemEditor";
import { Blog } from "@/types/blog";
import Link from "next/link";
import { usePageHeader } from "@/app/context/PageHeaderContext";

export default function CreateBlogPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const currentLang = language || "id";
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageHeader("Tambah Blog Baru", "Tulis dan terbitkan postingan blog baru.");

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
    <div className="flex h-full flex-col">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/admin/blogs"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Blog
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
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

      {/* Blog Form Container */}
      <div className="styled-scrollbar flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto mb-6">
            <BlogItemEditor
              blog={blog}
              index={0}
              onTextChange={handleTextChange}
              onContentChange={handleContentChange}
              activeTab={currentLang}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/blogs"
              className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Terbitkan Blog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
