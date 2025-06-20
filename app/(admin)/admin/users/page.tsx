"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { firestore, auth } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import Modal from "@/components/Admin/Modal";

// Add to translations
const translations = {
  id: {
    title: "Manajemen Pengguna",
    description: "Kelola akun admin untuk website",
    addUser: "Tambah Pengguna",
    email: "Email",
    name: "Nama",
    role: "Peran",
    status: "Status",
    actions: "Aksi",
    active: "Aktif",
    inactive: "Nonaktif",
    edit: "Edit",
    delete: "Hapus",
    deactivate: "Nonaktifkan",
    activate: "Aktifkan",
    confirmDelete: "Yakin ingin menghapus pengguna ini?",
    noUsers: "Belum ada pengguna yang terdaftar.",
    loading: "Memuat data pengguna...",
    searchPlaceholder: "Cari pengguna...",
    createUserTitle: "Buat Pengguna Baru",
    password: "Kata Sandi",
    confirmPassword: "Konfirmasi Kata Sandi",
    createUser: "Buat Pengguna",
    cancel: "Batal",
    passwordMismatch: "Kata sandi tidak cocok",
    userCreated: "Pengguna berhasil dibuat",
    userCreateError: "Terjadi kesalahan saat membuat pengguna",
    userDeleted: "Pengguna berhasil dihapus",
    userDeleteError: "Terjadi kesalahan saat menghapus pengguna",
    statusUpdated: "Status pengguna berhasil diperbarui",
    statusUpdateError: "Terjadi kesalahan saat memperbarui status pengguna",
    emailRequired: "Email diperlukan",
    nameRequired: "Nama diperlukan",
    passwordRequired: "Kata sandi diperlukan",
    passwordTooShort: "Kata sandi minimal 6 karakter",
    adminRole: "Admin",
    engineerRole: "Engineer",
    userRole: "Pengguna",
    createdAt: "Tanggal Dibuat",
    itemsPerPage: "Item per halaman",
    page: "Halaman",
    of: "dari",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    showing: "Menampilkan",
    entries: "entri",
    filter: "Filter",
    filterRole: "Filter Peran",
    filterStatus: "Filter Status",
    filterDate: "Filter Tanggal",
    allRoles: "Semua Peran",
    allStatuses: "Semua Status",
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Akhir",
    applyFilter: "Terapkan",
    resetFilter: "Reset",
    clearDates: "Hapus Tanggal",
  },
  en: {
    title: "User Management",
    description: "Manage admin accounts for the website",
    addUser: "Add User",
    email: "Email",
    name: "Name",
    role: "Role",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    delete: "Delete",
    deactivate: "Deactivate",
    activate: "Activate",
    confirmDelete: "Are you sure you want to delete this user?",
    noUsers: "No users registered yet.",
    loading: "Loading users...",
    searchPlaceholder: "Search users...",
    createUserTitle: "Create New User",
    password: "Password",
    confirmPassword: "Confirm Password",
    createUser: "Create User",
    cancel: "Cancel",
    passwordMismatch: "Passwords do not match",
    userCreated: "User created successfully",
    userCreateError: "Error creating user",
    userDeleted: "User deleted successfully",
    userDeleteError: "Error deleting user",
    statusUpdated: "User status updated successfully",
    statusUpdateError: "Error updating user status",
    emailRequired: "Email is required",
    nameRequired: "Name is required",
    passwordRequired: "Password is required",
    passwordTooShort: "Password must be at least 6 characters",
    adminRole: "Admin",
    engineerRole: "Engineer",
    userRole: "User",
    createdAt: "Created At",
    itemsPerPage: "Items per page",
    page: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
    showing: "Showing",
    entries: "entries",
    filter: "Filter",
    filterRole: "Filter Role",
    filterStatus: "Filter Status",
    filterDate: "Filter Date",
    allRoles: "All Roles",
    allStatuses: "All Statuses",
    startDate: "Start Date",
    endDate: "End Date",
    applyFilter: "Apply",
    resetFilter: "Reset",
    clearDates: "Clear Dates",
  },
};

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

