"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import BlogPreview from "./BlogPreview";
import ImageUploader from "./ImageUploader";
import { Blog } from "@/types/blog";
import { EditorState } from "draft-js";
import { stateFromHTML } from "draft-js-import-html";
import debounce from "lodash/debounce";
import BlogItemEditor from "./BlogItemEditor";

// Dynamically import our SimpleBlogEditor component with SSR disabled
const SimpleBlogEditor = dynamic(() => import("./SimpleBlogEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[250px] items-center justify-center bg-gray-50 dark:bg-gray-800">
      <p className="text-gray-500">Loading editor...</p>
    </div>
  ),
});

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
  const [activeTab, setActiveTab] = useState<string>(language || "id");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [blogItems, setBlogItems] = useState<Blog[]>([]);
  const [editorStates, setEditorStates] = useState<{
    [key: string]: EditorState;
  }>({});

  // Modify this useEffect to be less aggressive with updates

  // Replace this useEffect:
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

  // With this debounced version:
  useEffect(() => {
    // Skip preview updates during typing to prevent lag
    if (
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA"
    ) {
      return;
    }

    // Use a timeout to debounce expensive operations
    const updateTimer = setTimeout(() => {
      // Only update preview data when typing has stopped
      const updatedData = { ...fullBlogData };

      // Just update the current document
      if (documentId) {
        updatedData[documentId] = formData;
      }

      setFullBlogData(updatedData);
    }, 500); // Longer delay for preview updates

    return () => clearTimeout(updateTimer);
  }, [formData, documentId]);

  // Add a separate effect for initial data loading that doesn't run on every change
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

        setFullBlogData(data);
      } catch (error) {
        console.error("Error fetching blog data:", error);
      }
    };

    fetchBlogData();
  }, [documentId, activeTab]); // Only reload when document or language changes

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

  // Initialize editor states from HTML content
  useEffect(() => {
    let mounted = true;

    if (blogItems.length > 0) {
      // Use setTimeout to ensure component is mounted
      setTimeout(() => {
        if (!mounted) return;

        const states = {};
        blogItems.forEach((blog, index) => {
          // Only update if we don't already have an editor state for this index
          if (!editorStates[index]) {
            if (blog.content) {
              try {
                const contentState = stateFromHTML(blog.content);
                states[index] = EditorState.createWithContent(contentState);
              } catch (e) {
                console.error("Failed to parse HTML content:", e);
                states[index] = EditorState.createEmpty();
              }
            } else {
              states[index] = EditorState.createEmpty();
            }
          }
        });

        if (Object.keys(states).length > 0) {
          setEditorStates((prev) => ({ ...prev, ...states }));
        }
      }, 0);
    }

    return () => {
      mounted = false;
    };
  }, [blogItems]); // Remove editorStates from dependency to prevent loops

  // Optimized form change handler with direct updates for typing
  const handleFormChange = (value: any) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: value,
    }));
  };

  // For blog items, separate immediate and debounced updates
  const handleBlogItemChangeImmediate = (
    index: number,
    field: string,
    value: any,
  ) => {
    // Fields that need immediate feedback but don't affect the preview much
    const newBlogItems = [...blogItems];
    newBlogItems[index] = { ...newBlogItems[index], [field]: value };
    setBlogItems(newBlogItems);
  };

  // Debounced update for preview and other components
  const debouncedBlogUpdate = useCallback(
    debounce((items) => {
      handleFormChange(items);
    }, 500),
    [activeTab],
  );

  const handleBlogItemChange = (index: number, field: string, value: any) => {
    const newBlogItems = [...blogItems];
    newBlogItems[index] = { ...newBlogItems[index], [field]: value };

    // Always update local state immediately for responsive UI
    setBlogItems(newBlogItems);

    // For text fields, use the debounced update to prevent lag
    if (["title", "slug", "metadata", "author"].includes(field)) {
      debouncedBlogUpdate(newBlogItems);
    } else {
      // For other fields like images or content, update immediately
      handleFormChange(newBlogItems);
    }
  };

  // Add this new optimized handler specifically for text input fields
  const handleTextInputChange = (index: number, field: string, value: any) => {
    // Direct DOM update for immediate feedback without re-rendering the whole component
    const newBlogItems = [...blogItems];
    newBlogItems[index] = { ...newBlogItems[index], [field]: value };

    // Update local state only
    setBlogItems(newBlogItems);

    // Use a more aggressive debounce for text fields
    textUpdateDebounce(index, field, value, newBlogItems);
  };

  // Create a more aggressive debounce specifically for text typing
  const textUpdateDebounce = useCallback(
    debounce((index, field, value, items) => {
      // Only after typing stops, update parent state
      handleFormChange(items);
    }, 300), // shorter delay for better responsiveness
    [activeTab],
  );

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
                <BlogItemEditor
                  key={blog._id || index}
                  blog={blog}
                  index={index}
                  onRemove={removeBlogItem}
                  onTextChange={handleBlogItemChange}
                  onContentChange={handleBlogItemChange}
                  activeTab={activeTab}
                />
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

  // Memoize the form fields to prevent unnecessary re-renders
  const memoizedFormFields = useMemo(() => {
    return renderFormFields();
  }, [documentId, activeTab, blogItems]); // Only re-render when these change

  return (
    <div className="space-y-8">
      {/* Blog preview component */}
      {useMemo(
        () => (
          <BlogPreview
            data={fullBlogData}
            activeSection={documentId}
            onEditSection={handleEditSection}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        ),
        [fullBlogData, documentId, previewMode],
      )}

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

        <div className="h-fit">{memoizedFormFields}</div>

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
