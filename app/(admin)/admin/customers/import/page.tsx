"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc, serverTimestamp, doc, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useAdmin } from "@/app/context/AdminContext";
import { 
  parseCSVToCustomers, 
  downloadCustomerCSVTemplate,
  ImportValidationError,
  ImportResult,
  validateCustomerData,
  CustomerValidationResult
} from "@/utils/customerImportExport";
import { ValidationLabels, ValidationMessages, getFieldDisplayName } from "@/utils/validationMessages";

type ImportStep = 'upload' | 'mapping' | 'validation' | 'importing' | 'complete';

interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
}

interface ImportConfig {
  mapping: Record<string, string>;
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateBeforeImport: boolean;
}

interface EnhancedImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: ImportValidationError[];
  summary: string;
}

/**
 * Customer Import Wizard Page
 * Provides step-by-step interface for importing customers from CSV files
 */
export default function CustomerImportPage() {
  const router = useRouter();
  const { user } = useAdmin();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [originalAutoMapping, setOriginalAutoMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [enhancedImportResult, setEnhancedImportResult] = useState<EnhancedImportResult | null>(null);
  const [validationResult, setValidationResult] = useState<CustomerValidationResult | null>(null);
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    mapping: {},
    skipDuplicates: true,
    updateExisting: false,
    validateBeforeImport: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check for duplicates in database
  const [duplicateCheck, setDuplicateCheck] = useState<Set<string> | null>(null);
  
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
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Ukuran file harus kurang dari 10MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);
    
    try {
      // Parse CSV file
      const text = await selectedFile.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('File CSV harus memiliki header dan minimal 1 baris data');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, any> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });
      
      setParsedData({ headers, rows });
      
      // Auto-map columns
      const mapping = autoMapCustomerColumns(headers);
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
   * Auto-map customer columns based on header names including Indonesian spaced headers
   */
  const autoMapCustomerColumns = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    
    // Define field mappings with Indonesian spaced header support - aligned with dropdown options and enhanced variations
    const fieldMappings: Record<string, string[]> = {
      'name': ['name', 'nama', 'Nama Pelanggan', 'nama pelanggan', 'nama_pelanggan', 'customer_name', 'pelanggan'],
      'customerType': ['customerType', 'customer_type', 'type', 'tipe', 'jenis', 'Tipe Pelanggan', 'tipe pelanggan', 'tipe_pelanggan'],
      'businessField': ['businessField', 'business_field', 'business', 'bisnis', 'usaha', 'Bidang Usaha', 'bidang usaha', 'bidang_usaha'],
      'street': ['street', 'alamat', 'address', 'jalan', 'Alamat Jalan', 'alamat jalan', 'alamat_jalan'],
      'village': ['village', 'desa', 'kelurahan', 'Desa Kelurahan', 'desa kelurahan', 'desa_kelurahan'],
      'district': ['district', 'kecamatan', 'Kecamatan'],
      'city': ['city', 'kota', 'kabupaten', 'Kota Kabupaten', 'kota kabupaten', 'kota_kabupaten'],
      'province': ['province', 'provinsi', 'Provinsi'],
      'postalCode': ['postalCode', 'postal_code', 'postal', 'kodepos', 'kode_pos', 'Kode Pos', 'kode pos', 'kode_pos'],
      'primaryContactName': ['primaryContactName', 'primary_contact_name', 'contactName', 'contact_name', 'nama_kontak', 'Nama Kontak Utama', 'nama kontak utama', 'nama_kontak_utama'],
      'primaryContactEmail': ['primaryContactEmail', 'primary_contact_email', 'contactEmail', 'contact_email', 'email_kontak', 'Email Kontak Utama', 'email kontak utama', 'email_kontak_utama', 'email'],
      'primaryContactPhone': ['primaryContactPhone', 'primary_contact_phone', 'contactPhone', 'contact_phone', 'phone', 'telp', 'telepon', 'hp', 'Telepon Kontak Utama', 'telepon kontak utama', 'telepon_kontak_utama'],
      'primaryContactPosition': ['primaryContactPosition', 'primary_contact_position', 'contactPosition', 'contact_position', 'position', 'jabatan', 'Posisi Kontak Utama', 'posisi kontak utama', 'posisi_kontak_utama']
      // Removed 'primaryContactDepartment' as no equivalent exists in dropdown
    };
    
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Find matching field using robust normalization (same as products system)
      for (const [field, variations] of Object.entries(fieldMappings)) {
        if (variations.some(v => {
          const normalizedVariation = v.toLowerCase().trim();
          // Direct match
          if (normalizedVariation === normalizedHeader) return true;
          // Space-underscore equivalence for flexible matching
          if (normalizedVariation.replace(/\s+/g, '_') === normalizedHeader.replace(/\s+/g, '_')) return true;
          return false;
        })) {
          mapping[header] = field;
          break;
        }
      }
    });
    
    return mapping;
  };

  /**
   * Updates column mapping when user changes selection
   */
  const handleMappingChange = (csvColumn: string, customerField: string) => {
    const newMapping = { ...columnMapping };
    
    if (customerField === '') {
      delete newMapping[csvColumn];
    } else {
      // Remove any existing mapping to this field
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === customerField && key !== csvColumn) {
          delete newMapping[key];
        }
      });
      newMapping[csvColumn] = customerField;
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
      const transformedRows = parsedData.rows.map(row => {
        const customerData: any = {};
        Object.keys(columnMapping).forEach(csvColumn => {
          const customerField = columnMapping[csvColumn];
          if (customerField && row[csvColumn]) {
            customerData[customerField] = row[csvColumn];
          }
        });
        return customerData;
      });
      
      // Use new validation logic that matches product import structure
      const validation = validateCustomerData(transformedRows);
      setValidationResult(validation);
      
      // Also keep legacy result for backward compatibility
      const fileContent = transformedRows.map(row => 
        Object.values(row).join(',')
      ).join('\n');
      const result = parseCSVToCustomers(
        [Object.keys(transformedRows[0] || {}).join(','), fileContent].join('\n')
      );
      setImportResult(result);
      
      // Check for existing customers in database
      const customerNames = transformedRows
        .map(r => r.name)
        .filter(Boolean);
      const existing = await checkExistingCustomers(customerNames);
      setDuplicateCheck(existing);
      
      setCurrentStep('validation');
    } catch (err: any) {
      setError(err.message || 'Validasi gagal');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Check for existing customers in database
   */
  const checkExistingCustomers = async (names: string[]): Promise<Set<string>> => {
    if (names.length === 0) return new Set();
    
    try {
      const existing = new Set<string>();
      
      // Query in batches of 10 (Firestore limit for 'in' queries)
      for (let i = 0; i < names.length; i += 10) {
        const batch = names.slice(i, i + 10);
        const q = query(
          collection(firestore, "customers"),
          where("name", "in", batch)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.name) existing.add(data.name);
        });
      }
      
      return existing;
    } catch (error) {
      console.error('Error checking existing customers:', error);
      return new Set();
    }
  };

  /**
   * Performs the actual import
   */
  const handleImport = async () => {
    if (!importResult?.customers.length) return;
    
    setCurrentStep('importing');
    setIsProcessing(true);
    setError(null);
    
    try {
      const customersCollection = collection(firestore, "customers");
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      const errors: ImportValidationError[] = [];
      
      for (let index = 0; index < importResult.customers.length; index++) {
        const customerData = importResult.customers[index];
        try {
          // Check for duplicates if skipDuplicates is enabled
          if (importConfig.skipDuplicates && duplicateCheck?.has(customerData.name)) {
            skippedCount++;
            continue;
          }
          
          await addDoc(customersCollection, {
            ...customerData,
            createdAt: serverTimestamp(),
            createdBy: user?.uid ? doc(firestore, "users", user.uid) : null,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
          });
          successCount++;
        } catch (error: any) {
          console.error("Failed to import customer:", customerData.name, error);
          failedCount++;
          errors.push({
            row: index + 2,
            field: 'general',
            error: error.message || 'Import failed',
            value: customerData.name
          });
        }
      }
      
      const summary = generateImportSummary({ success: successCount, failed: failedCount, skipped: skippedCount });
      
      setEnhancedImportResult({
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        errors,
        summary
      });
      
      setCurrentStep('complete');
    } catch (err: any) {
      setError(err.message || 'Impor gagal');
      setCurrentStep('validation');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generate import summary
   */
  const generateImportSummary = (result: { success: number; failed: number; skipped: number }): string => {
    const total = result.success + result.failed + result.skipped;
    const customerType = 'pelanggan';
    
    return `${ValidationMessages.IMPORT_SUMMARY_HEADER}
    
${ValidationMessages.TOTAL_PROCESSED(total, customerType)}
${ValidationMessages.SUCCESSFULLY_IMPORTED(result.success, customerType)}
${ValidationMessages.SKIPPED_DUPLICATES(result.skipped, customerType)}  
${ValidationMessages.FAILED_IMPORT(result.failed, customerType)}

${result.success > 0 ? ValidationMessages.IMPORT_SUCCESS_MESSAGE(result.success, customerType) : ''}
${result.failed > 0 ? ValidationMessages.IMPORT_FAILURE_MESSAGE(result.failed, customerType) : ''}
${result.skipped > 0 ? ValidationMessages.IMPORT_SKIPPED_MESSAGE(result.skipped, customerType) : ''}`;
  };

  /**
   * Download CSV template
   */
  const handleDownloadTemplate = () => {
    downloadCustomerCSVTemplate();
  };

  /**
   * Download error report as CSV
   */
  const handleDownloadErrors = () => {
    if (!enhancedImportResult || enhancedImportResult.errors.length === 0) return;
    
    const errorData = enhancedImportResult.errors.map(error => ({
      'Row': error.row,
      'Field': error.field,
      'Error': error.error,
      'Value': error.value || ''
    }));
    
    const csvContent = [
      Object.keys(errorData[0]).join(','),
      ...errorData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_errors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /**
   * Handles clicking the "Lihat Persyaratan" button
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
   */
  const handleToggleHelp = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsHelpSectionOpen(!isHelpSectionOpen);
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
    setImportResult(null);
    setEnhancedImportResult(null);
    setImportConfig({
      mapping: {},
      skipDuplicates: true,
      updateExisting: false,
      validateBeforeImport: true
    });
    setDuplicateCheck(null);
    setError(null);
    // Don't reset isProcessing or isHelpSectionOpen as they're UI state
  };

  // Customer field options for mapping
  const customerFields = [
    { value: 'name', label: 'Nama Pelanggan' },
    { value: 'customerType', label: 'Tipe Pelanggan' },
    { value: 'businessField', label: 'Bidang Usaha' },
    { value: 'primaryContactEmail', label: 'Email Kontak Utama' },
    { value: 'primaryContactPhone', label: 'Telepon Kontak Utama' },
    { value: 'primaryContactName', label: 'Nama Kontak Utama' },
    { value: 'primaryContactPosition', label: 'Posisi Kontak Utama' },
    { value: 'address', label: 'Alamat Lengkap' },
    { value: 'street', label: 'Jalan' },
    { value: 'village', label: 'Desa/Kelurahan' },
    { value: 'district', label: 'Kecamatan' },
    { value: 'city', label: 'Kota/Kabupaten' },
    { value: 'province', label: 'Provinsi' },
    { value: 'postalCode', label: 'Kode Pos' },
    { value: 'notes', label: 'Catatan' }
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Enhanced Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center text-sm text-gray-500">
          <Link href="/admin/customers" className="hover:text-gray-700">
            Pelanggan
          </Link>
          <svg className="mx-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900">Impor</span>
        </nav>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Impor Pelanggan</h1>
            <p className="mt-1 text-sm text-gray-600">Impor pelanggan dari file CSV dengan panduan langkah demi langkah</p>
          </div>
          <Link
            href="/admin/customers"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Pelanggan
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

      <div className="rounded-lg border border-stroke bg-white p-6">
        {/* Step 1: Enhanced Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Unggah File CSV Anda</h2>
              <p className="mt-2 text-sm text-gray-600">
                Mulai dengan mengunggah file data pelanggan Anda. Kami akan memandu Anda melalui sisanya!
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
                <button
                  onClick={handleDownloadTemplate}
                  className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Unduh Template CSV →
                </button>
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
                      <li>• Nama Pelanggan (harus unik)</li>
                      <li>• Tipe Pelanggan</li>
                      <li>• Email atau Telepon</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tipe Pelanggan Valid</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• individual (Perorangan)</li>
                      <li>• corporate (Perusahaan)</li>
                      <li>• government (Pemerintah)</li>
                      <li>• nonprofit (Non-profit)</li>
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
                const fieldInfo = customerFields.find(f => f.value === mappedField);
                
                // Group customer fields by category for better UX
                const fieldGroups = [
                  {
                    name: "Info Dasar",
                    fields: customerFields.filter(f => 
                      ['name', 'customerType', 'businessField'].includes(f.value)
                    )
                  },
                  {
                    name: "Kontak",
                    fields: customerFields.filter(f => 
                      ['primaryContactEmail', 'primaryContactPhone', 'primaryContactName', 'primaryContactPosition'].includes(f.value)
                    )
                  },
                  {
                    name: "Alamat",
                    fields: customerFields.filter(f => 
                      ['address', 'street', 'village', 'district', 'city', 'province', 'postalCode'].includes(f.value)
                    )
                  },
                  {
                    name: "Lainnya",
                    fields: customerFields.filter(f => 
                      ['notes'].includes(f.value)
                    )
                  }
                ];

                const mappingStatus = mappedField ? (isAutoMapped ? 'auto-mapped' : 'manual-mapped') : 'unmapped';
                const requiredFields = ['name', 'customerType'];
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
              const requiredFields = ['name', 'customerType'];
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
                              <li key={field}>{customerFields.find(f => f.value === field)?.label}</li>
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
              <h2 className="text-2xl font-semibold text-gray-900">{ValidationLabels.DATA_QUALITY_CHECK}</h2>
              <p className="mt-2 text-sm text-gray-600">
                Kami telah memeriksa data Anda. Tinjau hasilnya sebelum menyimpan ke sistem.
              </p>
            </div>

            {/* Enhanced Status Dashboard */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-green-600">
                    {validationResult.customers.length}
                  </div>
                  <div className="text-sm font-medium text-green-700">Pelanggan Siap Diimpor</div>
                  <div className="text-xs text-green-600 mt-1">Data sudah benar</div>
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
                  <div className="text-sm font-medium text-amber-700">Pelanggan Sudah Ada</div>
                  <div className="text-xs text-amber-600 mt-1">Terdaftar di database</div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
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
                    {validationResult.errors.length > 0 ? ValidationLabels.VALIDATION_ERRORS : ValidationLabels.ALL_VALID}
                  </div>
                  <div className={`text-xs mt-1 ${
                    validationResult.errors.length > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {validationResult.errors.length > 0 ? ValidationLabels.NEEDS_ATTENTION : ValidationLabels.READY_TO_PROCEED}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Import Options */}
            {duplicateCheck && duplicateCheck.size > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Apa yang harus dilakukan dengan pelanggan yang sudah ada?</h3>
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
                        <div className="text-sm font-medium text-gray-900">Abaikan yang Sudah Ada</div>
                        <div className="text-sm text-gray-500">
                          Jangan tambahkan pelanggan yang sudah terdaftar. Pilihan paling aman.
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
                        <div className="text-sm font-medium text-gray-900">Timpa Data Lama</div>
                        <div className="text-sm text-gray-500">
                          Ganti informasi pelanggan lama dengan data baru. Hati-hati - data lama akan hilang.
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

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
                        <span>{ValidationLabels.ERRORS_COUNT(validationResult.errors.length)} ({ValidationLabels.MUST_BE_FIXED})</span>
                    <div className="ml-auto text-xs bg-red-200 px-2 py-1 rounded-full text-red-800">
                      Klik untuk melihat detail
                    </div>
                  </div>
                </summary>
                <div className="border-t border-red-200 bg-red-50/50 p-4">
                  <div className="mb-3 rounded-lg bg-red-100 p-3 text-sm text-red-800">
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium">Apa yang harus dilakukan?</div>
                        <div className="mt-1">Perbaiki data di file CSV Anda, lalu unggah ulang. Atau hapus baris yang bermasalah dari file.</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {validationResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="rounded-lg bg-white border border-red-200 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                              {error.row}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-red-900">
                              {ValidationLabels.ROW} {error.row}: {getFieldDisplayName(error.field)}
                            </div>
                            <div className="mt-1 text-sm text-red-700">
                              {error.message}
                            </div>
                            {error.value && (
                              <div className="mt-1 text-xs text-red-600 font-mono bg-red-100 px-2 py-1 rounded">
                                {ValidationLabels.VALUE}: "{error.value}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {validationResult.errors.length > 10 && (
                      <div className="text-center text-sm text-red-600">
                        {ValidationLabels.MORE_ERRORS(validationResult.errors.length - 10)}
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

            {/* Warnings Section */}
            {validationResult.warnings.length > 0 && (
              <details className="rounded-lg border border-amber-200 bg-amber-50">
                <summary className="cursor-pointer p-4 font-medium text-amber-900 hover:bg-amber-100">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>{ValidationLabels.WARNINGS_COUNT(validationResult.warnings.length)} {ValidationLabels.OPTIONAL}</span>
                  </div>
                </summary>
                <div className="border-t border-amber-200 p-4">
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {validationResult.warnings.slice(0, 5).map((warning, index) => (
                      <div key={index} className="rounded border border-amber-300 bg-white p-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                              {warning.row}
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-amber-900">
                              {ValidationLabels.ROW} {warning.row}: {getFieldDisplayName(warning.field)}
                            </div>
                            <div className="text-sm text-amber-700">
                              {warning.message}
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
                    <h3 className="text-sm font-medium text-green-800">Semua Data Sudah Benar!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      Data pelanggan Anda telah lolos pemeriksaan dan siap diimpor ke sistem. 
                      {duplicateCheck && duplicateCheck.size > 0 && (
                        <span> Pastikan Anda telah memilih tindakan yang tepat untuk pelanggan yang sudah ada.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Valid Data Preview */}
            {validationResult.customers.length > 0 && (
              <details className="rounded-lg border border-green-200 bg-green-50">
                <summary className="cursor-pointer p-4 font-medium text-green-900 hover:bg-green-100">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Pratinjau Data yang Akan Diimpor ({validationResult.customers.length} pelanggan)</span>
                    <div className="ml-auto text-xs bg-green-200 px-2 py-1 rounded-full text-green-800">
                      Klik untuk melihat contoh
                    </div>
                  </div>
                </summary>
                <div className="border-t border-green-200 bg-green-50/50 p-4">
                  <div className="mb-3 rounded-lg bg-green-100 p-3 text-sm text-green-800">
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium">Berikut adalah contoh data yang akan tersimpan:</div>
                        <div className="mt-1">Data ini sudah melalui pemeriksaan dan siap untuk ditambahkan ke database pelanggan Anda.</div>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-auto rounded-lg border border-green-200 bg-white">
                    <table className="w-full table-auto text-sm">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-green-900">
                            Nama Pelanggan
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-green-900">
                            Jenis
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-green-900">
                            Lokasi
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-green-900">
                            Kontak
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-200">
                        {validationResult.customers.slice(0, 10).map((customer, index) => (
                          <tr key={index} className="hover:bg-green-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {customer.name}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                {customer.customerType === 'individual' ? 'Perorangan' : 
                                 customer.customerType === 'corporate' ? 'Perusahaan' :
                                 customer.customerType === 'government' ? 'Pemerintah' : 
                                 customer.customerType === 'nonprofit' ? 'Non-profit' : customer.customerType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {typeof customer.address === 'object' && customer.address 
                                ? `${customer.address.city || ''}, ${customer.address.province || ''}`
                                : customer.address || '-'
                              }
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {customer.contacts && customer.contacts.length > 0 
                                ? `${customer.contacts.length} kontak` 
                                : customer.contact ? '1 kontak (legacy)' : 'Tidak ada'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validationResult.customers.length > 10 && (
                      <div className="bg-green-50 px-4 py-3 text-center text-sm text-green-700 border-t border-green-200">
                        ... dan {validationResult.customers.length - 10} pelanggan lainnya akan diimpor
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('upload')}
                className="inline-flex items-center rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Pemetaan
              </button>
              
              <button
                onClick={handleImport}
                disabled={isProcessing || (validationResult.errors.length > 0)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
              >
                  {isProcessing ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Simpan {validationResult.customers.length} Pelanggan
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
            </div>
          </div>
        )}

        {/* Step 4: Import Processing */}
        {currentStep === 'importing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Menyimpan Pelanggan</h2>
              <p className="mt-2 text-sm text-gray-600">
                Sedang menyimpan data pelanggan ke dalam sistem. Harap tunggu sebentar...
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Proses ini biasanya memakan waktu beberapa detik
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Enhanced Import Results */}
        {currentStep === 'complete' && enhancedImportResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                enhancedImportResult.success > 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {enhancedImportResult.success > 0 ? (
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-gray-900">
                {enhancedImportResult.success > 0 ? 'Impor Selesai!' : 'Impor Bermasalah'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {enhancedImportResult.success > 0 
                  ? 'Data pelanggan telah berhasil disimpan ke sistem Anda.'
                  : 'Terjadi masalah saat menyimpan data pelanggan.'
                }
              </p>
            </div>

            {/* Detailed Results Dashboard */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-green-600">
                    {enhancedImportResult.success}
                  </div>
                  <div className="text-sm font-medium text-green-700">Berhasil Disimpan</div>
                  <div className="text-xs text-green-600 mt-1">Pelanggan baru</div>
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
                    {enhancedImportResult.skipped}
                  </div>
                  <div className="text-sm font-medium text-amber-700">Dilewati</div>
                  <div className="text-xs text-amber-600 mt-1">Sudah ada</div>
                </div>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-red-600">
                    {enhancedImportResult.failed}
                  </div>
                  <div className="text-sm font-medium text-red-700">Gagal</div>
                  <div className="text-xs text-red-600 mt-1">Ada masalah</div>
                </div>
              </div>
            </div>

            {/* Import Summary */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Hasil Impor</h3>
              <div className="whitespace-pre-line text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg">
                {enhancedImportResult.summary}
              </div>
            </div>

            {/* Error Report Download */}
            {enhancedImportResult.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-amber-800">
                      Ada {enhancedImportResult.failed} data yang gagal diimpor
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Unduh laporan kesalahan untuk melihat detail masalah dan cara memperbaikinya.</p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={handleDownloadErrors}
                        className="text-sm font-medium text-amber-600 hover:text-amber-500"
                      >
                        Unduh Laporan Kesalahan →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next Section */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Langkah Selanjutnya</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Lihat dan kelola data pelanggan baru di halaman Manajemen Pelanggan</li>
                      <li>Periksa informasi kontak dan alamat untuk memastikan kelengkapan</li>
                      {enhancedImportResult.failed > 0 && (
                        <li>Perbaiki data yang gagal diimpor dan coba unggah ulang</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={resetWizard}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Impor Lagi
              </button>
              <Link
                href="/admin/customers"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Kelola Pelanggan
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}