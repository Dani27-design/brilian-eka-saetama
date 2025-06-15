"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore, auth } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.description}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {message}
        </div>
      )}

      <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-black">
        <form onSubmit={handleSubmit}>
          <h2 className="mb-4 text-lg font-medium text-black dark:text-white">
            {t.personalInfo}
          </h2>

          {/* Name */}
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
              value={user.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>

          {/* Email (read-only) */}
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
              value={user.email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-stroke bg-gray-100 px-4 py-2 outline-none dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
              readOnly
            />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {/* Role (read-only) */}
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-black dark:text-white"
              >
                {t.role}
              </label>
              <input
                type="text"
                id="role"
                value={getReadableRole(user.role)}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-stroke bg-gray-100 px-4 py-2 outline-none dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
                readOnly
              />
            </div>

            {/* Status (read-only) */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-black dark:text-white"
              >
                {t.status}
              </label>
              <div className="flex h-[42px] w-full items-center rounded-lg border border-stroke bg-gray-100 px-4 dark:border-strokedark dark:bg-gray-800">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    user.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {user.isActive ? t.active : t.inactive}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t.profilePicture}
            </label>
            <ImageUploader
              value={user.photoURL}
              onChange={handleProfilePictureChange}
              folder="profile"
              aspectRatio="square"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-70"
            >
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
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
