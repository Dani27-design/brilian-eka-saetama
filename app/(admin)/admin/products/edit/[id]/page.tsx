"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/Admin/ImageUploader";
import Modal from "@/components/Admin/Modal";
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
} from "@/utils/qrCodeGenerator";
import { findProductLocation } from "@/utils/findProductLocation";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import {
  applyIntervalReschedulePlan,
  buildIntervalReschedulePlan,
  type IntervalRescheduleMode,
  RescheduleApplyError,
  type ReschedulePlan,
  StaleReschedulePlanError,
} from "@/utils/maintenanceIntervalRescheduler";

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

type OriginalProductSnapshot = {
  maintenanceInterval: number;
  productType: ProductType;
  contractId: string | null;
  contractType: string | null;
};

type ProductUpdatePayload = Record<string, any>;

function formatPreviewDate(date: Date | null): string {
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPreviewDateRange(startDate: Date | null, endDate: Date | null): string {
  return `${formatPreviewDate(startDate)} - ${formatPreviewDate(endDate)}`;
}

const maintenanceStatusDisplay: Record<string, string> = {
  pending: "Menunggu",
  scheduled: "Dijadwalkan",
  in_progress: "Sedang Dikerjakan",
  waiting_approval: "Menunggu Disetujui",
  approved: "Disetujui",
  rejected: "Ditolak",
};

function getMaintenanceStatusDisplay(status: string | undefined): string {
  if (!status) return "-";
  return maintenanceStatusDisplay[status] || status;
}

export default function EditProductPage() {
  usePageHeader("Edit Data Produk", "Ubah data produk sesuai kebutuhan.");
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
  const [originalProductSnapshot, setOriginalProductSnapshot] =
    useState<OriginalProductSnapshot | null>(null);
  const [pendingProductUpdate, setPendingProductUpdate] =
    useState<ProductUpdatePayload | null>(null);
  const [futureOnlyPlan, setFutureOnlyPlan] =
    useState<ReschedulePlan | null>(null);
  const [activeCutPlan, setActiveCutPlan] =
    useState<ReschedulePlan | null>(null);
  const [selectedRescheduleMode, setSelectedRescheduleMode] =
    useState<IntervalRescheduleMode>("future_only");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [buildingReschedulePlan, setBuildingReschedulePlan] = useState(false);
  const [applyingReschedule, setApplyingReschedule] = useState(false);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(firestore, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          const initialProductType = data.productType || "APAR";
          const initialMaintenanceInterval = Number(data.maintenanceInterval || 0);
          let fetchedContractData: any = null;

          setForm({
            name: data.name || "",
            productNumber: data.productNumber?.toString() || "",
            productType: initialProductType,
            imageUrl: data.imageUrl || "",
            source: data.source || "",
            maintenanceInterval: initialMaintenanceInterval,
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
                fetchedContractData = {
                  id: contractSnap.id,
                  ...(contractInfo as Record<string, any>),
                };
                setContractData(fetchedContractData);
              }
            } catch (contractError) {
              console.warn("Failed to fetch contract data:", contractError);
            }
          } else {
            setContractData(null);
          }

          setOriginalProductSnapshot({
            maintenanceInterval: initialMaintenanceInterval,
            productType: initialProductType,
            contractId: data.contract?.id || null,
            contractType: fetchedContractData?.contractType || null,
          });

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
          contractData.productDetails,
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
        contract: contractData
          ? doc(firestore, "contracts", contractData.id)
          : null,
      };

      // Generate QR data
      const qrData = generateProductQRData(
        productData,
        id,
        contractData?.id,
        location,
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
          contractData.productDetails,
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
        contract: contractData
          ? doc(firestore, "contracts", contractData.id)
          : null,
      };

      // Generate QR data
      const qrData = generateProductQRData(
        productData,
        id,
        contractData?.id,
        location,
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

  const buildProductUpdatePayload = async (): Promise<ProductUpdatePayload | null> => {
    // Convert productNumber to number and validate
    const productNumber = Number(form.productNumber);
    if (!form.productNumber || !form.name || isNaN(productNumber)) {
      setError("No. Produk harus berupa angka dan Nama Produk wajib diisi.");
      return null;
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
      return null;
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

    return {
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
    };
  };

  const saveProductOnly = async (productUpdatePayload: ProductUpdatePayload) => {
    await updateDoc(doc(firestore, "products", id), productUpdatePayload);
    router.push("/admin/products");
  };

  const handleSaveProductOnlyFromPreview = async () => {
    if (!pendingProductUpdate) return;

    setSaving(true);
    setError("");

    try {
      await saveProductOnly(pendingProductUpdate);
    } catch {
      setError("Gagal mengupdate produk");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndReschedule = async () => {
    if (!selectedReschedulePlan || !pendingProductUpdate) return;

    if (
      originalProductSnapshot &&
      originalProductSnapshot.productType !== form.productType
    ) {
      setError(
        "Terapkan Pilihan Ini diblok karena tipe produk ikut berubah. Simpan produk saja atau ubah interval tanpa mengganti tipe produk.",
      );
      return;
    }

    setApplyingReschedule(true);
    setError("");

    try {
      await applyIntervalReschedulePlan({
        approvedPlan: selectedReschedulePlan,
        userRef: user?.uid ? doc(firestore, "users", user.uid) : null,
        productUpdateData: pendingProductUpdate,
      });

      router.push("/admin/products");
    } catch (err: any) {
      if (err instanceof StaleReschedulePlanError) {
        setShowRescheduleModal(false);
        setFutureOnlyPlan(null);
        setActiveCutPlan(null);
        setPendingProductUpdate(null);
        setSelectedRescheduleMode("future_only");
        setError(
          "Data maintenance berubah setelah preview dibuat. Buat preview ulang sebelum menyimpan.",
        );
      } else if (err instanceof RescheduleApplyError) {
        setError(err.message);
      } else {
        setError("Gagal menerapkan reschedule maintenance");
      }
    } finally {
      setApplyingReschedule(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProductNumberError("");
    setPendingProductUpdate(null);
    setFutureOnlyPlan(null);
    setActiveCutPlan(null);
    setSelectedRescheduleMode("future_only");

    const productUpdatePayload = await buildProductUpdatePayload();
    if (!productUpdatePayload) return;

    const oldInterval = originalProductSnapshot?.maintenanceInterval;
    const newInterval = Number(productUpdatePayload.maintenanceInterval || 0);
    const intervalChanged =
      typeof oldInterval === "number" && oldInterval !== newInterval;
    const shouldBuildReschedulePreview =
      intervalChanged &&
      Boolean(originalProductSnapshot?.contractId) &&
      originalProductSnapshot?.contractType === "maintenance";

    if (!shouldBuildReschedulePreview) {
      setSaving(true);
      try {
        await saveProductOnly(productUpdatePayload);
      } catch {
        setError("Gagal mengupdate produk");
      } finally {
        setSaving(false);
      }
      return;
    }

    setBuildingReschedulePlan(true);

    try {
      const changedAt = new Date();
      const futurePlan = await buildIntervalReschedulePlan({
        productId: id,
        oldInterval: oldInterval as number,
        newInterval,
        changedAt,
        mode: "future_only",
      });
      let activePlan: ReschedulePlan | null = null;

      if (newInterval < (oldInterval as number)) {
        activePlan = await buildIntervalReschedulePlan({
          productId: id,
          oldInterval: oldInterval as number,
          newInterval,
          changedAt,
          mode: "cut_active_period_once",
        });
      }

      setPendingProductUpdate(productUpdatePayload);
      setFutureOnlyPlan(futurePlan);
      setActiveCutPlan(activePlan);
      setSelectedRescheduleMode(
        activePlan?.canApply ? "cut_active_period_once" : "future_only",
      );
      setShowRescheduleModal(true);
    } catch {
      setError("Gagal membuat preview reschedule maintenance");
    } finally {
      setBuildingReschedulePlan(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  const selectedReschedulePlan =
    selectedRescheduleMode === "cut_active_period_once"
      ? activeCutPlan
      : futureOnlyPlan;
  const hasReschedulePreview = Boolean(futureOnlyPlan || activeCutPlan);
  const engineerAssignmentLossCount =
    selectedReschedulePlan?.replaceableMaintenances.filter(
      (maintenance) => maintenance.engineerIds.length > 0,
    ).length || 0;
  const productTypeChangedWithInterval =
    Boolean(selectedReschedulePlan && originalProductSnapshot) &&
    originalProductSnapshot?.productType !== form.productType;
  const canApplyReschedule =
    Boolean(selectedReschedulePlan?.canApply) &&
    Boolean(pendingProductUpdate) &&
    !productTypeChangedWithInterval &&
    !applyingReschedule &&
    !saving;
  const selectedActiveCut = selectedReschedulePlan?.activePeriodCut;
  const firstNewSchedule = selectedReschedulePlan?.newSchedules[0] || null;
  const remainingNewSchedules = Math.max(
    (selectedReschedulePlan?.newSchedules.length || 0) - 1,
    0,
  );

  return (
    <div className="flex h-full flex-col">
      {/* Back button */}
      <div className="flex flex-row w-full justify-between mb-4">
        <Link
          href="/admin/products"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali ke Produk
        </Link>
        {/* Meta Information */}
        {metaInfo && (
          <div className="inline-flex h-10 items-center rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 text-xs text-blue-800">
            <span className="font-medium">{metaInfo.label} : </span>
            {metaInfo.user?.name && (
              <span className="ml-1">
                <b>{metaInfo.user.name}</b>
                {metaInfo.user.role ? ` (${metaInfo.user.role})` : ""}
              </span>
            )}
            {metaInfo.date && (
              <span className="ml-1 text-blue-600">{metaInfo.date}</span>
            )}
          </div>
        )}
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
            disabled={saving || buildingReschedulePlan || applyingReschedule}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {buildingReschedulePlan
              ? "Menyiapkan Preview..."
              : saving || applyingReschedule
                ? "Menyimpan..."
                : "Simpan Produk"}
          </button>
        </div>
      </form>

      <Modal
        isOpen={showRescheduleModal && hasReschedulePreview}
        onClose={() => {
          if (!applyingReschedule) {
            setShowRescheduleModal(false);
          }
        }}
        title="Preview Reschedule Maintenance"
        size="xl"
      >
        {selectedReschedulePlan && (
          <div className="space-y-5">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    Produk
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedReschedulePlan.productNumber} - {selectedReschedulePlan.productName}
                  </p>
                  <p className="text-gray-600">{selectedReschedulePlan.productType || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    Kontrak
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedReschedulePlan.contractNumber} - {selectedReschedulePlan.contractName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    Interval
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    Interval berubah dari {selectedReschedulePlan.oldInterval} hari ke{" "}
                    {selectedReschedulePlan.newInterval} hari
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-blue-700">
                    Pilihan tindakan
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedRescheduleMode === "cut_active_period_once"
                      ? "Koreksi 1 periode aktif"
                      : "Reschedule jadwal berikutnya"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {futureOnlyPlan && (
                <button
                  type="button"
                  onClick={() => setSelectedRescheduleMode("future_only")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedRescheduleMode === "future_only"
                      ? "border-primary bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    Reschedule jadwal berikutnya
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Sistem hanya mengganti jadwal yang masih aman diganti.
                    Jadwal yang sudah memiliki inspeksi atau status final tetap dipertahankan.
                  </p>
                </button>
              )}
              {activeCutPlan && (
                <button
                  type="button"
                  onClick={() => setSelectedRescheduleMode("cut_active_period_once")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedRescheduleMode === "cut_active_period_once"
                      ? "border-primary bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    Koreksi 1 periode aktif
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Sistem akan memperpendek satu jadwal yang sedang berjalan,
                    lalu membuat jadwal berikutnya dari tanggal setelah periode baru selesai.
                  </p>
                  {!activeCutPlan.canApply && (
                    <p className="mt-2 text-xs font-medium text-red-700">
                      {activeCutPlan.applyBlockedReason ||
                        "Koreksi 1 periode aktif belum bisa diterapkan."}
                    </p>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Jadwal terdata</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedReschedulePlan.existingMaintenances.length}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Dipertahankan</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedReschedulePlan.preservedMaintenances.length}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Jadwal lama diganti</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedReschedulePlan.replaceableMaintenances.length}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Jadwal Baru</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedReschedulePlan.newSchedules.length}
                </p>
              </div>
            </div>

            {selectedRescheduleMode === "cut_active_period_once" && selectedActiveCut && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Jadwal yang sedang berjalan
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Status: {getMaintenanceStatusDisplay(selectedActiveCut.anchorStatus)}.
                      {selectedActiveCut.anchorHasInspection
                        ? " Sudah memiliki inspeksi."
                        : " Belum memiliki inspeksi."}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-500">
                    ID: {selectedActiveCut.anchorMaintenanceId}
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Sebelum</th>
                        <th className="px-3 py-2">Sesudah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      <tr>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          Jadwal aktif
                        </td>
                        <td className="px-3 py-2">
                          {formatPreviewDateRange(
                            selectedActiveCut.previousStartDate,
                            selectedActiveCut.previousEndDate,
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {formatPreviewDateRange(
                            selectedActiveCut.correctedStartDate,
                            selectedActiveCut.correctedEndDate,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          Jadwal berikutnya
                        </td>
                        <td className="px-3 py-2">
                          Belum tersedia / jadwal lama terlalu panjang
                        </td>
                        <td className="px-3 py-2">
                          {firstNewSchedule
                            ? formatPreviewDateRange(
                                firstNewSchedule.startDate,
                                firstNewSchedule.endDate,
                              )
                            : "Tidak ada jadwal baru setelah koreksi"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {remainingNewSchedules > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Dan {remainingNewSchedules} jadwal berikutnya sampai akhir kontrak.
                  </p>
                )}
              </div>
            )}

            {productTypeChangedWithInterval && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                Tipe produk ikut berubah. Terapkan Pilihan Ini diblok agar maintenance baru tidak memakai tipe yang ambigu.
              </div>
            )}

            {engineerAssignmentLossCount > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                {engineerAssignmentLossCount} maintenance yang akan diganti memiliki assignment engineer. Maintenance baru akan dibuat tanpa engineer dan status kembali pending.
              </div>
            )}

            {selectedActiveCut?.warningLevel === "high" && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                Jadwal yang dipotong sudah memiliki inspeksi atau status penting.
                Data inspeksi, status, dan engineer tidak akan diubah. Sistem hanya
                mengoreksi tanggal selesai dan mencatat audit otomatis.
              </div>
            )}

            {selectedActiveCut && selectedActiveCut.warnings.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-white p-3">
                <p className="text-sm font-semibold text-yellow-800">
                  Catatan koreksi
                </p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                  {selectedActiveCut.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {!selectedReschedulePlan.canApply && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {selectedReschedulePlan.applyBlockedReason ||
                  "Pilihan ini belum bisa diterapkan."}
              </div>
            )}

            {selectedReschedulePlan.conflicts.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-white p-3">
                <p className="text-sm font-semibold text-red-800">Jadwal bentrok</p>
                <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm text-red-700">
                  {selectedReschedulePlan.conflicts.map((conflict, index) => (
                    <li key={`${conflict.existingMaintenance.id}-${index}`}>
                      {conflict.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedReschedulePlan.blockedMaintenances.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-white p-3">
                <p className="text-sm font-semibold text-orange-800">
                  Jadwal yang perlu diperiksa
                </p>
                <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm text-orange-700">
                  {selectedReschedulePlan.blockedMaintenances.map((blocked) => (
                    <li key={blocked.maintenance.id}>
                      {blocked.maintenance.id}: {blocked.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Ringkasan perubahan: hapus {selectedReschedulePlan.writeSummary.deleteCount}
              {" "}jadwal lama, buat {selectedReschedulePlan.writeSummary.createCount}
              {" "}jadwal baru, estimasi {selectedReschedulePlan.writeSummary.estimatedWrites}
              {" "}operasi data.
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                disabled={applyingReschedule || saving}
                className="rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProductOnlyFromPreview}
                disabled={applyingReschedule || saving}
                className="rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Produk Saja"}
              </button>
              <button
                type="button"
                onClick={handleSaveAndReschedule}
                disabled={!canApplyReschedule}
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {applyingReschedule ? "Menerapkan..." : "Terapkan Pilihan Ini"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
