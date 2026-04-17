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
import { usePageHeader } from "@/app/context/PageHeaderContext";
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

  usePageHeader(t.title, t.description);

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
    <div className="flex h-full flex-col">
      {/* Back button with meta info */}
      <div className="flex flex-row w-full justify-between mb-4">
        <Link
          href="/admin/users"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToUsers}
        </Link>
        {/* Meta Information */}
        {userData && (
          <div className="inline-flex h-10 items-center rounded-lg border border-stroke bg-white px-4 text-xs text-blue-800">
            <span className="font-medium">{t.createdAt}: </span>
            <span className="ml-1">{userData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
            {userData.updatedAt && (
              <>
                <span className="mx-2 text-gray-300">|</span>
                <span className="font-medium">{t.lastUpdated}: </span>
                <span className="ml-1">{userData.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
              </>
            )}
          </div>
        )}
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

      {/* Success Display */}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Form Container */}
      <div className="styled-scrollbar flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto">
            {/* Form fields grid */}
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
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {t.cancel}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}