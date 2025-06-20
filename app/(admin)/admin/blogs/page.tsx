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
import Image from "next/image";

// Simple translation (expand as needed)
const translations = {
  id: {
    title: "Manajemen Blog",
    description: "Kelola postingan blog website",
    addBlog: "Tambah Blog",
    searchPlaceholder: "Cari judul atau deskripsi...",
    publishDate: "Tanggal Publish",
    titleCol: "Judul",
    metadataCol: "Deskripsi",
    actions: "Aksi",
    edit: "Edit",
    delete: "Hapus",
    confirmDelete: "Yakin ingin menghapus blog ini?",
    noBlogs: "Belum ada postingan blog.",
    loading: "Memuat data blog...",
    itemsPerPage: "Item per halaman",
    page: "Halaman",
    of: "dari",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    showing: "Menampilkan",
    entries: "entri",
    filterDate: "Filter Tanggal",
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Akhir",
    resetFilter: "Reset",
    clearDates: "Hapus Tanggal",
    error: "Terjadi kesalahan",
    retry: "Coba Lagi",
    created: "Blog berhasil dibuat",
    deleted: "Blog berhasil dihapus",
    deleteError: "Gagal menghapus blog",
  },
  en: {
    title: "Blog Management",
    description: "Manage website blog posts",
    addBlog: "Add Blog",
    searchPlaceholder: "Search title or description...",
    publishDate: "Publish Date",
    titleCol: "Title",
    metadataCol: "Description",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this blog?",
    noBlogs: "No blog posts yet.",
    loading: "Loading blogs...",
    itemsPerPage: "Items per page",
    page: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
    showing: "Showing",
    entries: "entries",
    filterDate: "Filter Date",
    startDate: "Start Date",
    endDate: "End Date",
    resetFilter: "Reset",
    clearDates: "Clear Dates",
    error: "An error occurred",
    retry: "Retry",
    created: "Blog created successfully",
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
  author?: string; // Tambahkan author
};

export default function BlogsPage() {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState<string>(""); // Tambahkan state untuk filter author
  const currentLang = language || "id";

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

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDateFilter, endDateFilter]);

  // Ambil daftar author unik dari blogs
  const authorOptions = Array.from(
    new Set(blogs.map((blog) => blog.author).filter(Boolean)),
  );

  // Filtered blogs
  const filteredBlogs = blogs.filter((blog) => {
    // Search
    const matchesSearch =
      (blog.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.metadata || "").toLowerCase().includes(searchTerm.toLowerCase());
    // Author filter
    const matchesAuthor = !authorFilter || (blog.author || "") === authorFilter;
    // Date filter
    let matchesDate: Boolean = true;
    if (startDateFilter) {
      const startDate = new Date(startDateFilter);
      startDate.setHours(0, 0, 0, 0);
      const blogDate = blog.publishDate ? new Date(blog.publishDate) : null;
      matchesDate = matchesDate && !!blogDate && blogDate >= startDate;
    }
    if (endDateFilter) {
      const endDate = new Date(endDateFilter);
      endDate.setHours(23, 59, 59, 999);
      const blogDate = blog.publishDate ? new Date(blog.publishDate) : null;
      matchesDate = matchesDate && !!blogDate && blogDate! <= endDate;
    }
    return matchesSearch && matchesAuthor && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);

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
        // Remove from local
        const updatedBlogs = blogs.filter((blog) => blog._id !== blogId);
        // Update Firestore
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

  const resetFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
    setSearchTerm("");
    setAuthorFilter(""); // Reset filter author
  };

  const clearDateFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
  };

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-4 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            {t.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t.description}
          </p>
        </div>
        <Link
          href="/admin/blogs/create"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 sm:mt-0"
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
          {t.addBlog}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {/* Filter section */}
      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="w-full sm:w-64">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t.searchPlaceholder}
            </label>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
            />
          </div>
          {/* Author filter */}
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Author
            </label>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
            >
              <option value="">All</option>
              {authorOptions.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>
          {/* Date filter */}
          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t.startDate}
              </label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t.endDate}
              </label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            {(startDateFilter || endDateFilter) && (
              <button
                onClick={clearDateFilters}
                className="mb-0.5 text-xs text-primary hover:underline"
              >
                {t.clearDates}
              </button>
            )}
          </div>
          {/* Filter actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="rounded-lg border border-stroke px-4 py-2 text-xs font-medium hover:bg-gray-100 dark:border-strokedark dark:hover:bg-gray-800"
            >
              {t.resetFilter}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
        {isLoading ? (
          <div className="py-8 text-center">{t.loading}</div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-8 text-center">{t.noBlogs}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-stroke bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black dark:border-strokedark dark:bg-gray-800 dark:text-white">
                    <th className="px-4 py-3">{t.titleCol}</th>
                    <th className="px-4 py-3">{t.metadataCol}</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">{t.publishDate}</th>
                    <th className="px-4 py-3">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {currentBlogs.map((blog) => (
                    <tr
                      key={blog._id}
                      className="text-sm text-black dark:text-white"
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
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/blogs/edit/${blog._id}`}
                            className="flex w-14 items-center justify-center whitespace-nowrap rounded-lg bg-blue-200 px-1.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-yellow-200"
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
                            className="flex w-18 items-center justify-center whitespace-nowrap rounded-lg border border-red-300 bg-white px-1.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
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
            <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t border-stroke pt-4 dark:border-strokedark sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t.showing} {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredBlogs.length)} {t.of}{" "}
                {filteredBlogs.length} {t.entries}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.itemsPerPage}:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-stroke bg-transparent px-2 py-1 text-sm dark:border-strokedark dark:text-white"
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
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                      : "border-stroke bg-white hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:hover:bg-gray-800"
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
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.page} <span className="font-medium">{currentPage}</span>{" "}
                  {t.of} {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                      : "border-stroke bg-white hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:hover:bg-gray-800"
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
