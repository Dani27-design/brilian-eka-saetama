"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { usePageHeader } from "@/app/context/PageHeaderContext";
import Modal from "@/components/Admin/Modal";
import PasswordInput from "@/components/Admin/PasswordInput";
import UserActionsComponent, {
  UserFilters,
} from "@/components/Admin/Users/UserFilters";

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
    showing: "Menampilkan",
    entries: "pengguna",
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
    showing: "Showing",
    entries: "users",
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

const defaultFilters: UserFilters = {
  search: "",
  role: "",
  status: "",
  startDate: "",
  endDate: "",
  sortBy: "name",
  sortOrder: "asc",
};

export default function UserManagementPage() {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  usePageHeader(t.title, t.description);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>(defaultFilters);
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
            isActive: data.isActive !== false,
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Apply all filters to the users
  const filteredUsers = users.filter((user) => {
    // Search term filter
    const matchesSearch =
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.name.toLowerCase().includes(filters.search.toLowerCase());

    // Role filter
    const matchesRole = filters.role === "" || user.role === filters.role;

    // Status filter
    const matchesStatus =
      filters.status === "" ||
      (filters.status === "active" && user.isActive) ||
      (filters.status === "inactive" && !user.isActive);

    // Date range filter
    let matchesDateRange = true;

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      matchesDateRange = matchesDateRange && user.createdAt >= startDate;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && user.createdAt <= endDate;
    }

    return matchesSearch && matchesRole && matchesStatus && matchesDateRange;
  });

  // Sort filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const order = filters.sortOrder === "asc" ? 1 : -1;
    if (filters.sortBy === "name") {
      return a.name.localeCompare(b.name) * order;
    } else if (filters.sortBy === "email") {
      return a.email.localeCompare(b.email) * order;
    } else {
      return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

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
    setCurrentPage(1);
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
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        await deleteDoc(doc(firestore, "users", userId));
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        setSuccessMessage(t.userDeleted);
      } catch (error) {
        console.error("Error deleting user:", error);
        setError(t.userDeleteError);
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
    <div className="flex h-full flex-col">
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
      <div className="mb-4">
        <UserActionsComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          userCount={users.length}
          filteredCount={sortedUsers.length}
          onAddUser={() => setShowCreateModal(true)}
          addUserLabel={t.addUser}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm">
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
        ) : sortedUsers.length === 0 ? (
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
              {t.noUsers}
            </h3>
          </div>
        ) : (
          <>
            <div className="styled-scrollbar min-h-0 flex-1 overflow-auto">
              <table className="w-full table-auto">
                <thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3">{t.name}</th>
                    <th className="px-4 py-3">{t.email}</th>
                    <th className="px-4 py-3">{t.role}</th>
                    <th className="px-4 py-3">{t.status}</th>
                    <th className="px-4 py-3">{t.createdAt}</th>
                    <th className="px-4 py-3">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="text-sm text-black hover:bg-blue-50/50"
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
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/users/edit/${user.id}`}
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            {t.edit}
                          </Link>
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id, user.isActive)
                            }
                            className="flex w-24 items-center justify-center whitespace-nowrap rounded-lg border border-gray-300 bg-white px-1.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
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
            <div className="my-0 flex flex-col items-center justify-between space-y-3 border-t border-stroke p-2 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                {t.showing} {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, sortedUsers.length)} {t.of}{" "}
                {sortedUsers.length} {t.entries}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{t.itemsPerPage}:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="rounded-md border border-stroke bg-white px-2 py-1 text-sm outline-none focus:border-primary"
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
                      ? "cursor-not-allowed border-gray-200 bg-blue-50/50 text-gray-400"
                      : "border-stroke bg-white hover:bg-blue-50"
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
                      ? "cursor-not-allowed border-gray-200 bg-blue-50/50 text-gray-400"
                      : "border-stroke bg-white hover:bg-blue-50"
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.createUserTitle}
      >
        <form onSubmit={handleCreateUser}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-black"
            >
              {t.email}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-black"
            >
              {t.name}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={newUser.name}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-medium text-black"
            >
              {t.role}
            </label>
            <select
              id="role"
              name="role"
              value={newUser.role}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none focus:border-primary"
            >
              <option value="admin">{t.adminRole}</option>
              <option value="engineer">{t.engineerRole}</option>
              <option value="user">{t.userRole}</option>
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-black"
            >
              {t.password}
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none focus:border-primary"
              required
              minLength={6}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-black"
            >
              {t.confirmPassword}
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={newUser.confirmPassword}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
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
    </div>
  );
}
