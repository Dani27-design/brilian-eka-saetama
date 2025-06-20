"use client";

import { useState } from "react";
import { collection, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useAdmin } from "@/app/context/AdminContext";

export default function CreateProductPage() {
  const [form, setForm] = useState({
    name: "",
    productNumber: "",
    brand: "",
    brandType: "",
    weight: "",
    height: "",
    width: "",
    productType: "",
    imageUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAdmin(); // pastikan context ini mengandung user id

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (url: string) => {
    setForm((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(firestore, "products"), {
        ...form,
        createdAt: serverTimestamp(),
        createdBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      router.push("/admin/products");
    } catch {
      setError("Gagal menambah produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-2 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Tambah Produk Baru
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Lengkapi data produk untuk menambah produk baru ke dalam sistem.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              No. Produk
            </label>
            <input
              name="productNumber"
              placeholder="No. Produk"
              value={form.productNumber}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipe Produk
            </label>
            <select
              name="productType"
              value={form.productType}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            >
              <option value="">Pilih tipe produk</option>
              <option value="APAR">APAR</option>
              <option value="HYDRANT">Hydrant</option>
              <option value="PATROL_GUARD">Patrol Guard</option>
              <option value="CCTV">CCTV</option>
              <option value="FIRE_ALARM">Fire Alarm</option>
              <option value="ACCESS_DOOR">Access Door</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Produk
            </label>
            <input
              name="name"
              placeholder="Nama Produk"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Merk
            </label>
            <input
              name="brand"
              placeholder="Brand"
              value={form.brand}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Jenis
            </label>
            <input
              name="brandType"
              placeholder="Jenis"
              value={form.brandType}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Berat
            </label>
            <div className="relative">
              <input
                type="number"
                name="weight"
                placeholder="Berat"
                value={form.weight}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 pr-12 outline-none focus:border-primary dark:border-strokedark dark:text-white"
                required
                min={0}
                step="any"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                kg
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tinggi
            </label>
            <div className="relative">
              <input
                type="number"
                name="height"
                placeholder="Tinggi"
                value={form.height}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 pr-12 outline-none focus:border-primary dark:border-strokedark dark:text-white"
                required
                min={0}
                step="any"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                cm
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Lebar
            </label>
            <div className="relative">
              <input
                type="number"
                name="width"
                placeholder="Lebar"
                value={form.width}
                onChange={handleChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 pr-12 outline-none focus:border-primary dark:border-strokedark dark:text-white"
                required
                min={0}
                step="any"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                cm
              </span>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Gambar Produk
            </label>
            <ImageUploader
              value={form.imageUrl}
              onChange={handleImageChange}
              folder="products"
              aspectRatio="square"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
