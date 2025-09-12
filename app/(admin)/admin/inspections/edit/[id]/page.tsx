"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { firestore, storage } from "@/db/firebase/firebaseConfig";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { Maintenance, MaintenanceStatus, InspectionChecklist } from "@/types/maintenances";
import { ProductType } from "@/types/product";
import Image from "next/image";
import Modal from "@/components/Admin/Modal";
import { formatToWIB, formatDateOnlyWIB } from "@/utils/dateFormatter";
import { findProductLocation, ProductDetail } from "@/utils/findProductLocation";

/**
 * Represents the form data structure for editing inspections
 */
interface InspectionEditForm {
  id: string;
  contractNumber: string;
  contractName: string;
  productNumber: string;
  productName: string;
  productBrand: string;
  productType: ProductType;
  location: string;
  expirationDate: string;
  engineerNames: string[];
  status: MaintenanceStatus;
  inspection: {
    checklist: InspectionChecklist;
    photos: string[];
    createdAt: any;
    createdBy: any;
    updatedAt?: any;
    updatedBy?: any;
  };
}

/**
 * Represents metadata about users (engineers, admins) for audit trail
 */
interface UserMeta {
  name?: string;
  role?: string;
}

/**
 * Main component for editing inspection data
 * Allows admins to modify inspection checklist items, manage photos, and update status
 * 
 * Features:
 * - Read-only contract/product information display
 * - Editable checklist items (status toggle, remarks)
 * - Photo management (view, delete, upload new photos)
 * - Status management following business rules
 * - Audit trail display
 * - Validation and error handling
 */
