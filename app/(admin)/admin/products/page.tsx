"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  DocumentReference,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import Image from "next/image";
import type { Product, ProductType } from "@/types/product";
import { Contract } from "@/types/contracts";
import { 
  generateProductQRData, 
  downloadQRCode, 
  generateQRCodeDataURL,
  getQRCodeSize 
} from "@/utils/qrCodeGenerator";
import { findProductLocation } from "@/utils/findProductLocation";
import BulkOperationsToolbar from "@/components/Admin/Products/BulkOperationsToolbar";
import BulkEditDialog from "@/components/Admin/Products/BulkEditDialog";
import { exportProducts } from "@/utils/exportGenerator";
import { generateBulkQRCodes, downloadBulkQRZip, BulkQRProgressCallback } from "@/utils/bulkQRGenerator";

export default function ProductsPage() {
  const [products, setProducts] = useState<
    (Product & { contractData?: any })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  
  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkQRProgress, setBulkQRProgress] = useState<{
    isGenerating: boolean;
    current: number;
    total: number;
    currentProduct: string;
  } | null>(null);
  
  // Dropdown state for row actions
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(firestore, "products"));
      const data: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ ...docSnap.data(), id: docSnap.id } as Product);
      });
      // fetch contract details for each product
      const productsWithContracts = await Promise.all(
        data.map(async (product) => {
          const contractRef = product.contract as DocumentReference;
          if (contractRef) {
            const contractSnap = await getDoc(contractRef);
            if (contractSnap.exists()) {
              const contractData: any = {
                ...contractSnap.data(),
                id: contractSnap.id,
              };
              // Fetch customer inside contract
              let customerData: any = null;
              if (contractData.customer && contractData.customer.id) {
                try {
                  const customerSnap = await getDoc(contractData.customer);
                  if (customerSnap.exists()) {
                    customerData = {
                      ...(customerSnap.data() || {}),
                      id: customerSnap.id,
                    };
                  }
                } catch {}
              }
              return {
                ...product,
                contractData: {
                  ...contractData,
                  customerData: customerData,
                },
              };
            }
          }
          return product;
        }),
      );
      setProducts(productsWithContracts);
    } catch (err) {
      setError("Gagal memuat produk");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, brandFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  // Unique product types and brands for filter options
  const productTypes = Array.from(
    new Set(products.map((p) => p.productType).filter(Boolean)),
  );
  const brands = Array.from(
    new Set(products.map((p) => p.specs.brand).filter(Boolean)),
  );

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = (
      p.name +
      p.productNumber +
      p.specs.brand +
      p.specs.brandType +
      p.productType
    )
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || p.productType === typeFilter;
    const matchesBrand = !brandFilter || p.specs.brand === brandFilter;
    return matchesSearch && matchesType && matchesBrand;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Delete product
  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus produk ini?")) {
      try {
        await deleteDoc(doc(firestore, "products", id));
        setProducts(products.filter((p) => p.id !== id));
      } catch {
        setError("Gagal menghapus produk");
      }
    }
  };

  /**
   * Handles QR code generation and download for a product
   * Creates QR code containing all product information for mobile scanning
   * 
   * @param product - The product to generate QR code for
   */
  const handleGenerateQR = async (product: Product & { contractData?: any }) => {
    if (!product.id) return;

    setGeneratingQR(product.id);
    setError(null);

    try {
      // Get location from contract if available
      let location: string | undefined;
      if (product.contractData?.productDetails) {
        location = findProductLocation(
          doc(firestore, "products", product.id),
          product.contractData.productDetails
        );
        if (location === "N/A") location = undefined;
      }

      // Generate QR data
      const qrData = generateProductQRData(
        product,
        product.id,
        product.contractData?.id,
        location
      );

      // Download QR code with high quality for printing
      await downloadQRCode(qrData, {
        size: getQRCodeSize("print"),
        errorCorrectionLevel: "H", // High error correction for better scanning
      });

    } catch (err: any) {
      console.error("Error generating QR code:", err);
      setError(err.message || "Gagal membuat QR code");
    } finally {
      setGeneratingQR(null);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setTypeFilter(null);
    setBrandFilter(null);
    setSearchTerm("");
  };

  // Bulk selection handlers
  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === currentProducts.length) {
      // Deselect all
      setSelectedProducts(new Set());
    } else {
      // Select all current page products
      const allIds = new Set(currentProducts.map(p => p.id).filter(Boolean) as string[]);
      setSelectedProducts(allIds);
    }
  };

  const isAllSelected = currentProducts.length > 0 && 
    currentProducts.every(p => p.id && selectedProducts.has(p.id));

  /**
   * Handles successful bulk operations by refreshing data and clearing selection
   */
  const handleBulkOperationSuccess = () => {
    fetchProducts(); // Refresh the products list
    setSelectedProducts(new Set()); // Clear selection
  };

  /**
   * Handles bulk QR code generation for selected products
   */
  const handleBulkQRGeneration = async () => {
    const selectedProductList = products.filter(p => p.id && selectedProducts.has(p.id));
    
    if (selectedProductList.length === 0) {
      setError("No products selected for QR generation");
      return;
    }

    try {
      setError(null);
      setBulkQRProgress({
        isGenerating: true,
        current: 0,
        total: selectedProductList.length,
        currentProduct: ''
      });

      const progressCallback: BulkQRProgressCallback = (progress) => {
        setBulkQRProgress({
          isGenerating: true,
          current: progress.current,
          total: progress.total,
          currentProduct: progress.productName
        });
      };

      const result = await generateBulkQRCodes(
        selectedProductList,
        {
          size: 'print',
          includeLabels: true,
          errorCorrectionLevel: 'H',
          format: 'png'
        },
        progressCallback
      );

      if (result.zipBlob) {
        downloadBulkQRZip(result.zipBlob);
        
        if (result.failed > 0) {
          setError(`QR generation completed with ${result.failed} failures. Check the downloaded ZIP for details.`);
        }
      } else {
        setError("Failed to generate QR codes");
      }

    } catch (err: any) {
      console.error('Bulk QR generation error:', err);
      setError(err.message || "Failed to generate QR codes");
    } finally {
      setBulkQRProgress(null);
    }
  };

  // Helper: Get all possible specs keys and labels
  const allSpecsColumns = [
    { key: "weight", label: "Berat (kg)" },
    { key: "height", label: "Tinggi (cm)" },
    { key: "width", label: "Lebar (cm)" },
    { key: "pressure", label: "Tekanan (bar)" },
    { key: "capacity", label: "Kapasitas (kg)" },
    { key: "agentType", label: "Jenis Media" },
    { key: "flowRate", label: "Debit Air (L/min)" },
    { key: "valveType", label: "Tipe Valve" },
    { key: "hoseLength", label: "Panjang Selang (m)" },
    { key: "material", label: "Material" },
    { key: "resolution", label: "Resolusi" },
    { key: "lens", label: "Lensa" },
    { key: "nightVision", label: "Night Vision" },
    { key: "power", label: "Daya" },
    { key: "connectivity", label: "Konektivitas" },
    { key: "pan", label: "Pan" },
    { key: "tilt", label: "Tilt" },
    { key: "storageCapacity", label: "Kapasitas Penyimpanan" },
    { key: "sensorType", label: "Tipe Sensor" },
    { key: "coverageArea", label: "Area Cakupan (m²)" },
    { key: "soundLevel", label: "Tingkat Suara (dB)" },
    { key: "batteryBackup", label: "Cadangan Baterai" },
    { key: "lockType", label: "Tipe Kunci" },
    { key: "openingSpeed", label: "Kecepatan Buka (cm/s)" },
    { key: "deviceType", label: "Tipe Perangkat" },
    { key: "batteryLife", label: "Baterai" },
    { key: "patrolInterval", label: "Interval Patroli (menit)" },
    { key: "firmwareVersion", label: "Versi Firmware" },
    // BaseSpecs
    { key: "serialNumber", label: "Serial Number" },
    { key: "manufactureDate", label: "Tanggal Produksi" },
    { key: "installationDate", label: "Tanggal Instalasi" },
    { key: "expirationDate", label: "Tanggal Kadaluarsa" },
  ];

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Manajemen Produk</h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">Kelola data produk</p>
        </div>
        <Link
          href="/admin/products/create"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:w-auto"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Produk
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Enhanced Bulk Operations Toolbar */}
      <BulkOperationsToolbar
        selectedCount={selectedProducts.size}
        bulkMode={bulkMode}
        onToggleBulkMode={() => {
          setBulkMode(!bulkMode);
          if (bulkMode) {
            // Clear selection when turning off bulk mode
            setSelectedProducts(new Set());
          }
        }}
        onExport={async () => {
          try {
            // Export selected products or all if none selected
            const productsToExport = selectedProducts.size > 0
              ? products.filter(p => p.id && selectedProducts.has(p.id))
              : filteredProducts;
            
            await exportProducts(productsToExport, {
              includeSpecs: true,
              includeContract: true
            });
          } catch (error) {
            setError("Gagal mengekspor produk");
          }
        }}
        onBulkEdit={() => {
          setShowBulkEditDialog(true);
        }}
        onBulkQR={handleBulkQRGeneration}
        onClearSelection={() => {
          setSelectedProducts(new Set());
        }}
      />

      {/* Enhanced Filter Section */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Filter & Pencarian</h3>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
            disabled={!searchTerm && !typeFilter && !brandFilter}
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Field */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-xs font-medium text-gray-700">
              <svg className="mr-1 inline h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cari Produk
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama produk, nomor, merk, atau tipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-8 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Product Type Filter */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              <svg className="mr-1 inline h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Tipe Produk
            </label>
            <select
              value={typeFilter || ""}
              onChange={(e) => setTypeFilter(e.target.value || null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20"
            >
              <option value="">Semua Tipe ({productTypes.length})</option>
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Brand Filter */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              <svg className="mr-1 inline h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Merk/Brand
            </label>
            <select
              value={brandFilter || ""}
              onChange={(e) => setBrandFilter(e.target.value || null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20"
            >
              <option value="">Semua Merk ({brands.length})</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Active Filter Chips */}
        {(searchTerm || typeFilter || brandFilter) && (
          <div className="mt-4 border-t pt-4">
            <div className="mb-2 text-xs font-medium text-gray-600">Filter Aktif:</div>
            <div className="flex flex-wrap items-center gap-2">
              {searchTerm && (
                <div className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Pencarian: "{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:text-blue-600"
                    title="Hapus filter pencarian"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {typeFilter && (
                <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Tipe: {typeFilter}</span>
                  <button
                    onClick={() => setTypeFilter(null)}
                    className="ml-1 hover:text-green-600"
                    title="Hapus filter tipe"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {brandFilter && (
                <div className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Merk: {brandFilter}</span>
                  <button
                    onClick={() => setBrandFilter(null)}
                    className="ml-1 hover:text-purple-600"
                    title="Hapus filter merk"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                title="Hapus semua filter"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Semua
              </button>
            </div>
          </div>
        )}

        {/* Filter Summary */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>
              Menampilkan <span className="font-medium text-gray-700">{filteredProducts.length}</span> dari <span className="font-medium text-gray-700">{products.length}</span> produk
            </span>
            {(searchTerm || typeFilter || brandFilter) && (
              <span className="inline-flex items-center gap-1 text-blue-600">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter aktif
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Hasil per halaman:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-gray-300 px-2 py-0.5 text-xs outline-none focus:border-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4">
        {isLoading ? (
          <div className="py-8 text-center">Memuat produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-8 text-center">Tidak ada produk.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-3 py-4">
                      {bulkMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          />
                          <span className="text-xs font-normal text-gray-500">
                            ({currentProducts.length})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-gray-700">#</span>
                      )}
                    </th>
                    <th className="px-3 py-4">No</th>
                    <th className="px-3 py-4">Nama</th>
                    <th className="px-3 py-4">Tipe</th>
                    <th className="px-3 py-4">Merk</th>
                    <th className="px-3 py-4">Spesifikasi</th>
                    <th className="px-3 py-4">Kontrak</th>
                    <th className="px-3 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product, index) => {
                    const isSelected = product.id ? selectedProducts.has(product.id) : false;
                    return (
                      <tr 
                        key={product.id} 
                        className={`text-sm border-b border-gray-100 transition-colors ${
                          isSelected 
                            ? "bg-blue-50 hover:bg-blue-100" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-3 py-4">
                          {bulkMode ? (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => product.id && handleSelectProduct(product.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 font-medium">
                              {indexOfFirstItem + index + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <span className="font-mono text-xs font-semibold text-gray-600">
                            {product.productNumber}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </td>
                        <td className="px-3 py-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                            {product.productType}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{product.specs.brand}</div>
                            <div className="text-gray-500">{product.specs.brandType}</div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                        {product.specs &&
                        Object.keys(product.specs).length > 0 ? (
                          <ul className="list-disc pl-4">
                            {allSpecsColumns
                              .filter(
                                (col) =>
                                  product.specs[col.key] !== undefined &&
                                  product.specs[col.key] !== "" &&
                                  product.specs[col.key] !== null,
                              )
                              .map((col) => (
                                <li key={col.key}>
                                  <span className="font-medium">
                                    {col.label}:
                                  </span>{" "}
                                  {[
                                    "manufactureDate",
                                    "installationDate",
                                    "expirationDate",
                                  ].includes(col.key)
                                    ? product.specs[col.key]?.toDate
                                      ? product.specs[col.key]
                                          .toDate()
                                          .toLocaleDateString()
                                      : product.specs[col.key] || "-"
                                    : typeof product.specs[col.key] ===
                                      "boolean"
                                    ? product.specs[col.key]
                                      ? "Ya"
                                      : "Tidak"
                                    : product.specs[col.key]}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                        </td>
                        <td className="px-3 py-4">
                          {/* Tampilkan info contract */}
                          {product.contract ? (
                          <ul className="list-disc pl-4">
                            <li>
                              <span className="font-medium">Perusahaan:</span>{" "}
                              {product.contractData?.customerData?.name ?? "-"}
                            </li>
                            <li>
                              <span className="font-medium">Nama Kontrak:</span>{" "}
                              {product.contractData?.contractName ?? "-"}
                            </li>
                            <li>
                              <span className="font-medium">
                                Nomor Kontrak:
                              </span>{" "}
                              {product.contractData?.contractNumber ?? "-"}
                            </li>
                            <li>
                              <span className="font-medium">
                                Tanggal Mulai:
                              </span>{" "}
                              {product.contractData?.startDate
                                ? product.contractData.startDate
                                    .toDate()
                                    .toLocaleDateString()
                                : "-"}
                            </li>
                            <li>
                              <span className="font-medium">
                                Tanggal Selesai:
                              </span>{" "}
                              {product.contractData?.endDate
                                ? product.contractData.endDate
                                    .toDate()
                                    .toLocaleDateString()
                                : "Ongoing"}
                            </li>
                            <li>
                              <span className="font-medium">Status:</span>{" "}
                              {product.contractData?.status ?? "-"}
                            </li>
                          </ul>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                        <div className="flex items-center gap-1">
                          {/* Primary Actions - Always Visible */}
                          <Link
                            href={`/admin/products/edit/${product.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            title="Edit Produk"
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span className="hidden sm:inline">Edit</span>
                          </Link>

                          <button
                            onClick={() => handleGenerateQR(product)}
                            disabled={generatingQR === product.id}
                            className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                            title="Buat Kode QR"
                          >
                            {generatingQR === product.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border border-green-600 border-t-transparent"></div>
                            ) : (
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 16h4.01M12 20h4.01M12 8h4.01M12 4h4.01"
                                />
                              </svg>
                            )}
                            <span className="hidden sm:inline">
                              {generatingQR === product.id ? "..." : "QR"}
                            </span>
                          </button>

                          {/* Dropdown Aksi Lainnya */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === product.id ? null : product.id || null);
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                              title="Aksi Lainnya"
                            >
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>
                            {openDropdown === product.id && (
                              <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                  disabled={product.contract ? true : false}
                                  onClick={() => {
                                    setOpenDropdown(null);
                                    handleDelete(product?.id ?? "");
                                  }}
                                  className={`block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 ${
                                    product.contract
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }`}
                                  title={product.contract ? "Tidak dapat dihapus - produk memiliki kontrak aktif" : "Hapus produk"}
                                >
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="h-3 w-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    Hapus
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Streamlined Pagination Controls */}
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center text-xs text-gray-600 sm:text-left sm:text-sm">
                <span className="font-medium">
                  {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)}
                </span>{" "}
                dari <span className="font-medium">{filteredProducts.length}</span> produk
              </div>
              
              <div className="flex items-center justify-center gap-3 sm:justify-end">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                    currentPage === 1
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Halaman sebelumnya"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <span className="text-xs text-gray-600 sm:text-sm">
                  Halaman <span className="font-semibold">{currentPage}</span> dari{" "}
                  <span className="font-semibold">{totalPages}</span>
                </span>
                
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Halaman selanjutnya"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={showBulkEditDialog}
        onClose={() => setShowBulkEditDialog(false)}
        selectedProducts={products.filter(p => p.id && selectedProducts.has(p.id))}
        onSuccess={handleBulkOperationSuccess}
      />

      {/* Bulk QR Progress Modal */}
      {bulkQRProgress?.isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <h3 className="mt-4 text-lg font-semibold">Membuat Kode QR</h3>
              <p className="mt-2 text-sm text-gray-600">
                Memproses {bulkQRProgress.current} dari {bulkQRProgress.total} produk
              </p>
              {bulkQRProgress.currentProduct && (
                <p className="mt-1 text-xs text-gray-500 truncate">
                  {bulkQRProgress.currentProduct}
                </p>
              )}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(bulkQRProgress.current / bulkQRProgress.total) * 100}%`
                    }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {Math.round((bulkQRProgress.current / bulkQRProgress.total) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
