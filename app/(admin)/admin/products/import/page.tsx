"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseCSV, autoMapColumns, validateProductData, transformRowToProduct } from "@/utils/csvParser";
import { bulkImportProducts, createErrorReport } from "@/utils/bulkOperations";
import { checkMultipleProductNumbers } from "@/utils/productValidator";
import { downloadCSV } from "@/utils/exportGenerator";
import { useAdmin } from "@/app/context/AdminContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { ImportConfig, ImportResult, ValidationResult } from "@/types/bulkOperations";
import { getFieldDisplayName } from "@/utils/validationMessages";

type ImportStep = 'upload' | 'mapping' | 'validation' | 'importing' | 'complete';

/**
 * Product Import Wizard Page
 * Provides step-by-step interface for importing products from CSV files
 */
export default function ProductImportPage() {
  const router = useRouter();
  const { user } = useAdmin();
  usePageHeader("Impor Produk", "Impor produk dari file CSV dengan panduan langkah demi langkah");
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ headers: string[], rows: Record<string, any>[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [originalAutoMapping, setOriginalAutoMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    mapping: {},
    skipDuplicates: true,
    updateExisting: false,
    validateBeforeImport: true
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check for duplicates in database
  const [duplicateCheck, setDuplicateCheck] = useState<Set<number> | null>(null);
  
  // State for help section
  const [isHelpSectionOpen, setIsHelpSectionOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Processes a selected CSV file (shared by click and drag-and-drop)
   */
  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Silakan unggah file CSV');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const data = await parseCSV(selectedFile);
      setParsedData(data);

      const mapping = autoMapColumns(data.headers);
      setColumnMapping(mapping);
      setOriginalAutoMapping(mapping);
      setImportConfig(prev => ({ ...prev, mapping }));

      setCurrentStep('mapping');
    } catch (err: any) {
      setError(err.message || 'Gagal memproses file CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles file selection via input click
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  /**
   * Drag-and-drop handlers
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  /**
   * Comprehensive reset function to clear all import states
   */
  const resetWizard = () => {
    setCurrentStep('upload');
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setOriginalAutoMapping({});
    setValidationResult(null);
    setImportConfig({
      mapping: {},
      skipDuplicates: true,
      updateExisting: false,
      validateBeforeImport: true
    });
    setImportResult(null);
    setDuplicateCheck(null);
    setError(null);
    // Don't reset isProcessing or isHelpSectionOpen as they're UI state
  };

  /**
   * Updates column mapping when user changes selection
   */
  const handleMappingChange = (csvColumn: string, productField: string) => {
    const newMapping = { ...columnMapping };
    
    if (productField === '') {
      delete newMapping[csvColumn];
    } else {
      // Remove any existing mapping to this field
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === productField && key !== csvColumn) {
          delete newMapping[key];
        }
      });
      newMapping[csvColumn] = productField;
    }
    
    setColumnMapping(newMapping);
    setImportConfig(prev => ({ ...prev, mapping: newMapping }));
  };

  /**
   * Proceeds to validation step
   */
  const handleProceedToValidation = async () => {
    if (!parsedData) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Transform data according to mapping
      const transformedRows = parsedData.rows.map(row => 
        transformRowToProduct(row, columnMapping)
      );
      
      // Validate data
      const validation = validateProductData(transformedRows, true);
      setValidationResult(validation);
      
      // Check for existing product numbers in database
      const productNumbers = transformedRows
        .map(r => Number(r.productNumber))
        .filter(n => !isNaN(n));
      const existing = await checkMultipleProductNumbers(productNumbers);
      setDuplicateCheck(existing);
      
      setCurrentStep('validation');
    } catch (err: any) {
      setError(err.message || 'Validasi gagal');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Performs the actual import
   */
  const handleImport = async () => {
    if (!parsedData) return;

    setCurrentStep('importing');
    setIsProcessing(true);
    setError(null);

    const MIN_DISPLAY_MS = 1500;
    const startTime = Date.now();

    try {
      // Transform data for import
      const transformedRows = parsedData.rows.map(row =>
        transformRowToProduct(row, columnMapping)
      );

      // Perform import
      const result = await bulkImportProducts(
        transformedRows,
        importConfig,
        user?.uid
      );

      // Ensure step 4 is visible for at least 5 seconds
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DISPLAY_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_MS - elapsed));
      }

      setImportResult(result);
      setCurrentStep('complete');
    } catch (err: any) {
      setError(err.message || 'Impor gagal');
      setCurrentStep('validation');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads error report as CSV
   */
  const handleDownloadErrors = () => {
    if (!importResult || importResult.errors.length === 0) return;
    
    const errorCsv = createErrorReport(importResult.errors);
    downloadCSV(errorCsv, 'import_errors.csv');
  };

  const handleShowRequirements = () => {
    setIsHelpSectionOpen(!isHelpSectionOpen);
  };

  // Product field options for mapping
  const productFields = [
    { value: 'productNumber', label: 'Nomor Produk' },
    { value: 'name', label: 'Nama Produk' },
    { value: 'productType', label: 'Tipe Produk' },
    { value: 'brand', label: 'Merk' },
    { value: 'brandType', label: 'Tipe/Model Merk' },
    { value: 'source', label: 'Sumber/Vendor' },
    { value: 'maintenanceInterval', label: 'Interval Perawatan' },
    { value: 'serialNumber', label: 'Nomor Seri' },
    { value: 'manufactureDate', label: 'Tanggal Produksi' },
    { value: 'installationDate', label: 'Tanggal Instalasi' },
    { value: 'expirationDate', label: 'Tanggal Kadaluarsa' },
    // Type-specific fields
    { value: 'height', label: 'Tinggi' },
    { value: 'width', label: 'Lebar' },
    { value: 'pressure', label: 'Tekanan' },
    { value: 'capacity', label: 'Kapasitas' },
    { value: 'agentType', label: 'Jenis Media' },
    { value: 'weight', label: 'Berat' },
    { value: 'flowRate', label: 'Debit Aliran' },
    { value: 'valveType', label: 'Tipe Valve' },
    { value: 'hoseLength', label: 'Panjang Selang' },
    { value: 'material', label: 'Material' },
    { value: 'resolution', label: 'Resolusi' },
    { value: 'lens', label: 'Lensa' },
    { value: 'nightVision', label: 'Night Vision' },
    { value: 'power', label: 'Daya' },
    { value: 'connectivity', label: 'Konektivitas' },
    { value: 'pan', label: 'Pan' },
    { value: 'tilt', label: 'Tilt' },
    { value: 'storageCapacity', label: 'Kapasitas Storage' },
    { value: 'sensorType', label: 'Tipe Sensor' },
    { value: 'coverageArea', label: 'Area Cakupan' },
    { value: 'soundLevel', label: 'Level Suara' },
    { value: 'batteryBackup', label: 'Backup Baterai' },
    { value: 'lockType', label: 'Tipe Kunci' },
    { value: 'openingSpeed', label: 'Kecepatan Buka' },
    { value: 'deviceType', label: 'Tipe Perangkat' },
    { value: 'batteryLife', label: 'Daya Tahan Baterai' },
    { value: 'patrolInterval', label: 'Interval Patroli' },
    { value: 'firmwareVersion', label: 'Versi Firmware' }
  ];

  return (
    <div className="flex min-h-0 h-full flex-col">
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

      {/* Progress Steps */}
      <div className="mb-4 rounded-lg border border-white/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center">
          {[
            { key: 'upload', label: 'Unggah' },
            { key: 'mapping', label: 'Pemetaan' },
            { key: 'validation', label: 'Validasi' },
            { key: 'importing', label: 'Impor' },
            { key: 'complete', label: 'Selesai' },
          ].map((step, index) => {
            const stepIndex = ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(currentStep);
            const isActive = currentStep === step.key;
            const isCompleted = index < stepIndex;

            return (
              <React.Fragment key={step.key}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : isCompleted
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
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
                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      isActive ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < 4 && (
                  <div className="mx-3 flex-1">
                    <div
                      className={`h-0.5 w-full rounded-full transition-colors ${
                        index < stepIndex ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
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
        {currentStep === 'upload' && (
          <div className="flex flex-1 flex-col gap-4">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-1 items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-stroke bg-blue-50/30 hover:border-primary hover:bg-primary/5'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
                disabled={isProcessing}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                {!file ? (
                  <>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-base font-medium text-gray-900">
                      {isDragging ? 'Lepaskan file di sini' : 'Klik atau seret file CSV ke sini'}
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
                    <p className="mt-1 text-sm text-gray-500">
                      {parsedData?.rows.length || 0} baris ditemukan
                    </p>
                    <button
                      onClick={resetWizard}
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                    >
                      Pilih file lain
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Template download + Help toggle — single row */}
            <div className="flex items-center justify-between text-sm">
              <a
                href="/api/products/template"
                download="product_import_template.csv"
                className="font-medium text-primary hover:underline"
              >
                Unduh template CSV
              </a>
              <button
                onClick={handleShowRequirements}
                className="font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Lihat persyaratan format
              </button>
            </div>

            {/* Collapsible Help Section */}
            {isHelpSectionOpen && (
              <div className="rounded-lg border border-stroke bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">Field Wajib</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>Nomor Produk (harus unik)</li>
                      <li>Nama Produk</li>
                      <li>Tipe Produk</li>
                      <li>Merk</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">Tipe Produk Valid</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>APAR, HYDRANT, CCTV</li>
                      <li>FIRE_ALARM, ACCESS_DOOR, PATROL_GUARD</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {currentStep === 'mapping' && parsedData && (
          <div className="flex flex-1 flex-col gap-4">
            {/* Summary + Navigation bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">{Object.keys(columnMapping).length}</span> dari{" "}
                <span className="font-medium text-gray-700">{parsedData.headers.length}</span> kolom dipetakan
                {" · "}
                <span className="font-medium text-gray-700">{parsedData.rows.length}</span> baris
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleProceedToValidation}
                  disabled={isProcessing || Object.keys(columnMapping).length === 0}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isProcessing ? 'Memproses...' : 'Validasi Data'}
                </button>
              </div>
            </div>

            {/* Missing required fields warning */}
            {(() => {
              const requiredFields = ['productNumber', 'name', 'productType', 'brand'];
              const mappedFields = Object.values(columnMapping);
              const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
              if (missingRequired.length > 0) {
                return (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    Field wajib belum dipetakan: {missingRequired.map(f => productFields.find(pf => pf.value === f)?.label).join(', ')}
                  </div>
                );
              }
              return null;
            })()}

            {/* Mapping table */}
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
                  {parsedData.headers.map(header => {
                    const mappedField = columnMapping[header];
                    const fieldGroups = [
                      {
                        name: "Info Dasar",
                        fields: productFields.filter(f =>
                          ['productNumber', 'name', 'productType', 'brand', 'brandType', 'source'].includes(f.value)
                        )
                      },
                      {
                        name: "Spesifikasi",
                        fields: productFields.filter(f =>
                          ['serialNumber', 'weight', 'height', 'width', 'pressure', 'capacity', 'material'].includes(f.value)
                        )
                      },
                      {
                        name: "Tanggal",
                        fields: productFields.filter(f =>
                          ['manufactureDate', 'installationDate', 'expirationDate', 'maintenanceInterval'].includes(f.value)
                        )
                      },
                      {
                        name: "Detail Teknis",
                        fields: productFields.filter(f =>
                          !['productNumber', 'name', 'productType', 'brand', 'brandType', 'source', 'serialNumber', 'weight', 'height', 'width', 'pressure', 'capacity', 'material', 'manufactureDate', 'installationDate', 'expirationDate', 'maintenanceInterval'].includes(f.value)
                        )
                      }
                    ];

                    return (
                      <tr key={header} className="text-sm hover:bg-blue-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{header}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-500">
                            {parsedData.rows[0]?.[header] || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={mappedField || ''}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="h-9 w-full max-w-xs rounded-lg border border-stroke bg-white px-3 text-sm outline-none transition-colors focus:border-primary"
                          >
                            <option value="">Lewati</option>
                            {fieldGroups.map(group => (
                              <optgroup key={group.name} label={group.name}>
                                {group.fields.map(field => (
                                  <option key={field.value} value={field.value}>
                                    {field.label}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={`mx-auto h-2.5 w-2.5 rounded-full ${mappedField ? 'bg-primary' : 'bg-gray-300'}`} />
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
        {currentStep === 'validation' && validationResult && (
          <div className="flex flex-1 flex-col gap-4">
            {/* Summary cards + Navigation row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="rounded-lg border border-stroke bg-white px-4 py-3 shadow-sm">
                  <div className="text-lg font-bold text-gray-900">{parsedData?.rows.length || 0}</div>
                  <div className="text-xs text-gray-500">Total Produk</div>
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
                    <div className="mt-1 text-xs text-gray-400">Nomor produk sudah ada di database</div>
                    <div className="mt-2 space-y-1.5 border-t border-stroke pt-2">
                      <label className="flex cursor-pointer items-start gap-1.5 text-xs">
                        <input
                          type="radio"
                          checked={importConfig.skipDuplicates}
                          onChange={() => setImportConfig(prev => ({ ...prev, skipDuplicates: true, updateExisting: false }))}
                          className="mt-0.5 text-primary focus:ring-primary"
                        />
                        <span>
                          <span className="font-medium text-gray-700">Lewati</span>
                          <span className="text-gray-400"> — abaikan, tidak diimpor</span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-1.5 text-xs">
                        <input
                          type="radio"
                          checked={importConfig.updateExisting}
                          onChange={() => setImportConfig(prev => ({ ...prev, updateExisting: true, skipDuplicates: false }))}
                          className="mt-0.5 text-primary focus:ring-primary"
                        />
                        <span>
                          <span className="font-medium text-gray-700">Perbarui</span>
                          <span className="text-gray-400"> — timpa data lama dengan data di CSV</span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep('mapping')}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing || (validationResult.errors.length > 0 && !importConfig.skipDuplicates && !importConfig.updateExisting)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isProcessing ? 'Memproses...' : `Mulai Impor (${parsedData?.rows.length || 0})`}
                </button>
              </div>
            </div>

            {/* Warnings (compact) */}
            {validationResult.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {validationResult.warnings.length} peringatan ditemukan (tidak menghalangi impor)
              </div>
            )}

            {/* Data preview table with status */}
            <div className="styled-scrollbar max-h-[calc(100vh-420px)] overflow-auto">
              <table className="w-full table-auto">
                <thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3">Status Impor</th>
                    <th className="px-4 py-3">Baris CSV</th>
                    {Object.entries(columnMapping).map(([csvCol, field]) => (
                      <th key={csvCol} className="px-4 py-3">
                        {productFields.find(f => f.value === field)?.label || field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {parsedData?.rows.slice(0, 50).map((row, index) => {
                    const rowNum = index + 2;
                    const rowErrors = validationResult.errors.filter(e => e.row === rowNum);
                    const productNumber = Number(row[Object.entries(columnMapping).find(([, f]) => f === 'productNumber')?.[0] || '']);
                    const isDuplicate = !isNaN(productNumber) && duplicateCheck?.has(productNumber);

                    let status: { label: string; className: string };
                    if (rowErrors.length > 0) {
                      status = {
                        label: rowErrors.map(e => `${getFieldDisplayName(e.field)}: ${e.message}`).join('; '),
                        className: 'text-red-700',
                      };
                    } else if (isDuplicate) {
                      status = {
                        label: 'Duplikat — nomor produk sudah ada',
                        className: 'text-amber-600',
                      };
                    } else {
                      status = {
                        label: 'Siap diimpor',
                        className: 'text-green-700',
                      };
                    }

                    return (
                      <tr key={index} className="text-sm hover:bg-blue-50/50">
                        <td className={`max-w-[250px] px-4 py-2 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">{index + 1}</td>
                        {Object.entries(columnMapping).map(([csvCol]) => (
                          <td key={csvCol} className="max-w-[200px] truncate px-4 py-2 text-gray-700">
                            {row[csvCol] || '-'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(parsedData?.rows.length || 0) > 50 && (
                <p className="p-3 text-center text-xs text-gray-500">
                  Menampilkan 50 dari {parsedData?.rows.length} baris
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Enhanced Importing */}
        {currentStep === 'importing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Mengimpor Produk Anda</h2>
              <p className="mt-2 text-sm text-gray-600">
                Memproses {parsedData?.rows.length || 0} produk... Ini biasanya memakan waktu beberapa saat.
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
                Kami akan menunjukkan ringkasan detail setelah selesai!
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Completion */}
        {currentStep === 'complete' && importResult && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            {/* Result summary */}
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

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {importResult.errors.length > 0 && (
                <button
                  onClick={handleDownloadErrors}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  Unduh Laporan Error
                </button>
              )}
              <button
                onClick={resetWizard}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Impor Lagi
              </button>
              <Link
                href="/admin/products"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Lihat Semua Produk
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}