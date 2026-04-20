"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, doc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useAdmin } from "@/app/context/AdminContext";
import type { Product, ProductSpecs, ProductType } from "@/types/product";
import React from "react";
import { Timestamp } from "firebase/firestore";
import { usePageHeader } from "@/app/context/PageHeaderContext";

interface ProductForm {
  name: string;
  productNumber: string; // Keep as string for form input
  imageUrl: string;
  source: string;
  productType: ProductType;
  maintenanceInterval: number;
}

export default function CreateProductPage() {
  usePageHeader(
    "Tambah Produk Baru",
    "Lengkapi data produk untuk menambah produk baru ke dalam sistem.",
  );
  const [form, setForm] = useState<ProductForm>({
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
  const [nextAvailableNumber, setNextAvailableNumber] = useState<number | null>(null);

  // Fetch next available product number on mount
  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const q = query(
          collection(firestore, "products"),
          orderBy("productNumber", "desc"),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const highest = snapshot.docs[0].data().productNumber;
          setNextAvailableNumber(Number(highest) + 1);
        } else {
          setNextAvailableNumber(1);
        }
      } catch {
        // ignore — hint is optional
      }
    };
    fetchNextNumber();
  }, []);

  // Add state for collapsible sections

  // Check uniqueness and minimum number when productNumber changes
  const checkProductNumberUnique = async (value: string) => {
    if (!value) {
      setProductNumberError("");
      return;
    }
    const num = Number(value);
    if (nextAvailableNumber !== null && !isNaN(num) && num < nextAvailableNumber) {
      setProductNumberError(`No. Produk harus ${nextAvailableNumber} atau lebih.`);
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tinggi (cm)
              </label>
              <input
                name="height"
                type="number"
                min={0}
                step="any"
                value={(specs as any).height || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lebar (cm)
              </label>
              <input
                name="width"
                type="number"
                min={0}
                step="any"
                value={(specs as any).width || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tekanan (bar)
              </label>
              <input
                name="pressure"
                type="number"
                min={0}
                step="any"
                value={(specs as any).pressure || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kapasitas (kg)
              </label>
              <input
                name="capacity"
                type="number"
                min={0}
                step="any"
                value={(specs as any).capacity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Jenis Media
              </label>
              <input
                name="agentType"
                value={(specs as any).agentType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Berat Total (kg)
              </label>
              <input
                name="weight"
                type="number"
                min={0}
                step="any"
                value={(specs as any).weight || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
          </>
        );
      case "HYDRANT":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tinggi (cm)
              </label>
              <input
                name="height"
                type="number"
                min={0}
                step="any"
                value={(specs as any).height || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lebar (cm)
              </label>
              <input
                name="width"
                type="number"
                min={0}
                step="any"
                value={(specs as any).width || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Debit Air (L/min)
              </label>
              <input
                name="flowRate"
                type="number"
                min={0}
                step="any"
                value={(specs as any).flowRate || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tekanan (bar)
              </label>
              <input
                name="pressure"
                type="number"
                min={0}
                step="any"
                value={(specs as any).pressure || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipe Valve
              </label>
              <input
                name="valveType"
                value={(specs as any).valveType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Panjang Selang (m)
              </label>
              <input
                name="hoseLength"
                type="number"
                min={0}
                step="any"
                value={(specs as any).hoseLength || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Material Body
              </label>
              <input
                name="material"
                value={(specs as any).material || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
          </>
        );
      case "CCTV":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Resolusi
              </label>
              <input
                name="resolution"
                value={(specs as any).resolution || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lensa
              </label>
              <input
                name="lens"
                value={(specs as any).lens || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="nightVision"
                className="mb-1 block text-sm font-medium text-gray-700"
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Daya
              </label>
              <input
                name="power"
                value={(specs as any).power || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Konektivitas
              </label>
              <input
                name="connectivity"
                value={(specs as any).connectivity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kapasitas Penyimpanan
              </label>
              <input
                name="storageCapacity"
                value={(specs as any).storageCapacity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
          </>
        );
      case "FIRE_ALARM":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipe Sensor
              </label>
              <input
                name="sensorType"
                value={(specs as any).sensorType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Daya
              </label>
              <input
                name="power"
                value={(specs as any).power || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Area Cakupan (m²)
              </label>
              <input
                name="coverageArea"
                type="number"
                min={0}
                step="any"
                value={(specs as any).coverageArea || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tingkat Suara (dB)
              </label>
              <input
                name="soundLevel"
                type="number"
                min={0}
                step="any"
                value={(specs as any).soundLevel || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
          </>
        );
      case "ACCESS_DOOR":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Material
              </label>
              <input
                name="material"
                value={(specs as any).material || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipe Kunci
              </label>
              <input
                name="lockType"
                value={(specs as any).lockType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lebar (cm)
              </label>
              <input
                name="width"
                type="number"
                min={0}
                step="any"
                value={(specs as any).width || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tinggi (cm)
              </label>
              <input
                name="height"
                type="number"
                min={0}
                step="any"
                value={(specs as any).height || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kecepatan Buka (cm/s)
              </label>
              <input
                name="openingSpeed"
                type="number"
                min={0}
                step="any"
                value={(specs as any).openingSpeed || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
          </>
        );
      case "PATROL_GUARD":
        return (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipe Perangkat
              </label>
              <input
                name="deviceType"
                value={(specs as any).deviceType || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Baterai
              </label>
              <input
                name="batteryLife"
                value={(specs as any).batteryLife || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Konektivitas
              </label>
              <input
                name="connectivity"
                value={(specs as any).connectivity || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Interval Patroli (menit)
              </label>
              <input
                name="patrolInterval"
                type="number"
                min={0}
                step="any"
                value={(specs as any).patrolInterval || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Versi Firmware
              </label>
              <input
                name="firmwareVersion"
                value={(specs as any).firmwareVersion || ""}
                onChange={handleSpecsChange}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  function BaseSpecsFields({
    specs,
    onChange,
    productType,
  }: {
    specs: any;
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => void;
    productType?: string;
  }) {
    const isExpirationRequired = productType === "APAR";
    return (
      <>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Serial Number
          </label>
          <input
            name="serialNumber"
            value={specs.serialNumber ?? ""}
            onChange={onChange}
            autoComplete="off"
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tanggal Produksi
          </label>
          <input
            name="manufactureDate"
            type="date"
            value={specs.manufactureDate ?? ""}
            onChange={onChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tanggal Instalasi
          </label>
          <input
            name="installationDate"
            type="date"
            value={specs.installationDate ?? ""}
            onChange={onChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tanggal Kadaluarsa{isExpirationRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            name="expirationDate"
            type="date"
            value={specs.expirationDate ?? ""}
            onChange={onChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
            required={isExpirationRequired}
          />
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Convert productNumber to number and validate
    const productNumber = Number(form.productNumber);
    if (!form.productNumber || !form.name || isNaN(productNumber)) {
      setError("No. Produk harus berupa angka dan Nama Produk wajib diisi.");
      setLoading(false);
      return;
    }

    // Final check before submit
    const q = query(
      collection(firestore, "products"),
      where("productNumber", "==", productNumber),
    );
    const snapshot = await getDocs(q);
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
      productNumber: productNumber,
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
    <div className="flex h-full flex-col">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/admin/products"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Produk
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Terjadi Kesalahan
              </h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="styled-scrollbar min-h-0 flex-1 overflow-auto space-y-6">
          {/* Section 1: Informasi Produk */}
          <div className="rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">
            <h3 className="mb-4 text-lg font-semibold">Informasi Produk</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    No. Produk<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="productNumber"
                    placeholder="No. Produk"
                    value={form.productNumber}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${
                      productNumberError ? "border-red-500" : "border-stroke"
                    } bg-transparent px-4 py-2 outline-none focus:border-primary`}
                    required
                  />
                  {productNumberError && (
                    <p className="mt-1 text-xs text-red-600">
                      {productNumberError}
                    </p>
                  )}
                  {!productNumberError && nextAvailableNumber !== null && (
                    <p className="mt-1 text-xs text-gray-400">
                      No. produk tersedia: <span className="font-medium text-primary">{nextAvailableNumber}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipe Produk<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="productType"
                    value={form.productType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nama Produk<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    placeholder="Nama Produk"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Merk<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="brand"
                    placeholder="Brand"
                    value={specs.brand || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Jenis<span className="text-red-500">*</span>
                  </label>
                  {form.productType === "HYDRANT" ? (
                    <select
                      name="brandType"
                      value={specs.brandType || ""}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                      required
                    >
                      <option value="">Pilih Jenis Hydrant</option>
                      <option value="HPE">HPE (Hydrant Pillar Permanent)</option>
                      <option value="HPO">HPO (Hydrant Pillar Portable)</option>
                    </select>
                  ) : (
                    <input
                      name="brandType"
                      placeholder="Jenis"
                      value={specs.brandType || ""}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Sumber Produk<span className="text-red-500">*</span>
                  </label>
                  <input
                    name="source"
                    placeholder="Sumber produk (misal: VENDOR ABC, INTERNAL)"
                    value={form.source}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Interval Maintenance (hari)
                  </label>
                  <input
                    name="maintenanceInterval"
                    type="number"
                    min={0}
                    placeholder="Interval maintenance (hari)"
                    value={form.maintenanceInterval}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
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
          </div>

          {/* Section 2: Spesifikasi Teknis */}
          <div className="rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">
            <h3 className="mb-4 text-lg font-semibold">Spesifikasi Teknis</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {renderSpecsFields()}
            </div>
          </div>

          {/* Section 3: Informasi Tambahan */}
          <div className="rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">
            <h3 className="mb-4 text-lg font-semibold">Informasi Tambahan</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {BaseSpecsFields({ specs, onChange: handleSpecsChange, productType: form.productType })}
            </div>
          </div>
        </div>

        {/* Buttons pinned at bottom */}
        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
