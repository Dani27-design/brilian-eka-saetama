"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc, updateDoc, serverTimestamp, doc, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useAdmin } from "@/app/context/AdminContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import {
  downloadCustomerCSVTemplate,
  validateCustomerData,
  CustomerValidationResult,
} from "@/utils/customerImportExport";
import { getFieldDisplayName } from "@/utils/validationMessages";

type ImportStep = "upload" | "mapping" | "validation" | "importing" | "complete";

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: { row: number; field: string; message: string }[];
}

export default function CustomerImportPage() {
  const router = useRouter();
  const { user } = useAdmin();
  usePageHeader("Impor Pelanggan", "Impor pelanggan dari file CSV dengan panduan langkah demi langkah");

  // Wizard state
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<CustomerValidationResult | null>(null);
  const [importConfig, setImportConfig] = useState({
    skipDuplicates: true,
    updateExisting: false,
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<Map<string, string> | null>(null);
  const [isHelpSectionOpen, setIsHelpSectionOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Process CSV file (shared by click and drag-and-drop)
  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Silakan unggah file CSV");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("File CSV harus memiliki header dan minimal 1 baris data");
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, any> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || "";
        });
        return row;
      });

      setParsedData({ headers, rows });

      const mapping = autoMapColumns(headers);
      setColumnMapping(mapping);
      setCurrentStep("mapping");
    } catch (err: any) {
      setError(err.message || "Gagal memproses file CSV");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  // Auto-map columns
  const autoMapColumns = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const fieldMappings: Record<string, string[]> = {
      name: ["name", "nama", "Nama Pelanggan", "nama pelanggan", "customer_name", "pelanggan"],
      customerType: ["customerType", "customer_type", "type", "tipe", "Tipe Pelanggan", "tipe pelanggan"],
      businessField: ["businessField", "business_field", "bisnis", "usaha", "Bidang Usaha", "bidang usaha"],
      street: ["street", "alamat", "address", "jalan", "Alamat Jalan", "alamat jalan"],
      village: ["village", "desa", "kelurahan", "Desa Kelurahan", "desa kelurahan"],
      district: ["district", "kecamatan", "Kecamatan"],
      city: ["city", "kota", "kabupaten", "Kota Kabupaten", "kota kabupaten"],
      province: ["province", "provinsi", "Provinsi"],
      postalCode: ["postalCode", "postal_code", "kodepos", "kode_pos", "Kode Pos", "kode pos"],
      primaryContactName: ["primaryContactName", "contactName", "contact_name", "nama_kontak", "Nama Kontak Utama", "nama kontak utama"],
      primaryContactEmail: ["primaryContactEmail", "contactEmail", "contact_email", "email_kontak", "Email Kontak Utama", "email kontak utama", "email"],
      primaryContactPhone: ["primaryContactPhone", "contactPhone", "contact_phone", "phone", "telp", "telepon", "hp", "Telepon Kontak Utama", "telepon kontak utama"],
      primaryContactPosition: ["primaryContactPosition", "contactPosition", "contact_position", "position", "jabatan", "Posisi Kontak Utama", "posisi kontak utama"],
    };

    headers.forEach((header) => {
      const normalized = header.toLowerCase().trim();
      for (const [field, variations] of Object.entries(fieldMappings)) {
        if (variations.some((v) => {
          const nv = v.toLowerCase().trim();
          return nv === normalized || nv.replace(/\s+/g, "_") === normalized.replace(/\s+/g, "_");
        })) {
          mapping[header] = field;
          break;
        }
      }
    });
    return mapping;
  };

  const handleMappingChange = (csvColumn: string, field: string) => {
    const newMapping = { ...columnMapping };
    if (field === "") {
      delete newMapping[csvColumn];
    } else {
      Object.keys(newMapping).forEach((key) => {
        if (newMapping[key] === field && key !== csvColumn) delete newMapping[key];
      });
      newMapping[csvColumn] = field;
    }
    setColumnMapping(newMapping);
  };

  // Check existing customers by name
  const checkExistingCustomers = async (names: string[]): Promise<Map<string, string>> => {
    const existingMap = new Map<string, string>();
    if (names.length === 0) return existingMap;

    for (let i = 0; i < names.length; i += 10) {
      const batch = names.slice(i, i + 10);
      try {
        const q = query(collection(firestore, "customers"), where("name", "in", batch));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.name) existingMap.set(data.name, docSnap.id);
        });
      } catch (err) {
        console.error("Error checking existing customers:", err);
      }
    }
    return existingMap;
  };

  // Transform row to customer data
  const transformRow = (row: Record<string, any>): Record<string, any> => {
    const customer: Record<string, any> = {};
    Object.entries(columnMapping).forEach(([csvCol, field]) => {
      const value = row[csvCol];
      if (value === undefined || value === null || value === "") return;
      customer[field] = value.toString().trim();
    });
    return customer;
  };

  // Proceed to validation
  const handleProceedToValidation = async () => {
    if (!parsedData) return;
    setIsProcessing(true);
    setError(null);

    try {
      const transformedRows = parsedData.rows.map((row) => transformRow(row));
      const validation = validateCustomerData(transformedRows);
      setValidationResult(validation);

      const customerNames = transformedRows.map((r) => r.name).filter(Boolean);
      const existing = await checkExistingCustomers(customerNames);
      setDuplicateCheck(existing);

      setCurrentStep("validation");
    } catch (err: any) {
      setError(err.message || "Validasi gagal");
    } finally {
      setIsProcessing(false);
    }
  };

  // Perform import
  const handleImport = async () => {
    if (!parsedData) return;

    setCurrentStep("importing");
    setIsProcessing(true);
    setError(null);

    const MIN_DISPLAY_MS = 1500;
    const startTime = Date.now();

    try {
      const transformedRows = parsedData.rows.map((row) => transformRow(row));
      const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

      for (let i = 0; i < transformedRows.length; i++) {
        const customerData = transformedRows[i];
        try {
          const existingDocId = customerData.name ? duplicateCheck?.get(customerData.name) : undefined;

          if (existingDocId) {
            if (importConfig.skipDuplicates) {
              result.skipped++;
              continue;
            } else if (importConfig.updateExisting) {
              const docRef = doc(firestore, "customers", existingDocId);
              // Build structured data
              const updateData = buildCustomerDoc(customerData);
              await updateDoc(docRef, {
                ...updateData,
                updatedAt: serverTimestamp(),
                updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
              });
              result.success++;
              continue;
            }
          }

          // Create new customer
          const newData = buildCustomerDoc(customerData);
          await addDoc(collection(firestore, "customers"), {
            ...newData,
            createdAt: serverTimestamp(),
            createdBy: user?.uid ? doc(firestore, "users", user.uid) : null,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
          });
          result.success++;
        } catch (err: any) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            field: "general",
            message: err.message || "Gagal mengimpor pelanggan",
          });
        }
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DISPLAY_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_DISPLAY_MS - elapsed));
      }

      setImportResult(result);
      setCurrentStep("complete");
    } catch (err: any) {
      setError(err.message || "Impor gagal");
      setCurrentStep("validation");
    } finally {
      setIsProcessing(false);
    }
  };

  // Build structured customer document from flat CSV data
  const buildCustomerDoc = (data: Record<string, any>) => {
    const doc: Record<string, any> = {
      name: data.name || "",
      customerType: data.customerType || "corporate",
      businessField: data.businessField || "",
    };

    // Build address object
    if (data.street || data.village || data.district || data.city || data.province || data.postalCode) {
      doc.address = {
        street: data.street || "",
        village: data.village || "",
        district: data.district || "",
        city: data.city || "",
        province: data.province || "",
        postalCode: data.postalCode || "",
      };
    }

    // Build contacts array
    if (data.primaryContactName || data.primaryContactEmail || data.primaryContactPhone) {
      const contactId = `contact_${Date.now()}`;
      doc.contacts = [
        {
          id: contactId,
          name: data.primaryContactName || "",
          email: data.primaryContactEmail || "",
          phone: data.primaryContactPhone || "",
          position: data.primaryContactPosition || "",
        },
      ];
      doc.primaryContactId = contactId;
    }

    if (data.notes) doc.notes = data.notes;

    return doc;
  };

  const handleDownloadErrors = () => {
    if (!importResult || importResult.errors.length === 0) return;
    const csvContent = [
      "Baris,Field,Error",
      ...importResult.errors.map((e) => `${e.row},"${e.field}","${e.message}"`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer_import_errors.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetWizard = () => {
    setCurrentStep("upload");
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setValidationResult(null);
    setImportConfig({ skipDuplicates: true, updateExisting: false });
    setImportResult(null);
    setDuplicateCheck(null);
    setError(null);
  };

  const handleShowRequirements = () => setIsHelpSectionOpen(!isHelpSectionOpen);

  // Customer field options for mapping
  const customerFields = [
    { value: "name", label: "Nama Pelanggan" },
    { value: "customerType", label: "Tipe Pelanggan" },
    { value: "businessField", label: "Bidang Usaha" },
    { value: "street", label: "Alamat Jalan" },
    { value: "village", label: "Desa/Kelurahan" },
    { value: "district", label: "Kecamatan" },
    { value: "city", label: "Kota/Kabupaten" },
    { value: "province", label: "Provinsi" },
    { value: "postalCode", label: "Kode Pos" },
    { value: "primaryContactName", label: "Nama Kontak Utama" },
    { value: "primaryContactEmail", label: "Email Kontak Utama" },
    { value: "primaryContactPhone", label: "Telepon Kontak Utama" },
    { value: "primaryContactPosition", label: "Posisi Kontak Utama" },
    { value: "notes", label: "Catatan" },
  ];

  const requiredFields = ["name"];

  const fieldGroups = [
    {
      name: "Info Pelanggan",
      fields: customerFields.filter((f) => ["name", "customerType", "businessField"].includes(f.value)),
    },
    {
      name: "Alamat",
      fields: customerFields.filter((f) => ["street", "village", "district", "city", "province", "postalCode"].includes(f.value)),
    },
    {
      name: "Kontak Utama",
      fields: customerFields.filter((f) => ["primaryContactName", "primaryContactEmail", "primaryContactPhone", "primaryContactPosition"].includes(f.value)),
    },
    {
      name: "Lainnya",
      fields: customerFields.filter((f) => ["notes"].includes(f.value)),
    },
  ];

  return (
    <div className="flex min-h-0 h-full flex-col">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/admin/customers"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Pelanggan
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="mb-4 rounded-lg border border-white/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center">
          {[
            { key: "upload", label: "Unggah" },
            { key: "mapping", label: "Pemetaan" },
            { key: "validation", label: "Validasi" },
            { key: "importing", label: "Impor" },
            { key: "complete", label: "Selesai" },
          ].map((step, index) => {
            const stepIndex = ["upload", "mapping", "validation", "importing", "complete"].indexOf(currentStep);
            const isActive = currentStep === step.key;
            const isCompleted = index < stepIndex;

            return (
              <React.Fragment key={step.key}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isActive || isCompleted ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`hidden text-sm font-medium sm:inline ${isActive ? "text-gray-900" : isCompleted ? "text-gray-700" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className="mx-3 flex-1">
                    <div className={`h-0.5 w-full rounded-full transition-colors ${index < stepIndex ? "bg-primary" : "bg-gray-200"}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/80 bg-white p-6 shadow-sm">
        {/* Step 1: Upload */}
        {currentStep === "upload" && (
          <div className="flex flex-1 flex-col gap-4">
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-1 items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-stroke bg-blue-50/30 hover:border-primary hover:bg-primary/5"
              }`}
            >
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" disabled={isProcessing} />
              <label htmlFor="csv-upload" className="cursor-pointer">
                {!file ? (
                  <>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-base font-medium text-gray-900">
                      {isDragging ? "Lepaskan file di sini" : "Klik atau seret file CSV ke sini"}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">Maksimal 10MB</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-base font-medium text-gray-900">{file.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{parsedData?.rows.length || 0} baris ditemukan</p>
                    <button onClick={resetWizard} className="mt-2 text-xs font-medium text-primary hover:underline">
                      Pilih file lain
                    </button>
                  </div>
                )}
              </label>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button onClick={() => downloadCustomerCSVTemplate()} className="font-medium text-primary hover:underline">
                Unduh template CSV
              </button>
              <button onClick={handleShowRequirements} className="font-medium text-gray-500 hover:text-gray-700 transition-colors">
                Lihat persyaratan format
              </button>
            </div>

            {isHelpSectionOpen && (
              <div className="rounded-lg border border-stroke bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">Field Wajib</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>Nama Pelanggan</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">Tipe Pelanggan Valid</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>corporate, individual, government, bumn</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {currentStep === "mapping" && parsedData && (
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">{Object.keys(columnMapping).length}</span> dari{" "}
                <span className="font-medium text-gray-700">{parsedData.headers.length}</span> kolom dipetakan
                {" · "}
                <span className="font-medium text-gray-700">{parsedData.rows.length}</span> baris
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentStep("upload")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  Kembali
                </button>
                <button
                  onClick={handleProceedToValidation}
                  disabled={isProcessing || Object.keys(columnMapping).length === 0}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isProcessing ? "Memproses..." : "Validasi Data"}
                </button>
              </div>
            </div>

            {(() => {
              const mappedFields = Object.values(columnMapping);
              const missingRequired = requiredFields.filter((field) => !mappedFields.includes(field));
              if (missingRequired.length > 0) {
                return (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    Field wajib belum dipetakan: {missingRequired.map((f) => customerFields.find((cf) => cf.value === f)?.label).join(", ")}
                  </div>
                );
              }
              return null;
            })()}

            <div className="styled-scrollbar max-h-[calc(100vh-320px)] overflow-y-auto">
              <table className="w-full table-auto">
                <thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3">Kolom CSV</th>
                    <th className="px-4 py-3">Contoh Data</th>
                    <th className="px-4 py-3">Impor Sebagai</th>
                    <th className="px-4 py-3 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {parsedData.headers.map((header) => {
                    const mappedField = columnMapping[header];
                    return (
                      <tr key={header} className="text-sm hover:bg-blue-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{header}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-500">{parsedData.rows[0]?.[header] || "-"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={mappedField || ""}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="h-9 w-full max-w-xs rounded-lg border border-stroke bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
                          >
                            <option value="">Lewati</option>
                            {fieldGroups.map((group) => (
                              <optgroup key={group.name} label={group.name}>
                                {group.fields.map((field) => (
                                  <option key={field.value} value={field.value}>{field.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={`mx-auto h-2.5 w-2.5 rounded-full ${mappedField ? "bg-primary" : "bg-gray-300"}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {currentStep === "validation" && validationResult && (
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="rounded-lg border border-stroke bg-white px-4 py-3 shadow-sm">
                  <div className="text-lg font-bold text-gray-900">{parsedData?.rows.length || 0}</div>
                  <div className="text-xs text-gray-500">Total Pelanggan</div>
                  <div className="mt-1 text-xs text-gray-400">Ditemukan di file CSV</div>
                </div>

                {validationResult.errors.length > 0 && (
                  <div className="rounded-lg border border-stroke bg-white px-4 py-3 shadow-sm">
                    <div className="text-lg font-bold text-gray-900">{validationResult.errors.length}</div>
                    <div className="text-xs text-gray-500">Error</div>
                    <div className="mt-1 text-xs text-gray-400">Harus diperbaiki di file CSV</div>
                  </div>
                )}

                {(duplicateCheck?.size || 0) > 0 && (
                  <div className="rounded-lg border border-stroke bg-white px-4 py-3 shadow-sm">
                    <div className="text-lg font-bold text-gray-900">{duplicateCheck?.size || 0}</div>
                    <div className="text-xs text-gray-500">Duplikat</div>
                    <div className="mt-1 text-xs text-gray-400">Nama pelanggan sudah ada di database</div>
                    <div className="mt-2 space-y-1.5 border-t border-stroke pt-2">
                      <label className="flex cursor-pointer items-start gap-1.5 text-xs">
                        <input type="radio" checked={importConfig.skipDuplicates} onChange={() => setImportConfig({ skipDuplicates: true, updateExisting: false })} className="mt-0.5 text-primary focus:ring-primary" />
                        <span>
                          <span className="font-medium text-gray-700">Lewati</span>
                          <span className="text-gray-400"> — abaikan, tidak diimpor</span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-1.5 text-xs">
                        <input type="radio" checked={importConfig.updateExisting} onChange={() => setImportConfig({ skipDuplicates: false, updateExisting: true })} className="mt-0.5 text-primary focus:ring-primary" />
                        <span>
                          <span className="font-medium text-gray-700">Perbarui</span>
                          <span className="text-gray-400"> — timpa data lama dengan data CSV</span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentStep("mapping")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  Kembali
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isProcessing ? "Memproses..." : `Mulai Impor (${parsedData?.rows.length || 0})`}
                </button>
              </div>
            </div>

            {validationResult.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {validationResult.warnings.length} peringatan ditemukan (tidak menghalangi impor)
              </div>
            )}

            <div className="styled-scrollbar max-h-[calc(100vh-420px)] overflow-auto">
              <table className="w-full table-auto">
                <thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3">Status Impor</th>
                    <th className="px-4 py-3">Baris CSV</th>
                    {Object.entries(columnMapping).map(([csvCol, field]) => (
                      <th key={csvCol} className="px-4 py-3">
                        {customerFields.find((f) => f.value === field)?.label || field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {parsedData?.rows.slice(0, 50).map((row, index) => {
                    const rowNum = index + 2;
                    const rowErrors = validationResult.errors.filter((e) => e.row === rowNum);
                    const customerName = row[Object.entries(columnMapping).find(([, f]) => f === "name")?.[0] || ""] || "";
                    const isDuplicate = customerName && duplicateCheck?.has(customerName);

                    let status: { label: string; className: string };
                    if (rowErrors.length > 0) {
                      status = {
                        label: rowErrors.map((e) => `${getFieldDisplayName(e.field)}: ${e.message}`).join("; "),
                        className: "text-red-700",
                      };
                    } else if (isDuplicate) {
                      status = { label: "Duplikat — nama pelanggan sudah ada", className: "text-amber-600" };
                    } else {
                      status = { label: "Siap diimpor", className: "text-green-700" };
                    }

                    return (
                      <tr key={index} className="text-sm hover:bg-blue-50/50">
                        <td className={`max-w-[250px] px-4 py-2 text-xs font-medium ${status.className}`}>{status.label}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">{index + 1}</td>
                        {Object.entries(columnMapping).map(([csvCol]) => (
                          <td key={csvCol} className="max-w-[200px] truncate px-4 py-2 text-gray-700">{row[csvCol] || "-"}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(parsedData?.rows.length || 0) > 50 && (
                <p className="p-3 text-center text-xs text-gray-500">Menampilkan 50 dari {parsedData?.rows.length} baris</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {currentStep === "importing" && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Mengimpor Pelanggan Anda</h2>
              <p className="mt-2 text-sm text-gray-600">
                Memproses {parsedData?.rows.length || 0} pelanggan...
              </p>
            </div>
            <div className="mt-6 w-full max-w-md">
              <div className="rounded-full bg-gray-200 p-1">
                <div className="h-2 w-full animate-pulse rounded-full bg-primary"></div>
              </div>
            </div>
            <div className="mt-8 max-w-md rounded-lg border border-stroke bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-700">
                <strong>Tips:</strong> Jangan tutup halaman ini saat kami mengimpor data Anda.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Completion */}
        {currentStep === "complete" && importResult && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">Impor Selesai</h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm">
                <span className="text-gray-500">
                  <span className="font-semibold text-green-700">{importResult.success}</span> berhasil
                </span>
                {importResult.skipped > 0 && (
                  <span className="text-gray-500">
                    <span className="font-semibold text-amber-600">{importResult.skipped}</span> dilewati
                  </span>
                )}
                {importResult.failed > 0 && (
                  <span className="text-gray-500">
                    <span className="font-semibold text-red-600">{importResult.failed}</span> gagal
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {importResult.errors.length > 0 && (
                <button onClick={handleDownloadErrors} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50">
                  Unduh Laporan Error
                </button>
              )}
              <button onClick={resetWizard} className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                Impor Lagi
              </button>
              <Link href="/admin/customers" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90">
                Lihat Semua Pelanggan
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
