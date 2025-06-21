"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter, useParams } from "next/navigation";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useAdmin } from "@/app/context/AdminContext";
import type { ProductType } from "@/types/product";

type UserMeta = {
  name?: string;
  role?: string;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  const [form, setForm] = useState({
    name: "",
    productNumber: "",
    brand: "",
    brandType: "",
    productType: "",
    imageUrl: "",
    source: "",
    maintenanceInterval: "",
  });
  const [specs, setSpecs] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metaInfo, setMetaInfo] = useState<{
    label: string;
    date?: string;
    user?: UserMeta;
  } | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(firestore, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setForm({
            name: data.name || "",
            productNumber: data.productNumber || "",
            brand: data.brand || "",
            brandType: data.brandType || "",
            productType: data.productType || "",
            imageUrl: data.imageUrl || "",
            source: data.source || "",
            maintenanceInterval: data.maintenanceInterval?.toString() || "",
          });
          setSpecs(data.specs || {});

          // Determine which meta to show: updated or created
          if (data.updatedAt && data.updatedBy) {
            // Show updated info
            fetchUserMeta(
              data.updatedBy,
              data.updatedAt,
              "Terakhir diubah oleh",
            );
          } else if (data.createdAt && data.createdBy) {
            // Show created info
            fetchUserMeta(data.createdBy, data.createdAt, "Dibuat oleh");
          } else {
            setMetaInfo(null);
          }
        } else {
          setError("Produk tidak ditemukan");
        }
      } catch {
        setError("Gagal memuat data produk");
      } finally {
        setLoading(false);
      }
    };

    // Helper to fetch user meta
    const fetchUserMeta = async (
      userRef: DocumentReference,
      date: any,
      label: string,
    ) => {
      try {
        const userSnap = await getDoc(userRef);
        let user: UserMeta = {};
        if (userSnap.exists()) {
          const userData = userSnap.data();
          user = {
            name: userData.name || "-",
            role: userData.role || "-",
          };
        }
        setMetaInfo({
          label,
          date: date?.toDate ? date.toDate().toLocaleString() : "-",
          user,
        });
      } catch {
        setMetaInfo({
          label,
          date: date?.toDate ? date.toDate().toLocaleString() : "-",
          user: { name: "-", role: "-" },
        });
      }
    };

    if (id) fetchProduct();
    // eslint-disable-next-line
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (url: string) => {
    setForm((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleSpecsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setSpecs((prev: any) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // --- Render dynamic specs fields based on productType ---
  const renderSpecsFields = () => {
    switch (form.productType as ProductType) {
      case "APAR":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tinggi (cm)
              </label>
              <input
                name="height"
                type="number"
                min={0}
                step="any"
                value={specs.height || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lebar (cm)
              </label>
              <input
                name="width"
                type="number"
                min={0}
                step="any"
                value={specs.width || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tekanan (bar)
              </label>
              <input
                name="pressure"
                type="number"
                min={0}
                step="any"
                value={specs.pressure || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kapasitas (kg)
              </label>
              <input
                name="capacity"
                type="number"
                min={0}
                step="any"
                value={specs.capacity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Jenis Media
              </label>
              <input
                name="agentType"
                value={specs.agentType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
          </>
        );
      case "HYDRANT":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tinggi (cm)
              </label>
              <input
                name="height"
                type="number"
                min={0}
                step="any"
                value={specs.height || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lebar (cm)
              </label>
              <input
                name="width"
                type="number"
                min={0}
                step="any"
                value={specs.width || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Debit Air (L/min)
              </label>
              <input
                name="flowRate"
                type="number"
                min={0}
                step="any"
                value={specs.flowRate || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tekanan (bar)
              </label>
              <input
                name="pressure"
                type="number"
                min={0}
                step="any"
                value={specs.pressure || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Valve
              </label>
              <input
                name="valveType"
                value={specs.valveType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
          </>
        );
      case "CCTV":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Resolusi
              </label>
              <input
                name="resolution"
                value={specs.resolution || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lensa
              </label>
              <input
                name="lens"
                value={specs.lens || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="nightVision"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Night Vision
              </label>
              <div className="w-fit cursor-pointer bg-transparent py-2">
                <input
                  name="nightVision"
                  type="checkbox"
                  checked={!!specs.nightVision}
                  onChange={handleSpecsChange}
                  className="cursor-pointer rounded border-stroke text-primary focus:ring-primary"
                  id="nightVision"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daya
              </label>
              <input
                name="power"
                value={specs.power || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Konektivitas
              </label>
              <input
                name="connectivity"
                value={specs.connectivity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
          </>
        );
      case "FIRE_ALARM":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Sensor
              </label>
              <input
                name="sensorType"
                value={specs.sensorType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daya
              </label>
              <input
                name="power"
                value={specs.power || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Area Cakupan (m²)
              </label>
              <input
                name="coverageArea"
                type="number"
                min={0}
                step="any"
                value={specs.coverageArea || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tingkat Suara (dB)
              </label>
              <input
                name="soundLevel"
                type="number"
                min={0}
                step="any"
                value={specs.soundLevel || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
          </>
        );
      case "ACCESS_DOOR":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Material
              </label>
              <input
                name="material"
                value={specs.material || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Kunci
              </label>
              <input
                name="lockType"
                value={specs.lockType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lebar (cm)
              </label>
              <input
                name="width"
                type="number"
                min={0}
                step="any"
                value={specs.width || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tinggi (cm)
              </label>
              <input
                name="height"
                type="number"
                min={0}
                step="any"
                value={specs.height || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
          </>
        );
      case "PATROL_GUARD":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Perangkat
              </label>
              <input
                name="deviceType"
                value={specs.deviceType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Baterai
              </label>
              <input
                name="batteryLife"
                value={specs.batteryLife || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Konektivitas
              </label>
              <input
                name="connectivity"
                value={specs.connectivity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateDoc(doc(firestore, "products", id), {
        ...form,
        maintenanceInterval: form.maintenanceInterval
          ? Number(form.maintenanceInterval)
          : 0,
        source: form.source
          ? form.source.toLocaleLowerCase() === "internal"
            ? "INTERNAL"
            : form.source
          : "INTERNAL",
        specs,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      router.push("/admin/products");
    } catch {
      setError("Gagal mengupdate produk");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-2 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Edit Produk
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ubah data produk sesuai kebutuhan.
        </p>
        {metaInfo && (
          <div className="mt-3 rounded bg-blue-50 px-4 py-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <span className="font-semibold">{metaInfo.label}</span>
            {metaInfo.user && (
              <>
                {" "}
                <span>
                  {metaInfo.user.name} ({metaInfo.user.role})
                </span>
              </>
            )}
            {metaInfo.date && (
              <>
                {" "}
                <span className="text-gray-500">pada {metaInfo.date}</span>
              </>
            )}
          </div>
        )}
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
              Sumber Produk
            </label>
            <input
              name="source"
              placeholder="Sumber produk (misal: VENDOR ABC, INTERNAL)"
              value={form.source}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Interval Maintenance (hari)
            </label>
            <input
              name="maintenanceInterval"
              type="number"
              min={0}
              placeholder="Interval maintenance (hari)"
              value={form.maintenanceInterval}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderSpecsFields()}
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
