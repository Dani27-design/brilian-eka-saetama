"use client";

import { useState } from "react";
import { collection, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useAdmin } from "@/app/context/AdminContext";
import type { Product, ProductSpecs, ProductType } from "@/types/product";
import { query, where, getDocs } from "firebase/firestore";
import React from "react";
import { Timestamp } from "firebase/firestore";

export default function CreateProductPage() {
  const [form, setForm] = useState<Omit<Product, "specs" | "contract">>({
    name: "",
    productNumber: "",
    imageUrl: "",
    source: "",
    productType: "APAR",
    maintenanceInterval: 0,
  });
  const [specs, setSpecs] = useState<ProductSpecs>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAdmin(); // pastikan context ini mengandung user id

  // Add state for productNumber uniqueness
  const [productNumberError, setProductNumberError] = useState<string>("");

  // Check uniqueness when productNumber changes
  const checkProductNumberUnique = async (value: string) => {
    if (!value) {
      setProductNumberError("");
      return;
    }
    const q = query(
      collection(firestore, "products"),
      where("productNumber", "==", value),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setProductNumberError("No. Produk sudah digunakan, gunakan nomor lain.");
    } else {
      setProductNumberError("");
    }
  };

  const handleImageChange = (url: string) => {
    setForm((prev) => ({ ...prev, imageUrl: url }));
  };

  // Helper untuk konversi value
  const toNumberOrNull = (v: any) =>
    v === "" || v === undefined ? null : Number(v);
  const toStringOrNull = (v: any) => (v === "" || v === undefined ? null : v);
  const toBoolOrNull = (v: any) => (typeof v === "boolean" ? v : !!v);
  const toTimestampOrNull = (v: any) =>
    v ? Timestamp.fromDate(new Date(v)) : null;

  // Perbaiki handleChange agar brand & brandType masuk ke specs
  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "brand" || name === "brandType") {
      setSpecs((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setForm((prev: any) => ({
        ...prev,
        [name]: e.target.type === "number" ? Number(value) : value,
      }));
    }
    if (name === "productNumber") {
      await checkProductNumberUnique(value);
    }
  };

  // Perbaiki handleSpecsChange agar sesuai type
  const handleSpecsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setSpecs((prev: any) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? toBoolOrNull((e.target as HTMLInputElement).checked)
          : type === "number"
          ? toNumberOrNull(value)
          : value,
    }));
  };

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
                value={(specs as any).height || ""}
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
                value={(specs as any).width || ""}
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
                value={(specs as any).pressure || ""}
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
                value={(specs as any).capacity || ""}
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
                value={(specs as any).agentType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Berat Total (kg)
              </label>
              <input
                name="weight"
                type="number"
                min={0}
                step="any"
                value={(specs as any).weight || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            {/* BaseSpecs */}
            {BaseSpecsFields({
              specs,
              onChange: handleSpecsChange,
            })}
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
                value={(specs as any).height || ""}
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
                value={(specs as any).width || ""}
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
                value={(specs as any).flowRate || ""}
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
                value={(specs as any).pressure || ""}
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
                value={(specs as any).valveType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Panjang Selang (m)
              </label>
              <input
                name="hoseLength"
                type="number"
                min={0}
                step="any"
                value={(specs as any).hoseLength || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Material Body
              </label>
              <input
                name="material"
                value={(specs as any).material || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            {BaseSpecsFields({
              specs,
              onChange: handleSpecsChange,
            })}
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
                value={(specs as any).resolution || ""}
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
                value={(specs as any).lens || ""}
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
                  checked={!!(specs as any).nightVision}
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
                value={(specs as any).power || ""}
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
                value={(specs as any).connectivity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pan
              </label>
              <input
                name="pan"
                type="checkbox"
                checked={!!(specs as any).pan}
                onChange={handleSpecsChange}
                className="cursor-pointer rounded border-stroke text-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tilt
              </label>
              <input
                name="tilt"
                type="checkbox"
                checked={!!(specs as any).tilt}
                onChange={handleSpecsChange}
                className="cursor-pointer rounded border-stroke text-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kapasitas Penyimpanan
              </label>
              <input
                name="storageCapacity"
                value={(specs as any).storageCapacity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            {BaseSpecsFields({
              specs,
              onChange: handleSpecsChange,
            })}
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
                value={(specs as any).sensorType || ""}
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
                value={(specs as any).power || ""}
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
                value={(specs as any).coverageArea || ""}
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
                value={(specs as any).soundLevel || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cadangan Baterai
              </label>
              <input
                name="batteryBackup"
                type="checkbox"
                checked={!!(specs as any).batteryBackup}
                onChange={handleSpecsChange}
                className="cursor-pointer rounded border-stroke text-primary focus:ring-primary"
              />
            </div>
            {BaseSpecsFields({
              specs,
              onChange: handleSpecsChange,
            })}
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
                value={(specs as any).material || ""}
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
                value={(specs as any).lockType || ""}
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
                value={(specs as any).width || ""}
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
                value={(specs as any).height || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kecepatan Buka (cm/s)
              </label>
              <input
                name="openingSpeed"
                type="number"
                min={0}
                step="any"
                value={(specs as any).openingSpeed || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            {BaseSpecsFields({
              specs,
              onChange: handleSpecsChange,
            })}
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
                value={(specs as any).deviceType || ""}
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
                value={(specs as any).batteryLife || ""}
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
                value={(specs as any).connectivity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Interval Patroli (menit)
              </label>
              <input
                name="patrolInterval"
                type="number"
                min={0}
                step="any"
                value={(specs as any).patrolInterval || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Versi Firmware
              </label>
              <input
                name="firmwareVersion"
                value={(specs as any).firmwareVersion || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            {BaseSpecsFields({
              specs,
              onChange: handleSpecsChange,
            })}
          </>
        );
      default:
        return null;
    }
  };

  function BaseSpecsFields({
    specs,
    onChange,
  }: {
    specs: any;
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => void;
  }) {
    return (
      <>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Serial Number
          </label>
          <input
            name="serialNumber"
            value={specs.serialNumber ?? ""}
            onChange={onChange}
            autoComplete="off"
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tanggal Produksi
          </label>
          <input
            name="manufactureDate"
            type="date"
            value={specs.manufactureDate ?? ""}
            onChange={onChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tanggal Instalasi
          </label>
          <input
            name="installationDate"
            type="date"
            value={specs.installationDate ?? ""}
            onChange={onChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tanggal Kadaluarsa
          </label>
          <input
            name="expirationDate"
            type="date"
            value={specs.expirationDate ?? ""}
            onChange={onChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
          />
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Final check before submit
    const q = query(
      collection(firestore, "products"),
      where("productNumber", "==", form.productNumber),
    );
    const snapshot = await getDocs(q);
    if (!form.productNumber || !form.name) {
      setError("No. Produk dan Nama Produk wajib diisi.");
      setLoading(false);
      return;
    }
    if (!snapshot.empty) {
      setProductNumberError("No. Produk sudah digunakan, gunakan nomor lain.");
      setLoading(false);
      return;
    }

    // Build specs sesuai type
    const finalSpecs: ProductSpecs = {
      ...specs,
      brand: toStringOrNull(specs.brand),
      brandType: toStringOrNull(specs.brandType),
      manufactureDate: specs.manufactureDate
        ? toTimestampOrNull(specs.manufactureDate)
        : null,
      installationDate: specs.installationDate
        ? toTimestampOrNull(specs.installationDate)
        : null,
      expirationDate: specs.expirationDate
        ? toTimestampOrNull(specs.expirationDate)
        : null,
      serialNumber: toStringOrNull(specs.serialNumber),
    };

    // Build Product
    const productToSave: Product = {
      ...form,
      specs: finalSpecs,
      maintenanceInterval: form.maintenanceInterval
        ? Number(form.maintenanceInterval)
        : 0,
      source: form.source
        ? form.source.toLocaleLowerCase() === "internal"
          ? "INTERNAL"
          : form.source
        : "INTERNAL",
      contract: null,
      createdAt: serverTimestamp() as any,
      createdBy: user?.uid ? doc(firestore, "users", user.uid) : null,
    };

    try {
      await addDoc(collection(firestore, "products"), productToSave);
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
              No. Produk<span className="text-red-500">*</span>
            </label>
            <input
              name="productNumber"
              placeholder="No. Produk"
              value={form.productNumber}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                productNumberError ? "border-red-500" : "border-stroke"
              } bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white`}
              required
            />
            {productNumberError && (
              <p className="mt-1 text-xs text-red-600">{productNumberError}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipe Produk<span className="text-red-500">*</span>
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
              Nama Produk<span className="text-red-500">*</span>
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
              Merk<span className="text-red-500">*</span>
            </label>
            <input
              name="brand"
              placeholder="Brand"
              value={specs.brand || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Jenis<span className="text-red-500">*</span>
            </label>
            <input
              name="brandType"
              placeholder="Jenis"
              value={specs.brandType || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sumber Produk<span className="text-red-500">*</span>
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
            />
          </div>
          {/* Render dynamic specs fields */}
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
