"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore, auth } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useRouter } from "next/navigation";

const translations = {
  id: {
    title: "Pengaturan Akun",
    description: "Ubah pengaturan akun Anda",
    personalInfo: "Informasi Pribadi",
    name: "Nama",
    email: "Email",
    role: "Peran",
    status: "Status",
    profilePicture: "Foto Profil",
    save: "Simpan Perubahan",
    saving: "Menyimpan...",
    saved: "Perubahan disimpan",
    error: "Terjadi kesalahan. Silakan coba lagi.",
    active: "Aktif",
    inactive: "Nonaktif",
    admin: "Admin",
    engineer: "Teknisi",
    user: "Pengguna",
  },
  en: {
    title: "Account Settings",
    description: "Change your account settings",
    personalInfo: "Personal Information",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Status",
    profilePicture: "Profile Picture",
    save: "Save Changes",
    saving: "Saving...",
    saved: "Changes saved",
    error: "An error occurred. Please try again.",
    active: "Active",
    inactive: "Inactive",
    admin: "Admin",
    engineer: "Engineer",
    user: "User",
  },
};

export default function SettingsPage() {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;
  usePageHeader(t.title, t.description);
  const router = useRouter();

  const [user, setUser] = useState({
    name: "",
    email: "",
    role: "",
    isActive: true,
    photoURL: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          router.push("/admin/login");
          return;
        }

        const userDoc = await getDoc(doc(firestore, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            name: userData.name || "",
            email: currentUser.email || "",
            role: userData.role || "",
            isActive: userData.isActive !== false,
            photoURL: userData.photoURL || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, t.error]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile picture change
  const handleProfilePictureChange = (url: string) => {
    setUser((prev) => ({
      ...prev,
      photoURL: url,
    }));
  };

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/admin/login");
        return;
      }

      // Update only allowed fields (name and photoURL)
      await updateDoc(doc(firestore, "users", currentUser.uid), {
        name: user.name,
        photoURL: user.photoURL,
        // role dan isActive tidak diupdate
      });

      setMessage(t.saved);

      // Wait a bit before clearing the message
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating user:", error);
      setError(t.error);
    } finally {
      setIsSaving(false);
    }
  };

  // Display role in readable format
  const getReadableRole = (role: string) => {
    switch (role) {
      case "admin":
        return t.admin;
      case "engineer":
        return t.engineer;
      default:
        return t.user;
    }
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
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
      {message && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-green-700">{message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form Container */}
      <div className="styled-scrollbar flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {t.name}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="md:col-span-2">
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {t.email}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-stroke bg-gray-100 px-4 py-2 outline-none"
                  readOnly
                />
              </div>

              {/* Role (read-only) */}
              <div>
                <label
                  htmlFor="role"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {t.role}
                </label>
                <input
                  type="text"
                  id="role"
                  value={getReadableRole(user.role)}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-stroke bg-gray-100 px-4 py-2 outline-none"
                  readOnly
                />
              </div>

              {/* Status (read-only) */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {t.status}
                </label>
                <div className="flex h-[42px] w-full items-center rounded-lg border border-stroke bg-gray-100 px-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? t.active : t.inactive}
                  </span>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.profilePicture}
                </label>
                <ImageUploader
                  value={user.photoURL}
                  onChange={handleProfilePictureChange}
                  folder="profile"
                  aspectRatio="square"
                />
              </div>
            </div>
          </div>

          {/* Save button — pinned at bottom */}
          <div className="flex justify-end space-x-4 border-t pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {t.saving}
                </>
              ) : (
                t.save
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