export default function EditInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  // Form and data states
  const [form, setForm] = useState<InspectionEditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Photo management states
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Audit trail states
  const [auditTrail, setAuditTrail] = useState<Array<{
    label: string;
    date: string;
    user: UserMeta;
  }>>([]);

  /**
   * Fetches the maintenance data and related information for editing
   * Loads contract, product, and user data for display
   */
  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch maintenance document
      const maintenanceRef = doc(firestore, "maintenances", id);
      const maintenanceSnap = await getDoc(maintenanceRef);

      if (!maintenanceSnap.exists()) {
        throw new Error("Data maintenance tidak ditemukan");
      }

      const maintenanceData = maintenanceSnap.data() as Maintenance;

      // Check if inspection exists
      if (!maintenanceData.inspection) {
        throw new Error("Data inspeksi tidak ditemukan");
      }

      // Fetch contract data
      let contractNumber = "N/A";
      let contractName = "N/A";
      let location = "N/A";
      let productDetails: ProductDetail[] = [];

      if (maintenanceData.contract) {
        const contractSnap = await getDoc(maintenanceData.contract);
        if (contractSnap.exists()) {
          const contractData = contractSnap.data();
          contractNumber = contractData.contractNumber || "N/A";
          contractName = contractData.contractName || "N/A";
          productDetails = contractData.productDetails || [];
        }
      }

      // Fetch product data
      let productNumber = "N/A";
      let productName = "N/A";
      let productBrand = "N/A";
      let expirationDate = "N/A";

      if (maintenanceData.product) {
        const productSnap = await getDoc(maintenanceData.product);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          productNumber = productData.productNumber || "N/A";
          productName = productData.name || "N/A";
          productBrand = productData.specs?.brand || "N/A";
          
          // Get expiration date if available
          if (productData.specs?.expirationDate) {
            expirationDate = formatDateOnlyWIB(productData.specs.expirationDate);
          }

          // Find location for this product
          location = findProductLocation(maintenanceData.product, productDetails);
        }
      }

      // Fetch engineer names
      const engineerNames: string[] = [];
      if (Array.isArray(maintenanceData.engineer) && maintenanceData.engineer.length > 0) {
        for (const engineerRef of maintenanceData.engineer) {
          try {
            const engineerSnap = await getDoc(engineerRef);
            if (engineerSnap.exists()) {
              const engineerData = engineerSnap.data();
              engineerNames.push(engineerData.name || engineerSnap.id);
            }
          } catch (engineerError) {
            console.warn("Failed to fetch engineer:", engineerError);
          }
        }
      }

      // Build form data
      const formData: InspectionEditForm = {
        id: maintenanceSnap.id,
        contractNumber,
        contractName,
        productNumber,
        productName,
        productBrand,
        productType: maintenanceData.productType,
        location,
        expirationDate,
        engineerNames,
        status: maintenanceData.status,
        inspection: {
          checklist: maintenanceData.inspection.checklist || [],
          photos: maintenanceData.inspection.photos || [],
          createdAt: maintenanceData.inspection.createdAt,
          createdBy: maintenanceData.inspection.createdBy,
          updatedAt: maintenanceData.inspection.updatedAt,
          updatedBy: maintenanceData.inspection.updatedBy,
        },
      };

      setForm(formData);

      // Build audit trail
      await buildAuditTrail(maintenanceData);

    } catch (error: any) {
      console.error("Error fetching inspection data:", error);
      setError(error.message || "Gagal memuat data inspeksi");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Builds the audit trail showing who created and updated the inspection
   * 
   * @param maintenanceData - The maintenance document data
   */
  const buildAuditTrail = async (maintenanceData: Maintenance) => {
    const trail: Array<{ label: string; date: string; user: UserMeta }> = [];

    try {
      // Inspection created
      if (maintenanceData.inspection?.createdBy && maintenanceData.inspection?.createdAt) {
        const user = await fetchUserMeta(maintenanceData.inspection.createdBy);
        trail.push({
          label: "Inspeksi dibuat oleh",
          date: formatToWIB(maintenanceData.inspection.createdAt),
          user,
        });
      }

      // Inspection updated
      if (maintenanceData.inspection?.updatedBy && maintenanceData.inspection?.updatedAt) {
        const user = await fetchUserMeta(maintenanceData.inspection.updatedBy);
        trail.push({
          label: "Inspeksi diubah oleh",
          date: formatToWIB(maintenanceData.inspection.updatedAt),
          user,
        });
      }

      // Maintenance updated (status changes)
      if (maintenanceData.updatedBy && maintenanceData.updatedAt) {
        const user = await fetchUserMeta(maintenanceData.updatedBy);
        trail.push({
          label: "Status diubah oleh",
          date: formatToWIB(maintenanceData.updatedAt),
          user,
        });
      }

      // Sort by date (newest first)
      trail.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAuditTrail(trail);

    } catch (error) {
      console.error("Error building audit trail:", error);
    }
  };

  /**
   * Fetches user metadata for audit trail display
   * 
   * @param userRef - Document reference to the user
   * @returns User metadata with name and role
   */
  const fetchUserMeta = async (userRef: any): Promise<UserMeta> => {
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as { name?: string; role?: string };
        return {
          name: userData.name || "Unknown",
          role: userData.role || "Unknown",
        };
      }
    } catch (error) {
      console.warn("Failed to fetch user meta:", error);
    }
    return { name: "Unknown", role: "Unknown" };
  };

  /**
   * Handles changes to checklist items (status toggle or remarks update)
   * 
   * @param index - Index of the checklist item
   * @param field - Field to update ('status' or 'remarks')
   * @param value - New value for the field
   */
  const handleChecklistChange = (
    index: number,
    field: "status" | "remarks",
    value: boolean | string
  ) => {
    if (!form || !user?.uid) return;

    const updatedChecklist = [...form.inspection.checklist] as InspectionChecklist;
    const itemToUpdate = { ...updatedChecklist[index] };

    if (field === "status") {
      itemToUpdate.status = value as boolean;
    } else if (field === "remarks") {
      itemToUpdate.remarks = value as string;
    }

    updatedChecklist[index] = itemToUpdate;

    setForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        inspection: {
          ...prev.inspection,
          checklist: updatedChecklist as InspectionChecklist,
          updatedAt: new Date(), // Will be replaced with serverTimestamp on save
          updatedBy: user.uid, // Will be replaced with doc reference on save
        },
      };
    });
  };

  /**
   * Handles status change for the maintenance
   * Validates business rules before allowing status changes
   * 
   * @param newStatus - The new status to set
   */
  const handleStatusChange = (newStatus: MaintenanceStatus) => {
    if (!form) return;

    // Business rule validation
    if (form.status === "approved" && newStatus !== "rejected") {
      setError("Status yang sudah disetujui hanya dapat diubah ke 'Ditolak'");
      return;
    }

    if (newStatus === "approved" && form.inspection.checklist.length === 0) {
      setError("Tidak dapat menyetujui inspeksi tanpa checklist");
      return;
    }

    setForm(prev => prev ? { ...prev, status: newStatus } : prev);
  };

  /**
   * Handles photo upload with validation
   * Supports multiple file upload with 3-10 photo limit
   * 
   * @param files - FileList from file input
   */
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !form || !user?.uid) return;

    const currentPhotoCount = form.inspection.photos.length;
    const newPhotoCount = files.length;
    const totalAfterUpload = currentPhotoCount + newPhotoCount;

    // Validate photo count limits
    if (totalAfterUpload > 10) {
      setError(`Maksimal 10 foto. Saat ini: ${currentPhotoCount}, akan ditambah: ${newPhotoCount}`);
      return;
    }

    if (totalAfterUpload < 3 && currentPhotoCount === 0) {
      setError("Minimum 3 foto diperlukan untuk inspeksi");
      return;
    }

    setUploadingPhotos(true);
    setError("");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} bukan gambar valid`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} terlalu besar (max 5MB)`);
        }

        // Create unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `inspections/${form.id}/${filename}`);

        // Upload file
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update form with new photo URLs
      setForm(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inspection: {
            ...prev.inspection,
            photos: [...prev.inspection.photos, ...uploadedUrls],
          },
        };
      });

      setSuccessMessage(`${uploadedUrls.length} foto berhasil diunggah`);

    } catch (error: any) {
      console.error("Error uploading photos:", error);
      setError(error.message || "Gagal mengunggah foto");
    } finally {
      setUploadingPhotos(false);
    }
  };

  /**
   * Handles photo deletion from inspection
   * Removes photo from Firebase Storage and updates the form
   * 
   * @param photoUrl - URL of the photo to delete
   * @param index - Index of the photo in the photos array
   */
  const handlePhotoDelete = async (photoUrl: string, index: number) => {
    if (!form) return;

    // Check minimum photo requirement
    if (form.inspection.photos.length <= 3) {
      setError("Minimum 3 foto diperlukan untuk inspeksi");
      return;
    }

    setDeletingPhoto(photoUrl);
    setError("");

    try {
      // Extract storage path from URL and delete from Firebase Storage
      if (photoUrl.includes('firebase')) {
        try {
          const decodedUrl = decodeURIComponent(photoUrl);
          const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
          if (pathMatch) {
            const storagePath = pathMatch[1];
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef);
          }
        } catch (storageError) {
          console.warn("Failed to delete from storage:", storageError);
          // Continue with URL removal even if storage deletion fails
        }
      }

      // Remove photo URL from form
      setForm(prev => {
        if (!prev) return prev;
        const updatedPhotos = prev.inspection.photos.filter((_, i) => i !== index);
        return {
          ...prev,
          inspection: {
            ...prev.inspection,
            photos: updatedPhotos,
          },
        };
      });

      setSuccessMessage("Foto berhasil dihapus");

    } catch (error: any) {
      console.error("Error deleting photo:", error);
      setError(error.message || "Gagal menghapus foto");
    } finally {
      setDeletingPhoto(null);
    }
  };

  /**
   * Saves all changes to the inspection data
   * Updates Firestore with modified checklist, photos, and status
   */
  const handleSave = async () => {
    if (!form || !user?.uid) return;

    setSaving(true);
    setError("");

    try {
      // Validate minimum photos
      if (form.inspection.photos.length < 3) {
        setError("Minimum 3 foto diperlukan untuk inspeksi");
        setSaving(false);
        return;
      }

      // Validate checklist completion for approval
      if (form.status === "approved") {
        const incompleteItems = form.inspection.checklist.filter(
          item => item.status === false && (!item.remarks || item.remarks.trim() === "")
        );
        
        if (incompleteItems.length > 0) {
          setError("Semua item NOK harus memiliki catatan sebelum disetujui");
          setSaving(false);
          return;
        }
      }

      const maintenanceRef = doc(firestore, "maintenances", form.id);

      // Prepare update data
      const updateData: any = {
        status: form.status,
        inspection: {
          ...form.inspection,
          checklist: form.inspection.checklist,
          photos: form.inspection.photos,
          updatedAt: serverTimestamp(),
          updatedBy: doc(firestore, "users", user.uid),
          // Preserve original creation data
          createdAt: form.inspection.createdAt,
          createdBy: form.inspection.createdBy,
        },
        updatedAt: serverTimestamp(),
        updatedBy: doc(firestore, "users", user.uid),
      };

      await updateDoc(maintenanceRef, updateData);

      setSuccessMessage("Perubahan berhasil disimpan");
      
      // Optionally redirect after successful save
      setTimeout(() => {
        router.push("/admin/inspections");
      }, 2000);

    } catch (error: any) {
      console.error("Error saving inspection:", error);
      setError(error.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  // Photo modal handlers
  const openPhotoModal = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setIsPhotoModalOpen(false);
  };

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (id) {
      fetchInspectionData();
    }
  }, [id]);

  if (loading || !form) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Memuat data inspeksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Edit Inspeksi</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ubah data hasil inspeksi dan kelola foto
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Kembali
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-red-800">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-green-800">
            {successMessage}
          </div>
        )}
      </div>

      {/* Contract & Product Info (Read-only) */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default md:p-6">
        <h3 className="mb-4 text-lg font-semibold">Informasi Kontrak & Produk</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              No. Kontrak
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.contractNumber}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Nama Kontrak
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.contractName}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              No. Produk
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.productNumber}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Nama Produk
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.productName}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Tipe Produk
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {form.productType}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Brand
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.productBrand}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Lokasi
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.location}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Tanggal Kadaluarsa
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.expirationDate}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Engineer
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
              {form.engineerNames.join(", ") || "Tidak ada"}
            </div>
          </div>
        </div>
      </div>

      {/* Status Management */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default md:p-6">
        <h3 className="mb-4 text-lg font-semibold">Status Inspeksi</h3>
        
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-600">
            Status Saat Ini:
          </label>
          <select
            value={form.status}
            onChange={(e) => handleStatusChange(e.target.value as MaintenanceStatus)}
            className="rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="scheduled">Dijadwalkan</option>
            <option value="waiting_approval">Menunggu Disetujui</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {/* Audit Trail */}
        {auditTrail.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-gray-600">Riwayat Perubahan:</h4>
            <div className="space-y-2">
              {auditTrail.map((entry, index) => (
                <div key={index} className="rounded bg-gray-50 px-3 py-2 text-xs">
                  <span className="font-medium">{entry.label}</span>{" "}
                  <span className="font-semibold">{entry.user.name}</span>{" "}
                  <span className="text-gray-500">({entry.user.role})</span>{" "}
                  <span className="text-gray-500">pada {entry.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Management */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Foto Inspeksi</h3>
          <div className="text-sm text-gray-500">
            {form.inspection.photos.length} / 10 foto (min: 3)
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-600">
            Tambah Foto Baru
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e.target.files)}
            disabled={uploadingPhotos || form.inspection.photos.length >= 10}
            className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            {uploadingPhotos 
              ? "Mengunggah foto..."
              : form.inspection.photos.length >= 10
              ? "Maksimal 10 foto telah tercapai"
              : "Pilih gambar (max 5MB per file, format: JPG, PNG, dll.)"
            }
          </p>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {form.inspection.photos.map((photoUrl, index) => (
            <div key={index} className="group relative">
              <button
                onClick={() => openPhotoModal(photoUrl)}
                className="block w-full"
              >
                <Image
                  src={photoUrl}
                  alt={`Foto inspeksi ${index + 1}`}
                  width={200}
                  height={200}
                  className="h-32 w-full rounded-lg object-cover transition-transform hover:scale-105"
                />
              </button>
              
              {/* Delete Button */}
              <button
                onClick={() => handlePhotoDelete(photoUrl, index)}
                disabled={deletingPhoto === photoUrl || form.inspection.photos.length <= 3}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
                title={form.inspection.photos.length <= 3 ? "Minimum 3 foto diperlukan" : "Hapus foto"}
              >
                {deletingPhoto === photoUrl ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                ) : (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>

        {form.inspection.photos.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            Belum ada foto. Upload minimum 3 foto untuk melengkapi inspeksi.
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default md:p-6">
        <h3 className="mb-4 text-lg font-semibold">Checklist Inspeksi</h3>

        {form.inspection.checklist.length > 0 ? (
          <div className="space-y-4">
            {form.inspection.checklist.map((item: any, index: number) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${
                  item.status
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">{item.item}</h4>
                  
                  {/* Status Toggle */}
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={item.status}
                      onChange={(e) =>
                        handleChecklistChange(index, "status", e.target.checked)
                      }
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary"></div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        item.status ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {item.status ? "OK" : "NOK"}
                    </span>
                  </label>
                </div>

                {/* Remarks */}
                <div>
                  <label
                    className={`mb-1 block text-sm font-medium ${
                      item.status ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    Catatan {!item.status && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={item.remarks || ""}
                    onChange={(e) =>
                      handleChecklistChange(index, "remarks", e.target.value)
                    }
                    placeholder={
                      item.status
                        ? "Tambahkan catatan (opsional)"
                        : "Deskripsikan masalah yang ditemukan (wajib)"
                    }
                    rows={2}
                    className={`block w-full rounded-lg border p-3 text-sm ${
                      item.status
                        ? "border-green-200 focus:border-green-500 focus:ring-green-500"
                        : "border-red-200 focus:border-red-500 focus:ring-red-500"
                    }`}
                  />
                  <div
                    className={`mt-1 text-xs ${
                      item.status ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {item.status
                      ? "Kondisi baik, catatan bersifat opsional"
                      : "Wajib diisi untuk kondisi tidak baik"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-sm">Tidak ada item checklist</p>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={closePhotoModal}
        title="Detail Foto Inspeksi"
      >
        {selectedPhoto && (
          <div className="flex justify-center">
            <Image
              src={selectedPhoto}
              alt="Foto inspeksi detail"
              width={800}
              height={600}
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}