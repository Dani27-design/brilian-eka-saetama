"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore, auth } from "@/db/firebase/firebaseConfig";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/app/context/AdminContext";
import { useLanguage } from "@/app/context/LanguageContext";
import PasswordInput from "@/components/Admin/PasswordInput";

// Types
interface UserForm {
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  password: string; // Optional - only update if provided
  confirmPassword: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

// Translations
const translations = {
  id: {
    title: "Edit Pengguna",
    description: "Edit informasi pengguna dan kata sandi",
    backToUsers: "Kembali ke Manajemen Pengguna",
    userInfo: "Informasi Pengguna",
    name: "Nama",
    email: "Email",
    role: "Peran",
    status: "Status",
    password: "Kata Sandi Baru",
    confirmPassword: "Konfirmasi Kata Sandi",
    passwordHint: "Kosongkan jika tidak ingin mengubah kata sandi",
    active: "Aktif",
    inactive: "Nonaktif",
    adminRole: "Admin",
    engineerRole: "Engineer",
    userRole: "Pengguna",
    save: "Simpan Perubahan",
    cancel: "Batal",
    loading: "Memuat data pengguna...",
    saving: "Menyimpan...",
    userNotFound: "Pengguna tidak ditemukan",
    userUpdated: "Pengguna berhasil diperbarui",
    updateError: "Terjadi kesalahan saat memperbarui pengguna",
    nameRequired: "Nama diperlukan",
    emailRequired: "Email diperlukan",
    passwordTooShort: "Kata sandi minimal 6 karakter",
    passwordMismatch: "Kata sandi tidak cocok",
    invalidEmail: "Format email tidak valid",
    createdAt: "Tanggal Dibuat",
    lastUpdated: "Terakhir Diperbarui",
  },
  en: {
    title: "Edit User",
    description: "Edit user information and password",
    backToUsers: "Back to User Management",
    userInfo: "User Information",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Status",
    password: "New Password",
    confirmPassword: "Confirm Password",
    passwordHint: "Leave empty if you don't want to change password",
    active: "Active",
    inactive: "Inactive",
    adminRole: "Admin",
    engineerRole: "Engineer",
    userRole: "User",
    save: "Save Changes",
    cancel: "Cancel",
    loading: "Loading user data...",
    saving: "Saving...",
    userNotFound: "User not found",
    userUpdated: "User updated successfully",
    updateError: "Error updating user",
    nameRequired: "Name is required",
    emailRequired: "Email is required",
    passwordTooShort: "Password must be at least 6 characters",
    passwordMismatch: "Passwords do not match",
    invalidEmail: "Invalid email format",
    createdAt: "Created At",
    lastUpdated: "Last Updated",
  },
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const { user } = useAdmin();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
    role: "user",
    isActive: true,
    password: "",
    confirmPassword: "",
  });

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(firestore, "users", userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const user: UserData = {
            id: docSnap.id,
            name: data.name || "",
            email: data.email || "",
            role: data.role || "user",
            isActive: data.isActive !== false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
          
          setUserData(user);
          setForm({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            password: "",
            confirmPassword: "",
          });
        } else {
          setError(t.userNotFound);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(t.updateError);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, t]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setForm(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    setError("");

    if (!form.name.trim()) {
      setError(t.nameRequired);
      return false;
    }

    if (!form.email.trim()) {
      setError(t.emailRequired);
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError(t.invalidEmail);
      return false;
    }

    // Password validation (only if password is provided)
    if (form.password || form.confirmPassword) {
      if (form.password.length < 6) {
        setError(t.passwordTooShort);
        return false;
      }

      if (form.password !== form.confirmPassword) {
        setError(t.passwordMismatch);
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Prepare update data
      const updateData: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        isActive: form.isActive,
        updatedAt: serverTimestamp(),
      };

      // API call to update user (including password if provided)
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updateData,
          password: form.password || undefined, // Only include password if provided
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.updateError);
      }

      // Update Firestore document (without password)
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, updateData);

      setSuccess(t.userUpdated);
      
      // Redirect after success
      setTimeout(() => {
        router.push("/admin/users");
      }, 2000);

    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : t.updateError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || t.userNotFound}</p>
        <Link 
          href="/admin/users"
          className="mt-4 inline-block text-primary hover:underline"
        >
          {t.backToUsers}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header with Breadcrumb */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center text-sm text-gray-500">
          <Link href="/admin/users" className="hover:text-gray-700">
            {t.backToUsers}
          </Link>
          <svg className="mx-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-900">{t.title}</span>
        </nav>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t.description}
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Main Form Container */}
      <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6">
        {/* User Info Section */}
        <div className="mb-6 border-b border-stroke pb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t.userInfo}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">{t.createdAt}:</span>
              <span className="ml-2 text-gray-900">
                {userData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
              </span>
            </div>
            {userData.updatedAt && (
              <div>
                <span className="font-medium text-gray-600">{t.lastUpdated}:</span>
                <span className="ml-2 text-gray-900">
                  {userData.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name Field */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.name}<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.email}<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                required
              />
            </div>

            {/* Role Field */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.role}<span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                required
              >
                <option value="admin">{t.adminRole}</option>
                <option value="engineer">{t.engineerRole}</option>
                <option value="user">{t.userRole}</option>
              </select>
            </div>

            {/* Status Field */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.status}
              </label>
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {form.isActive ? t.active : t.inactive}
                </label>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="mb-6 border-t border-stroke pt-6">
            <h3 className="mb-4 text-base font-medium text-gray-900">
              {t.password}
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              {t.passwordHint}
            </p>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* New Password */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.password}
                </label>
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.confirmPassword}
                </label>
                <PasswordInput
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/users"
              className="flex w-full justify-center rounded-lg border border-stroke bg-gray-100 px-6 py-2 text-center font-medium text-black hover:bg-opacity-90 sm:w-auto"
            >
              {t.cancel}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full justify-center rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}