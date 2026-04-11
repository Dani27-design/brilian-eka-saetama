"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/Admin/ImageUploader";
import { useAdmin } from "@/app/context/AdminContext";
import type { Product, ProductSpecs, ProductType } from "@/types/product";
import { query, where, getDocs } from "firebase/firestore";
import React from "react";
import { Timestamp } from "firebase/firestore";
import { 
  generateProductQRData, 
  downloadQRCode, 
  generateQRCodeDataURL,
  getQRCodeSize,
  generateQRLabel 
} from "@/utils/qrCodeGenerator";
import { findProductLocation } from "@/utils/findProductLocation";
import Image from "next/image";

type UserMeta = {
  name?: string;
  role?: string;
};

const toNumberOrNull = (v: any) =>
  v === "" || v === undefined ? null : Number(v);
const toStringOrNull = (v: any) => (v === "" || v === undefined ? null : v);
const toBoolOrNull = (v: any) => (typeof v === "boolean" ? v : !!v);
const toTimestampOrNull = (v: any) =>
  v ? Timestamp.fromDate(new Date(v)) : null;

function toDateInputValue(ts: any) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toISOString().slice(0, 10);
}

interface ProductForm {
  name: string;
  productNumber: string; // Keep as string for form input
  imageUrl: string;
  source: string;
  productType: ProductType;
  maintenanceInterval: number;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  const [form, setForm] = useState<ProductForm>({
    name: "",
    productNumber: "",
    imageUrl: "",
    source: "",
    productType: "APAR",
    maintenanceInterval: 0,
  });
  const [specs, setSpecs] = useState<ProductSpecs>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metaInfo, setMetaInfo] = useState<{
    label: string;
    date?: string;
    user?: UserMeta;
  } | null>(null);
  const [productNumberError, setProductNumberError] = useState<string>("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [contractData, setContractData] = useState<any>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(firestore, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setForm({
            name: data.name || "",
            productNumber: data.productNumber?.toString() || "",
            productType: data.productType || "APAR",
            imageUrl: data.imageUrl || "",
            source: data.source || "",
            maintenanceInterval: data.maintenanceInterval || 0,
          });
          setSpecs({
            ...data.specs,
            brand: data.specs?.brand || "",
            brandType: data.specs?.brandType || "",
            manufactureDate: data.specs?.manufactureDate
              ? toDateInputValue(data.specs.manufactureDate)
              : "",
            installationDate: data.specs?.installationDate
              ? toDateInputValue(data.specs.installationDate)
              : "",
            expirationDate: data.specs?.expirationDate
              ? toDateInputValue(data.specs.expirationDate)
              : "",
            serialNumber: data.specs?.serialNumber || "",
          });

          // Fetch contract data if product is assigned to a contract
          if (data.contract) {
            try {
              const contractSnap = await getDoc(data.contract);
              if (contractSnap.exists()) {
                const contractInfo = contractSnap.data() || {};
                setContractData({
                  id: contractSnap.id,
                  ...(contractInfo as Record<string, any>),
                });
              }
            } catch (contractError) {
              console.warn("Failed to fetch contract data:", contractError);
            }
          }

          // Meta info
          if (data.updatedAt && data.updatedBy) {
            fetchUserMeta(
              data.updatedBy,
              data.updatedAt,
              "Terakhir diubah oleh",
            );
          } else if (data.createdAt && data.createdBy) {
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

    const fetchUserMeta = async (userRef: any, date: any, label: string) => {
      try {
        const userSnap = await getDoc(userRef);
        let user: UserMeta = {};
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserMeta;
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

  // Cek unik productNumber
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
    let isDuplicate = false;
    snapshot.forEach((doc) => {
      if (doc.id !== id) isDuplicate = true;
    });
    if (isDuplicate) {
      setProductNumberError("No. Produk sudah digunakan, gunakan nomor lain.");
    } else {
      setProductNumberError("");
    }
  };

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

  const handleImageChange = (url: string) => {
    setForm((prev) => ({ ...prev, imageUrl: url }));
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
            Tanggal Kadaluarsa
          </label>
          <input
            name="expirationDate"
            type="date"
            value={specs.expirationDate ?? ""}
            onChange={onChange}
            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
          />
        </div>
      </>
    );
  }

  /**
   * Generates QR code preview for the current product
   * Creates visual QR code for display in the form
   */
  const generateQRPreview = async () => {
    if (!id) return;

    setGeneratingQR(true);
    setError("");

    try {
      // Get location from contract if available
      let location: string | undefined;
      if (contractData?.productDetails) {
        location = findProductLocation(
          doc(firestore, "products", id),
          contractData.productDetails
        );
        if (location === "N/A") location = undefined;
      }

      // Build product data for QR
      const productData: Product = {
        id,
        name: form.name,
        productNumber: Number(form.productNumber),
        productType: form.productType,
        imageUrl: form.imageUrl,
        source: form.source,
        maintenanceInterval: form.maintenanceInterval,
        specs: specs as ProductSpecs,
        contract: contractData ? doc(firestore, "contracts", contractData.id) : null,
      };

      // Generate QR data
      const qrData = generateProductQRData(
        productData,
        id,
        contractData?.id,
        location
      );

      // Generate preview QR code
      const qrDataUrl = await generateQRCodeDataURL(qrData, {
        size: getQRCodeSize("web"),
        errorCorrectionLevel: "M",
      });

      setQrCodeDataUrl(qrDataUrl);

    } catch (err: any) {
      console.error("Error generating QR preview:", err);
      setError(err.message || "Gagal membuat preview QR code");
    } finally {
      setGeneratingQR(false);
    }
  };

  /**
   * Downloads QR code as PNG file
   * High-quality QR code for printing
   */
  const downloadQRCodeFile = async () => {
    if (!id) return;

    setGeneratingQR(true);
    setError("");

    try {
      // Get location from contract if available
      let location: string | undefined;
      if (contractData?.productDetails) {
        location = findProductLocation(
          doc(firestore, "products", id),
          contractData.productDetails
        );
        if (location === "N/A") location = undefined;
      }

      // Build product data for QR
      const productData: Product = {
        id,
        name: form.name,
        productNumber: Number(form.productNumber),
        productType: form.productType,
        imageUrl: form.imageUrl,
        source: form.source,
        maintenanceInterval: form.maintenanceInterval,
        specs: specs as ProductSpecs,
        contract: contractData ? doc(firestore, "contracts", contractData.id) : null,
      };

      // Generate QR data
      const qrData = generateProductQRData(
        productData,
        id,
        contractData?.id,
        location
      );

      // Download QR code with high quality for printing
      await downloadQRCode(qrData, {
        size: getQRCodeSize("print"),
        errorCorrectionLevel: "H",
      });

    } catch (err: any) {
      console.error("Error downloading QR code:", err);
      setError(err.message || "Gagal mendownload QR code");
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(false);

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
    let isDuplicate = false;
    snapshot.forEach((doc) => {
      if (doc.id !== id) isDuplicate = true;
    });
    if (isDuplicate) {
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

    try {
      await updateDoc(doc(firestore, "products", id), {
        ...form,
        productNumber: productNumber,
        maintenanceInterval: form.maintenanceInterval
          ? Number(form.maintenanceInterval)
          : 0,
        source: form.source
          ? form.source.toLocaleLowerCase() === "internal"
            ? "INTERNAL"
            : form.source
          : "INTERNAL",
        specs: finalSpecs,
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
    <div className="mx-auto max-w-4xl">
      {/* Enhanced Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center text-sm text-gray-500">
          <Link href="/admin/products" className="hover:text-gray-700">
            Produk
          </Link>
          <svg className="mx-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900">Edit</span>
        </nav>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Edit Produk</h1>
            <p className="mt-1 text-sm text-gray-600">Ubah data produk sesuai kebutuhan</p>
            {/* Meta Information */}
            {metaInfo && (
              <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <span className="font-medium">{metaInfo.label}</span>
                {metaInfo.user?.name && (
                  <span className="ml-1">
                    <b>{metaInfo.user.name}</b>
                    {metaInfo.user.role ? ` (${metaInfo.user.role})` : ""}
                  </span>
                )}
                {metaInfo.date && <span className="ml-2 text-blue-600">{metaInfo.date}</span>}
              </div>
            )}
          </div>
          <Link
            href="/admin/products"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar
          </Link>
        </div>
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
              <h3 className="text-sm font-medium text-red-800">
                Terjadi Kesalahan
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Container */}
      <div className="space-y-6">
      <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <p className="mt-1 text-xs text-red-600">{productNumberError}</p>
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
            <input
              name="brandType"
              placeholder="Jenis"
              value={specs.brandType || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              required
            />
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
          {renderSpecsFields()}
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

        {/* QR Code Section */}
        <div className="mb-6 rounded-lg border border-stroke bg-white p-4 shadow-default">
          <h3 className="mb-4 text-lg font-semibold text-black">
            QR Code Produk
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* QR Preview */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Preview QR Code
              </label>
              {qrCodeDataUrl ? (
                <div className="rounded-lg border border-stroke bg-white p-4 text-center">
                  <Image
                    src={qrCodeDataUrl}
                    alt="QR Code Preview"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Scan untuk akses data produk lengkap
                  </p>
                  {contractData && (
                    <p className="mt-1 text-xs text-blue-600">
                      Termasuk data kontrak & lokasi
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <svg 
                    className="mx-auto h-12 w-12 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1} 
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 16h4.01M12 20h4.01M12 8h4.01M12 4h4.01" 
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Generate QR code untuk melihat preview
                  </p>
                </div>
              )}
            </div>

            {/* QR Actions */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Aksi QR Code
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={generateQRPreview}
                  disabled={generatingQR}
                  className="flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {generatingQR ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Generate Preview
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={downloadQRCodeFile}
                  disabled={generatingQR}
                  className="flex w-full items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {generatingQR ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download QR (Print Quality)
                    </>
                  )}
                </button>
              </div>
              
              {/* QR Info */}
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <p className="font-medium">QR Code berisi:</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  <li>ID & No. Produk</li>
                  <li>Tipe Produk & Brand</li>
                  <li>Interval Maintenance</li>
                  <li>Serial Number</li>
                  {contractData && (
                    <>
                      <li>Info Kontrak</li>
                      <li>Lokasi Pemasangan</li>
                    </>
                  )}
                  <li>Timestamp Generation</li>
                </ul>
                <p className="mt-2 text-xs italic text-gray-500">
                  QR code dapat dipindai oleh aplikasi mobile untuk akses cepat data produk.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Batal
          </Link>
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
      </div>
    </div>
  );
}
