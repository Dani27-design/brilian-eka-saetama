"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import BlogItemEditor from "@/components/Admin/BlogItemEditor";
import { Blog } from "@/types/blog";
import Link from "next/link";
import { usePageHeader } from "@/app/context/PageHeaderContext";

export default function EditBlogPage({ params }) {
  const blogId = params.id;
  const router = useRouter();
  const { language } = useLanguage();
  const currentLang = language || "id";

  usePageHeader("Edit Blog", "Perbarui konten postingan blog.");

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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Memuat data blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error || "Blog tidak ditemukan"}</p>
        <Link
          href="/admin/blogs"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Blog
        </Link>
      </div>
    );
  }

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

      {/* Blog Edit Form Container */}
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
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
