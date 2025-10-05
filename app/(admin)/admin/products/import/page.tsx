"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseCSV, autoMapColumns, validateProductData, transformRowToProduct } from "@/utils/csvParser";
import { bulkImportProducts, generateImportSummary, createErrorReport } from "@/utils/bulkOperations";
import { checkMultipleProductNumbers } from "@/utils/productValidator";
import { downloadCSV } from "@/utils/exportGenerator";
import { useAdmin } from "@/app/context/AdminContext";
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
  const helpSectionRef = useRef<HTMLDetailsElement>(null);

  /**
   * Handles file selection and initial parsing
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
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
      
      // Auto-map columns
      const mapping = autoMapColumns(data.headers);
      setColumnMapping(mapping);
      setOriginalAutoMapping(mapping); // Store original auto-mapping
      setImportConfig(prev => ({ ...prev, mapping }));
      
      setCurrentStep('mapping');
    } catch (err: any) {
      setError(err.message || 'Gagal memproses file CSV');
    } finally {
      setIsProcessing(false);
    }
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

  /**
   * Handles clicking the "Lihat Persyaratan" button
   * Opens the help section and scrolls to it
   */
  const handleShowRequirements = () => {
    setIsHelpSectionOpen(true);
    
    // Scroll to help section after state update
    setTimeout(() => {
      if (helpSectionRef.current) {
        helpSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  /**
   * Handles manual toggle of help section
   * Prevents default behavior and manages state
   */
  const handleToggleHelp = (e: React.MouseEvent) => {
    e.preventDefault();
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
    <div className="mx-auto max-w-7xl">
      {/* Enhanced Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center text-sm text-gray-500">
          <Link href="/admin/products" className="hover:text-gray-700">
            Produk
          </Link>
          <svg className="mx-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900">Impor</span>
        </nav>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Impor Produk</h1>
            <p className="mt-1 text-sm text-gray-600">Impor produk dari file CSV dengan panduan langkah demi langkah</p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Produk
          </Link>
        </div>
      </div>

      {/* Enhanced Progress Steps */}
      <div className="mb-8">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center px-4 sm:px-0">
            {[
              { 
                key: 'upload', 
                label: 'Unggah File', 
                description: 'Pilih CSV', 
                icon: (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )
              },
              { 
                key: 'mapping', 
                label: 'Petakan Kolom', 
                description: 'Sesuaikan field', 
                icon: (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )
              },
              { 
                key: 'validation', 
                label: 'Validasi', 
                description: 'Periksa data', 
                icon: (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              { 
                key: 'importing', 
                label: 'Impor', 
                description: 'Memproses', 
                icon: (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              { 
                key: 'complete', 
                label: 'Selesai', 
                description: 'Selesai', 
                icon: (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((step, index) => {
              const stepIndex = ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(currentStep);
              const isActive = currentStep === step.key;
              const isCompleted = index < stepIndex;
              const isPending = index > stepIndex;

              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl transition-all duration-200 ${
                        isActive
                          ? 'border-primary bg-primary text-white shadow-lg'
                          : isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 bg-gray-100 text-gray-400'
                      }`}
                    >
                      {React.isValidElement(step.icon) ? React.cloneElement(step.icon as React.ReactElement, { className: 'h-7 w-7' }) : step.icon}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-400">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < 4 && (
                    <div className="flex-1 flex items-center px-3">
                      <div
                        className={`h-0.5 w-full rounded-full transition-colors duration-300 ${
                          index < stepIndex ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

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

      <div className="rounded-lg border border-stroke bg-white p-6">
        {/* Step 1: Enhanced Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Unggah File CSV Anda</h2>
              <p className="mt-2 text-sm text-gray-600">
                Mulai dengan mengunggah file data produk Anda. Kami akan memandu Anda melalui sisanya!
              </p>
            </div>
            
            {/* Enhanced Upload Area */}
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-12 text-center transition-colors hover:border-primary hover:bg-primary/5">
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
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Pilih file CSV Anda</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Klik di sini untuk memilih file atau seret dan lepas
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Mendukung file CSV hingga 10MB
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">File berhasil diunggah!</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {file.name} • {parsedData?.rows.length || 0} baris ditemukan
                    </p>
                    <button
                      onClick={resetWizard}
                      className="mt-2 text-xs text-primary hover:text-primary/80"
                    >
                      Pilih file lain
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="flex items-center text-sm font-medium text-gray-900">
                  <svg className="mr-2 h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Unduh Template
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Dapatkan template CSV kami dengan data contoh
                </p>
                <a
                  href="/api/products/template"
                  download="product_import_template.csv"
                  className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Unduh Template CSV →
                </a>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="flex items-center text-sm font-medium text-gray-900">
                  <svg className="mr-2 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tips Cepat
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Panduan format yang penting
                </p>
                <button 
                  onClick={handleShowRequirements}
                  className="mt-2 inline-flex items-center text-xs font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  Lihat Persyaratan →
                </button>
              </div>
            </div>

            {/* Collapsible Help Section */}
            <details 
              ref={helpSectionRef}
              open={isHelpSectionOpen}
              className="rounded-lg border border-gray-200 bg-white"
            >
              <summary 
                className="cursor-pointer p-4 text-sm font-medium text-gray-900 hover:bg-gray-50"
                onClick={handleToggleHelp}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Persyaratan Data & Panduan Format</span>
                </div>
              </summary>
              <div className="border-t border-gray-200 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Field Wajib</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• Nomor Produk (harus unik)</li>
                      <li>• Nama Produk</li>
                      <li>• Tipe Produk</li>
                      <li>• Merk</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tipe Produk Valid</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• APAR (Alat Pemadam Api Ringan)</li>
                      <li>• HYDRANT (Hidran Kebakaran)</li>
                      <li>• CCTV (Kamera Keamanan)</li>
                      <li>• FIRE_ALARM (Alarm Kebakaran)</li>
                      <li>• ACCESS_DOOR (Pintu Akses)</li>
                      <li>• PATROL_GUARD (Sistem Patroli)</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs text-amber-800">
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span><strong>Tips:</strong> Gunakan template kami untuk memastikan format yang benar dan menghindari kesalahan umum.</span>
                    </div>
                  </p>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Step 2: Smart Column Mapping */}
        {currentStep === 'mapping' && parsedData && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Cocokkan Field Data Anda</h2>
              <p className="mt-2 text-sm text-gray-600">
                Kami telah mencocokkan beberapa field secara otomatis. Tinjau dan sesuaikan jika diperlukan.
              </p>
            </div>

            {/* Mapping Summary */}
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="mr-2 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">
                    {Object.keys(columnMapping).length} dari {parsedData.headers.length} kolom dipetakan
                  </span>
                </div>
                <span className="text-xs text-blue-600">
                  {parsedData.rows.length} baris siap diimpor
                </span>
              </div>
            </div>

            {/* Column Mapping Cards */}
            <div className="space-y-4">
              {parsedData.headers.map(header => {
                const mappedField = columnMapping[header];
                const originalMapping = originalAutoMapping[header];
                const isAutoMapped = mappedField && mappedField === originalMapping;
                const fieldInfo = productFields.find(f => f.value === mappedField);
                
                // Group product fields by category for better UX
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

                const mappingStatus = mappedField ? (isAutoMapped ? 'auto-mapped' : 'manual-mapped') : 'unmapped';
                const requiredFields = ['productNumber', 'name', 'productType', 'brand'];
                const isRequired = requiredFields.includes(mappedField || '');
                
                return (
                  <div key={header} className={`rounded-lg border-2 p-5 transition-all duration-200 ${
                    mappingStatus === 'auto-mapped' ? 'border-green-300 bg-green-50/80 shadow-sm' :
                    mappingStatus === 'manual-mapped' ? 'border-blue-300 bg-blue-50/80 shadow-sm' :
                    'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}>
                    {/* Status indicator */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {mappingStatus === 'auto-mapped' && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-xs font-medium text-green-700">Otomatis</span>
                          </div>
                        )}
                        {mappingStatus === 'manual-mapped' && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-3 w-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-medium text-blue-700">Manual</span>
                          </div>
                        )}
                        {mappingStatus === 'unmapped' && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-3 w-3 rounded-full bg-gray-400"></div>
                            <span className="text-xs font-medium text-gray-500">Tidak Dipetakan</span>
                          </div>
                        )}
                      </div>
                      {isRequired && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Wajib
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      {/* Data CSV Anda */}
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">KOLOM CSV ANDA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{header}</h3>
                          {isAutoMapped && fieldInfo && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Cocok dengan: {fieldInfo.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="text-gray-500">Contoh data:</span> <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {parsedData.rows[0]?.[header] || 'Tidak ada data'}
                          </span>
                        </p>
                      </div>

                      {/* System Mapping */}
                      <div className="flex-1 max-w-xs">
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Akan Diimpor Sebagai</span>
                        </div>
                        
                        {/* Visual arrow connector */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <select
                              value={mappedField || ''}
                              onChange={(e) => handleMappingChange(header, e.target.value)}
                              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                                isAutoMapped ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
                              }`}
                            >
                              <option value="">Lewati kolom ini</option>
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
                          </div>
                        </div>
                        
                        {mappedField && fieldInfo && (
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-green-700 font-medium">
                              Data akan tersimpan di field: {fieldInfo.label}
                            </span>
                          </div>
                        )}
                        
                        {!mappedField && (
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            <div className="flex h-2 w-2 rounded-full bg-gray-400"></div>
                            <span className="text-gray-500">
                              Kolom ini akan diabaikan
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Required Fields Check */}
            {(() => {
              const requiredFields = ['productNumber', 'name', 'productType', 'brand'];
              const mappedFields = Object.values(columnMapping);
              const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
              
              if (missingRequired.length > 0) {
                return (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          Field Wajib Tidak Dipetakan
                        </h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>Silakan petakan field wajib berikut:</p>
                          <ul className="mt-1 list-disc list-inside">
                            {missingRequired.map(field => (
                              <li key={field}>{productFields.find(f => f.value === field)?.label}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Navigation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={() => setCurrentStep('upload')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Unggah
              </button>
              <button
                onClick={handleProceedToValidation}
                disabled={isProcessing || Object.keys(columnMapping).length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Validasi Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enhanced Validation Dashboard */}
        {currentStep === 'validation' && validationResult && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Pemeriksaan Kualitas Data</h2>
              <p className="mt-2 text-sm text-gray-600">
                Kami telah menganalisis data Anda. Tinjau hasilnya sebelum impor.
              </p>
            </div>

            {/* Enhanced Status Dashboard */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-green-600">
                    {parsedData?.rows.length || 0}
                  </div>
                  <div className="text-sm font-medium text-green-700">Produk Ditemukan</div>
                  <div className="text-xs text-green-600 mt-1">Siap diimpor</div>
                </div>
              </div>
              
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-amber-600">
                    {duplicateCheck?.size || 0}
                  </div>
                  <div className="text-sm font-medium text-amber-700">Duplikat Ditemukan</div>
                  <div className="text-xs text-amber-600 mt-1">Sudah ada di database</div>
                </div>
              </div>
              
              <div className={`rounded-xl border p-6 text-center ${
                validationResult.errors.length > 0 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-green-200 bg-green-50'
              }`}>
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                  validationResult.errors.length > 0 ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {validationResult.errors.length > 0 ? (
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="mt-4">
                  <div className={`text-3xl font-bold ${
                    validationResult.errors.length > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {validationResult.errors.length > 0 ? validationResult.errors.length : '✓'}
                  </div>
                  <div className={`text-sm font-medium ${
                    validationResult.errors.length > 0 ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {validationResult.errors.length > 0 ? 'Error Validasi' : 'Semua Valid'}
                  </div>
                  <div className={`text-xs mt-1 ${
                    validationResult.errors.length > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {validationResult.errors.length > 0 ? 'Perlu perhatian' : 'Siap dilanjutkan'}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Import Options */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apa yang harus dilakukan dengan duplikat?</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  importConfig.skipDuplicates ? 'border-primary bg-primary/5' : 'border-gray-300'
                }`}>
                  <input
                    type="radio"
                    checked={importConfig.skipDuplicates}
                    onChange={() => setImportConfig(prev => ({
                      ...prev,
                      skipDuplicates: true,
                      updateExisting: false
                    }))}
                    className="sr-only"
                  />
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        importConfig.skipDuplicates ? 'border-primary bg-primary' : 'border-gray-300'
                      }`}>
                        {importConfig.skipDuplicates && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Lewati Duplikat</div>
                      <div className="text-sm text-gray-500">
                        Jangan impor produk yang sudah ada. Pilihan aman.
                      </div>
                    </div>
                  </div>
                </label>

                <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  importConfig.updateExisting ? 'border-primary bg-primary/5' : 'border-gray-300'
                }`}>
                  <input
                    type="radio"
                    checked={importConfig.updateExisting}
                    onChange={() => setImportConfig(prev => ({
                      ...prev,
                      updateExisting: true,
                      skipDuplicates: false
                    }))}
                    className="sr-only"
                  />
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        importConfig.updateExisting ? 'border-primary bg-primary' : 'border-gray-300'
                      }`}>
                        {importConfig.updateExisting && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">Perbarui yang Ada</div>
                      <div className="text-sm text-gray-500">
                        Timpa produk yang ada dengan data baru. Gunakan dengan hati-hati.
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Issues Summary */}
            {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
              <div className="space-y-4">
                {/* Critical Errors */}
                {validationResult.errors.length > 0 && (
                  <details className="rounded-lg border border-red-200 bg-red-50">
                    <summary className="cursor-pointer p-4 font-medium text-red-900 hover:bg-red-100">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>{validationResult.errors.length} Error Kritis{validationResult.errors.length !== 1 ? '' : ''} (Harus Diperbaiki)</span>
                      </div>
                    </summary>
                    <div className="border-t border-red-200 p-4">
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {validationResult.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="rounded border border-red-300 bg-white p-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium text-red-900">
                                  Produk #{error.row - 1}
                                </div>
                                <div className="text-sm text-red-700">
                                  {getFieldDisplayName(error.field)}: {error.message}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {validationResult.errors.length > 10 && (
                          <div className="text-center text-sm text-red-600">
                            ... dan {validationResult.errors.length - 10} error lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <details className="rounded-lg border border-amber-200 bg-amber-50">
                    <summary className="cursor-pointer p-4 font-medium text-amber-900 hover:bg-amber-100">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>{validationResult.warnings.length} Peringatan{validationResult.warnings.length !== 1 ? '' : ''} (Opsional)</span>
                      </div>
                    </summary>
                    <div className="border-t border-amber-200 p-4">
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {validationResult.warnings.slice(0, 5).map((warning, index) => (
                          <div key={index} className="rounded border border-amber-300 bg-white p-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium text-amber-900">
                                  Produk #{warning.row - 1}
                                </div>
                                <div className="text-sm text-amber-700">
                                  {warning.field}: {warning.message}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Success Message */}
            {validationResult.errors.length === 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Semua data terlihat bagus!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      {parsedData?.rows.length || 0} produk Anda siap diimpor. Tidak ada masalah kritis ditemukan.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={() => setCurrentStep('mapping')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Pemetaan
              </button>
              <button
                onClick={handleImport}
                disabled={isProcessing || (validationResult.errors.length > 0 && !importConfig.skipDuplicates && !importConfig.updateExisting)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Mulai Impor ({parsedData?.rows.length || 0} produk)
                  </>
                )}
              </button>
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
            <div className="mt-8 rounded-lg bg-blue-50 p-4 max-w-md">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Tips:</strong> Jangan tutup halaman ini saat kami mengimpor data Anda. 
                    Kami akan menunjukkan ringkasan detail setelah selesai!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Enhanced Completion */}
        {currentStep === 'complete' && importResult && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                {importResult.success > 0 ? 'Impor Selesai!' : 'Impor Selesai'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {importResult.success > 0 
                  ? `Berhasil mengimpor ${importResult.success} produk` 
                  : 'Proses impor selesai dengan masalah'
                }
              </p>
            </div>
            
            {/* Enhanced Results Dashboard */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-green-600">
                    {importResult.success}
                  </div>
                  <div className="text-sm font-medium text-green-700">Berhasil Diimpor</div>
                  <div className="text-xs text-green-600 mt-1">Siap digunakan</div>
                </div>
              </div>
              
              {importResult.skipped > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-amber-600">
                      {importResult.skipped}
                    </div>
                    <div className="text-sm font-medium text-amber-700">Dilewati</div>
                    <div className="text-xs text-amber-600 mt-1">Duplikat dihindari</div>
                  </div>
                </div>
              )}
              
              {importResult.failed > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-red-600">
                      {importResult.failed}
                    </div>
                    <div className="text-sm font-medium text-red-700">Gagal</div>
                    <div className="text-xs text-red-600 mt-1">Ada error</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Detailed Summary */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Impor</h3>
              <div className="prose prose-sm text-gray-600">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generateImportSummary(importResult)}
                </pre>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              {/* Error Report Download */}
              {importResult.errors.length > 0 && (
                <button
                  onClick={handleDownloadErrors}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Unduh Laporan Error
                </button>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setCurrentStep('upload');
                    setFile(null);
                    setParsedData(null);
                    setImportResult(null);
                    setColumnMapping({});
                    setValidationResult(null);
                    setDuplicateCheck(null);
                    setError(null);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Impor Produk Lainnya
                </button>
                <Link
                  href="/admin/products"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Lihat Semua Produk
                </Link>
              </div>
            </div>

            {/* Next Steps Suggestion */}
            {importResult.success > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Apa Selanjutnya?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Lihat produk yang telah diimpor di daftar produk</li>
                        <li>Buat kode QR untuk produk baru Anda</li>
                        <li>Atur jadwal perawatan jika diperlukan</li>
                        <li>Tinjau dan edit detail produk seperlunya</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}