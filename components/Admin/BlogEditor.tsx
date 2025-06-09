"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import BlogPreview from "./BlogPreview";
import ImageUploader from "./ImageUploader";
import { Blog } from "@/types/blog";

interface BlogEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const BlogEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: BlogEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullBlogData, setFullBlogData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [blogItems, setBlogItems] = useState<Blog[]>([]);

  // Load all blog-related data for the preview
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        const docTypes = [
          "blog_title",
          "blog_subtitle",
          "blog_description",
          "blogs",
        ];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "blog", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        // If current document is one of these, use our form data for preview
        if (docTypes.includes(documentId)) {
          data[documentId] = formData;
        }

        setFullBlogData(data);

        // Special handling for blog items
        if (documentId === "blogs" && formData && formData[activeTab]) {
          try {
            const blogData = formData[activeTab];
            setBlogItems(Array.isArray(blogData) ? blogData : []);
          } catch (e) {
            console.error("Failed to process blog items:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching blog data:", error);
      }
    };

    fetchBlogData();
  }, [documentId, formData, activeTab]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);

      // Special handling for blog items
      if (documentId === "blogs" && initialData[activeTab]) {
        try {
          const blogData = initialData[activeTab];
          setBlogItems(Array.isArray(blogData) ? blogData : []);
        } catch (e) {
          console.error("Failed to process blog items:", e);
        }
      }
    }
  }, [initialData, documentId, activeTab]);

  // Handle form data change
  const handleFormChange = (value: any) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: value,
    }));
  };

  // Handle blog item changes
  const handleBlogItemChange = (index: number, field: string, value: any) => {
    const newBlogItems = [...blogItems];
    newBlogItems[index] = { ...newBlogItems[index], [field]: value };
    setBlogItems(newBlogItems);
    handleFormChange(newBlogItems);
  };

  const addBlogItem = () => {
    const newBlogItem: Blog = {
      _id: Date.now(),
      title: "New Blog Post",
      metadata: "Enter blog description here",
      mainImage: "",
      slug: `blog-post-${Date.now()}`,
    };
    const newBlogItems = [...blogItems, newBlogItem];
    setBlogItems(newBlogItems);
    handleFormChange(newBlogItems);
  };

  const removeBlogItem = (index: number) => {
    const newBlogItems = blogItems.filter((_, i) => i !== index);
    setBlogItems(newBlogItems);
    handleFormChange(newBlogItems);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/blog/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "blog_title":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Blog Section Title
              </label>
              <input
                type="text"
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en" ? "NEWS & BLOGS" : "BERITA & BLOG"
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the main title for the blog section
              </p>
            </div>
          </div>
        );

      case "blog_subtitle":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Blog Section Subtitle
              </label>
              <input
                type="text"
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Latest News & Blogs"
                    : "Berita & Blog Terbaru"
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the subtitle for the blog section
              </p>
            </div>
          </div>
        );

      case "blog_description":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Blog Section Description
              </label>
              <textarea
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange(e.target.value)}
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Stay updated with the latest insights and developments in fire safety, industry trends, and our services."
                    : "Tetap update dengan informasi terbaru tentang keamanan kebakaran, tren industri, dan layanan kami."
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the description for the blog section
              </p>
            </div>
          </div>
        );

      case "blogs":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Blog Posts
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit, or remove blog posts below.
              </p>

              {blogItems.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No blog posts yet. Add one below.
                </div>
              )}

              {blogItems.map((blog, index) => (
                <div
                  key={blog._id || index}
                  className="mb-8 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-medium text-black dark:text-white">
                      Blog Post {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeBlogItem(index)}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Remove Post
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Blog Title */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Blog Title
                      </label>
                      <input
                        type="text"
                        value={blog.title || ""}
                        onChange={(e) =>
                          handleBlogItemChange(index, "title", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Blog Slug */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Blog Slug (URL)
                      </label>
                      <input
                        type="text"
                        value={blog.slug || ""}
                        onChange={(e) =>
                          handleBlogItemChange(index, "slug", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="my-blog-post"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        URL-friendly version of the title (no spaces, use
                        hyphens)
                      </p>
                    </div>

                    {/* Blog Description */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Blog Description
                      </label>
                      <textarea
                        value={blog.metadata || ""}
                        onChange={(e) =>
                          handleBlogItemChange(
                            index,
                            "metadata",
                            e.target.value,
                          )
                        }
                        className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Blog Image */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Blog Image
                      </label>
                      <ImageUploader
                        value={blog.mainImage || ""}
                        onChange={(url) =>
                          handleBlogItemChange(index, "mainImage", url)
                        }
                        folder={`blog/${activeTab}/images`}
                        aspectRatio="landscape"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBlogItem}
                className="mt-4 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm text-primary hover:bg-primary/5 dark:bg-transparent"
              >
                + Add Blog Post
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="rounded-md border bg-yellow-50 p-4 text-yellow-700">
            <p>No specific editor available for this document type.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Blog preview component */}
      <BlogPreview
        data={fullBlogData}
        activeSection={documentId}
        onEditSection={handleEditSection}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black"
      >
        <h2 className="mb-4 text-xl font-bold capitalize">Form Editor</h2>

        {/* Language tabs */}
        <div className="mb-4 border-b border-stroke dark:border-strokedark">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("en")}
              className={`px-4 py-2 ${
                activeTab === "en"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("id")}
              className={`px-4 py-2 ${
                activeTab === "id"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Indonesia
            </button>
          </div>
        </div>

        <div className="h-fit">{renderFormFields()}</div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-stroke bg-white px-4 py-2 hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogEditor;
