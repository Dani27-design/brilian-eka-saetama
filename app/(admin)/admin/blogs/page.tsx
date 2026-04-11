"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import BlogFiltersComponent, {
  BlogFilters,
} from "@/components/Admin/Blogs/BlogFilters";

const translations = {
  id: {
    title: "Manajemen Blog",
    description: "Kelola postingan blog website",
    addBlog: "Tambah Blog",
    titleCol: "Judul",
    metadataCol: "Deskripsi",
    publishDate: "Tanggal Publish",
    actions: "Aksi",
    edit: "Edit",
    delete: "Hapus",
    confirmDelete: "Yakin ingin menghapus blog ini?",
    noBlogs: "Belum ada postingan blog.",
    loading: "Memuat data blog...",
    itemsPerPage: "Item per halaman",
    page: "Halaman",
    of: "dari",
    showing: "Menampilkan",
    entries: "entri",
    error: "Terjadi kesalahan",
    deleted: "Blog berhasil dihapus",
    deleteError: "Gagal menghapus blog",
  },
  en: {
    title: "Blog Management",
    description: "Manage website blog posts",
    addBlog: "Add Blog",
    titleCol: "Title",
    metadataCol: "Description",
    publishDate: "Publish Date",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this blog?",
    noBlogs: "No blog posts yet.",
    loading: "Loading blogs...",
    itemsPerPage: "Items per page",
    page: "Page",
    of: "of",
    showing: "Showing",
    entries: "entries",
    error: "An error occurred",
    deleted: "Blog deleted successfully",
    deleteError: "Failed to delete blog",
  },
};

type Blog = {
  _id: string;
  title: string;
  metadata: string;
  mainImage?: string;
  publishDate?: string;
  createdAt?: string;
  author?: string;
};

const defaultFilters: BlogFilters = {
  search: "",
  author: "",
  startDate: "",
  endDate: "",
  sortBy: "publishDate",
  sortOrder: "desc",
};

export default function BlogsPage() {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  usePageHeader(t.title, t.description);

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [filters, setFilters] = useState<BlogFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const currentLang = language || "id";

  // Get unique authors from blogs
  const availableAuthors = Array.from(
    new Set(blogs.map((blog) => blog.author).filter(Boolean))
  ) as string[];

  // Fetch blogs
  const fetchBlogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const blogDoc = await getDocs(collection(firestore, "blog"));
      let blogData: any = {};
      blogDoc.forEach((doc) => {
        if (doc.id === "blogs") {
          blogData = doc.data();
        }
      });
      const blogsArray = blogData[currentLang] || [];
      // Sort by createdAt desc
      const sortedBlogs = [...blogsArray].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setBlogs(sortedBlogs);
    } catch (err) {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentLang]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Filtered blogs
  const filteredBlogs = blogs.filter((blog) => {
    // Search
    const matchesSearch =
      (blog.title || "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (blog.metadata || "").toLowerCase().includes(filters.search.toLowerCase());

    // Author filter
    const matchesAuthor =
      filters.author === "" || (blog.author || "") === filters.author;

    // Date filter
    let matchesDate = true;
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const blogDate = blog.publishDate ? new Date(blog.publishDate) : null;
      matchesDate = matchesDate && !!blogDate && blogDate >= startDate;
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const blogDate = blog.publishDate ? new Date(blog.publishDate) : null;
      matchesDate = matchesDate && !!blogDate && blogDate <= endDate;
    }

    return matchesSearch && matchesAuthor && matchesDate;
  });

  // Sort filtered blogs
  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    const order = filters.sortOrder === "asc" ? 1 : -1;
    if (filters.sortBy === "title") {
      return (a.title || "").localeCompare(b.title || "") * order;
    } else if (filters.sortBy === "publishDate") {
      const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
      const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
      return (dateA - dateB) * order;
    } else {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (dateA - dateB) * order;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedBlogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBlogs = sortedBlogs.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Delete blog
  const handleDeleteBlog = async (blogId: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        const updatedBlogs = blogs.filter((blog) => blog._id !== blogId);
        const blogDoc = await getDocs(collection(firestore, "blog"));
        let blogData: any = {};
        blogDoc.forEach((doc) => {
          if (doc.id === "blogs") {
            blogData = doc.data();
          }
        });
        blogData[currentLang] = updatedBlogs;
        await deleteDoc(doc(firestore, "blog", "blogs"));
        await setDoc(doc(firestore, "blog", "blogs"), blogData);
        setBlogs(updatedBlogs);
        setSuccessMessage(t.deleted);
      } catch (err) {
        setError(t.deleteError);
      }
    }
  };

  // Handle filter clear (preserveSearch pattern)
  const handleClearFilters = () => {
    setFilters({
      ...defaultFilters,
      search: filters.search, // Preserve search text
    });
  };

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/blogs/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
          {t.addBlog}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {/* Filter Component */}
      <div className="mb-6">
        <BlogFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          blogCount={blogs.length}
          filteredCount={sortedBlogs.length}
          availableAuthors={availableAuthors}
        />
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 animate-spin text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-2 text-gray-500">{t.loading}</p>
            </div>
          </div>
        ) : sortedBlogs.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {t.noBlogs}
            </h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-stroke bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3">{t.titleCol}</th>
                    <th className="px-4 py-3">{t.metadataCol}</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">{t.publishDate}</th>
                    <th className="px-4 py-3">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {currentBlogs.map((blog) => (
                    <tr
                      key={blog._id}
                      className="text-sm text-black hover:bg-gray-50"
                    >
                      <td className="flex items-center gap-2 px-4 py-3">
                        {blog.title || "-"}
                      </td>
                      <td className="px-4 py-3">{blog.metadata || "-"}</td>
                      <td className="px-4 py-3">{blog.author || "-"}</td>
                      <td className="px-4 py-3">
                        {blog.publishDate
                          ? new Date(blog.publishDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/blogs/edit/${blog._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mr-1 h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6"
                              />
                            </svg>
                            {t.edit}
                          </Link>
                          <button
                            onClick={() => handleDeleteBlog(blog._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mr-1 h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            {t.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t border-stroke pt-4 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                {t.showing} {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, sortedBlogs.length)} {t.of}{" "}
                {sortedBlogs.length} {t.entries}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {t.itemsPerPage}:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-stroke bg-transparent px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === 1
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-sm text-gray-600">
                  {t.page} <span className="font-medium">{currentPage}</span>{" "}
                  {t.of} {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