export default function UserManagementPage() {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "admin",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const router = useRouter();

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(firestore, "users"));
        const querySnapshot = await getDocs(usersQuery);

        const userData: User[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userData.push({
            id: doc.id,
            email: data.email || "",
            name: data.name || "",
            role: data.role || "user",
            isActive: data.isActive !== false, // Default to true if not specified
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });

        setUsers(userData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, startDateFilter, endDateFilter]);

  // Apply all filters to the users
  const filteredUsers = users.filter((user) => {
    // Search term filter
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === null || user.role === roleFilter;

    // Status filter
    const matchesStatus =
      statusFilter === null || user.isActive === statusFilter;

    // Date range filter
    let matchesDateRange = true;

    if (startDateFilter) {
      const startDate = new Date(startDateFilter);
      startDate.setHours(0, 0, 0, 0);
      matchesDateRange = matchesDateRange && user.createdAt >= startDate;
    }

    if (endDateFilter) {
      const endDate = new Date(endDateFilter);
      endDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && user.createdAt <= endDate;
    }

    return matchesSearch && matchesRole && matchesStatus && matchesDateRange;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle user input for new user form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validate form
    if (!newUser.email) return setError(t.emailRequired);
    if (!newUser.name) return setError(t.nameRequired);
    if (!newUser.password) return setError(t.passwordRequired);
    if (newUser.password.length < 6) return setError(t.passwordTooShort);
    if (newUser.password !== newUser.confirmPassword)
      return setError(t.passwordMismatch);

    try {
      // Call your API endpoint instead of using Firebase Auth directly
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.userCreateError);
      }

      // Add user to local state
      setUsers((prev) => [
        ...prev,
        {
          id: data.userId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isActive: true,
          createdAt: new Date(),
        },
      ]);

      setSuccessMessage(t.userCreated);
      setShowCreateModal(false);
      setNewUser({
        email: "",
        name: "",
        role: "admin",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as Error).message
          : t.userCreateError,
      );
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
      });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: !currentStatus } : user,
        ),
      );

      setSuccessMessage(t.statusUpdated);
    } catch (error) {
      console.error("Error updating user status:", error);
      setError(t.statusUpdateError);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (window.confirm(t.confirmDelete)) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(firestore, "users", userId));

        // Update local state
        setUsers((prev) => prev.filter((user) => user.id !== userId));

        setSuccessMessage(t.userDeleted);
      } catch (error) {
        console.error("Error deleting user:", error);
        setError(t.userDeleteError);
      }
    }
  };

  // Handle filter reset
  const resetFilters = () => {
    setRoleFilter(null);
    setStatusFilter(null);
    setStartDateFilter("");
    setEndDateFilter("");
    setSearchTerm("");
  };

  const clearDateFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t.description}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
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
          {t.addUser}
        </button>
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
          {/* Search field */}
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

          {/* Role filter */}
          <div className="w-full sm:w-auto">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t.filterRole}
            </label>
            <select
              value={roleFilter || ""}
              onChange={(e) => setRoleFilter(e.target.value || null)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
            >
              <option value="">{t.allRoles}</option>
              <option value="admin">{t.adminRole}</option>
              <option value="engineer">{t.engineerRole}</option>
              <option value="user">{t.userRole}</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-auto">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t.filterStatus}
            </label>
            <select
              value={
                statusFilter === null
                  ? ""
                  : statusFilter
                  ? "active"
                  : "inactive"
              }
              onChange={(e) => {
                if (e.target.value === "") setStatusFilter(null);
                else setStatusFilter(e.target.value === "active");
              }}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
            >
              <option value="">{t.allStatuses}</option>
              <option value="active">{t.active}</option>
              <option value="inactive">{t.inactive}</option>
            </select>
          </div>

          {/* Date range filter */}
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
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center">{t.noUsers}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-stroke bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black dark:border-strokedark dark:bg-gray-800 dark:text-white">
                    <th className="px-4 py-3">{t.name}</th>
                    <th className="px-4 py-3">{t.email}</th>
                    <th className="px-4 py-3">{t.role}</th>
                    <th className="px-4 py-3">{t.status}</th>
                    <th className="px-4 py-3">{t.createdAt}</th>
                    <th className="px-4 py-3">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="text-sm text-black dark:text-white"
                    >
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        {user.role === "admin"
                          ? t.adminRole
                          : user.role === "engineer"
                          ? t.engineerRole
                          : t.userRole}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? t.active : t.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id, user.isActive)
                            }
                            className={`flex w-24 items-center justify-center whitespace-nowrap rounded-lg px-1.5 py-1.5 text-xs font-medium transition-colors ${
                              user.isActive
                                ? "bg-blue-200 text-gray-800 hover:bg-yellow-200"
                                : "bg-blue-200 text-gray-800 hover:bg-green-200"
                            }`}
                          >
                            {user.isActive ? (
                              <>
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
                                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {t.deactivate}
                              </>
                            ) : (
                              <>
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {t.activate}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
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
                {Math.min(indexOfLastItem, filteredUsers.length)} {t.of}{" "}
                {filteredUsers.length} {t.entries}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.itemsPerPage}:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
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

      {/* Use the Modal component instead of inline JSX */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.createUserTitle}
      >
        <form onSubmit={handleCreateUser}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-black dark:text-white"
            >
              {t.email}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-black dark:text-white"
            >
              {t.name}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={newUser.name}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-medium text-black dark:text-white"
            >
              {t.role}
            </label>
            <select
              id="role"
              name="role"
              value={newUser.role}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
            >
              <option value="admin">{t.adminRole}</option>
              <option value="engineer">{t.engineerRole}</option>
              <option value="user">{t.userRole}</option>
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-black dark:text-white"
            >
              {t.password}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
              minLength={6}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-black dark:text-white"
            >
              {t.confirmPassword}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={newUser.confirmPassword}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
            >
              {t.createUser}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
