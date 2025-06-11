"use client";

import { useState, useRef, memo, useEffect } from "react";
import ImageUploader from "./ImageUploader";
import dynamic from "next/dynamic";
import { Blog } from "@/types/blog";

const SimpleBlogEditor = dynamic(() => import("./SimpleBlogEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[250px] items-center justify-center bg-gray-50 dark:bg-gray-800">
      <p className="text-gray-500">Loading editor...</p>
    </div>
  ),
});

interface BlogItemEditorProps {
  blog: Blog;
  index: number;
  onRemove: (index: number) => void;
  onTextChange: (index: number, field: string, value: string) => void;
  onContentChange: (index: number, field: string, value: string) => void;
  activeTab: string;
}

const BlogItemEditor = memo(
  ({
    blog,
    index,
    onRemove,
    onTextChange,
    onContentChange,
    activeTab,
  }: BlogItemEditorProps) => {
    // Local state for text inputs to prevent re-renders of parent
    const [localFields, setLocalFields] = useState({
      title: blog.title || "",
      slug: blog.slug || "",
      metadata: blog.metadata || "",
      author: blog.author || "",
    });

    // Update local state when props change (rare, but could happen from outside)
    useEffect(() => {
      setLocalFields({
        title: blog.title || "",
        slug: blog.slug || "",
        metadata: blog.metadata || "",
        author: blog.author || "",
      });
    }, [blog._id]); // Only update when blog ID changes, not on every prop change

    // Refs for tracking if input is being edited
    const isEditingRef = useRef(false);

    // Sync timer ref
    const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle local text changes without propagating to parent yet
    const handleLocalTextChange = (field: string, value: string) => {
      setLocalFields((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Mark as editing
      isEditingRef.current = true;

      // Clear existing timer
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      // Set a new timer to sync with parent
      syncTimerRef.current = setTimeout(() => {
        onTextChange(index, field, value);
        isEditingRef.current = false;
      }, 300);
    };

    return (
      <div className="mb-8 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-700">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium text-black dark:text-white">
            Blog Post {index + 1}
          </h3>
          <button
            type="button"
            onClick={() => onRemove(index)}
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
              value={localFields.title}
              onChange={(e) => handleLocalTextChange("title", e.target.value)}
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
              value={localFields.slug}
              onChange={(e) => handleLocalTextChange("slug", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="my-blog-post"
            />
            <p className="mt-1 text-xs text-gray-500">
              URL-friendly version of the title (no spaces, use hyphens)
            </p>
          </div>

          {/* Blog Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Description
            </label>
            <textarea
              value={localFields.metadata}
              onChange={(e) =>
                handleLocalTextChange("metadata", e.target.value)
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
              onChange={(url) => onTextChange(index, "mainImage", url)}
              folder={`blog/${activeTab}/images`}
              aspectRatio="landscape"
            />
          </div>

          {/* Blog Content Editor */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Content
            </label>
            <SimpleBlogEditor
              initialContent={blog.content || ""}
              onChange={(content) => onContentChange(index, "content", content)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use markdown to format your content. You can add bold with
              **text**, links with [text](url), etc.
            </p>
          </div>

          {/* Blog Author */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Blog Author
            </label>
            <input
              type="text"
              value={localFields.author}
              onChange={(e) => handleLocalTextChange("author", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Author Name"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the name of the author for this blog post.
            </p>
          </div>
        </div>
      </div>
    );
  },
);

BlogItemEditor.displayName = "BlogItemEditor";
export default BlogItemEditor;
