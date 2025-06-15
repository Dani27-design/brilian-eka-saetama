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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firestore, auth } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import AdminLayout from "@/components/Admin/AdminLayoutClient";
import Modal from "@/components/Admin/Modal";

// Define translations
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

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password,
      );

      // Store user data in Firestore
      const userRef = doc(firestore, "users", userCredential.user.uid);
      await setDoc(userRef, {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: true,
        createdAt: new Date(),
      });

      // Add user to local state
      setUsers((prev) => [
        ...prev,
        {
          id: userCredential.user.uid,
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
      setError(t.userCreateError);
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

      <div className="mb-4">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
        />
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
        {isLoading ? (
          <div className="py-8 text-center">{t.loading}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center">{t.noUsers}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-stroke bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black dark:border-strokedark dark:bg-gray-800 dark:text-white">
                  <th className="px-4 py-3">{t.name}</th>
                  <th className="px-4 py-3">{t.email}</th>
                  <th className="px-4 py-3">{t.role}</th>
                  <th className="px-4 py-3">{t.status}</th>
                  <th className="px-4 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {filteredUsers.map((user) => (
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            toggleUserStatus(user.id, user.isActive)
                          }
                          className={`rounded-lg px-2 py-1 text-xs ${
                            user.isActive
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {user.isActive ? t.deactivate : t.activate}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
