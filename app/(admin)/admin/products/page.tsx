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
  ProductQRData
} from "@/utils/qrCodeGenerator";
import { findProductLocation } from "@/utils/findProductLocation";
import BulkOperationsToolbar from "@/components/Admin/Products/BulkOperationsToolbar";
import BulkEditDialog from "@/components/Admin/Products/BulkEditDialog";
import ProductFiltersComponent, { ProductFilters } from "@/components/Admin/Products/ProductFilters";
import SortableHeader from "@/components/Admin/Products/SortableHeader";
import { exportProducts } from "@/utils/exportGenerator";
import { generateBulkQRCodes, downloadBulkQRZip, BulkQRProgressCallback } from "@/utils/bulkQRGenerator";
import QRCodePreviewModal from "@/components/Admin/QRCodePreviewModal";
import { buildProductQuery, getSortingStrategy } from "@/utils/productQuery";

export default function ProductsPage() {
  const [products, setProducts] = useState<
    (Product & { contractData?: any })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    productType: "",
    brand: "",
    source: "",
    contractStatus: "",
    sortBy: "productNumber",
    sortOrder: "asc"
  });
  
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
  
  // QR Preview Modal state
  const [showQRPreview, setShowQRPreview] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState<ProductQRData | null>(null);

  // Fetch products with smart querying
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const productsCollection = collection(firestore, "products");
      const { query: productQuery, useClientSort } = buildProductQuery(productsCollection, filters);
      
      let querySnapshot;
      if (productQuery) {
        // Use Firestore query with sorting
        querySnapshot = await getDocs(productQuery);
      } else {
        // Fallback to fetching all products for client-side processing
        querySnapshot = await getDocs(productsCollection);
      }
      
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
      console.error("Error fetching products:", err);
      setError("Gagal memuat produk");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  // Get unique options for filters
  const availableTypes = Array.from(
    new Set(products.map((p) => p.productType).filter(Boolean)),
  ) as string[];
  const availableBrands = Array.from(
    new Set(products.map((p) => p.specs.brand).filter(Boolean)),
  ) as string[];
  const availableSources = Array.from(
    new Set(products.map((p) => p.source).filter(Boolean)),
  ) as string[];

  // Advanced filtering and sorting
  const filteredAndSortedProducts = () => {
    let filtered = products.filter((product) => {
      // Search filter
      if (filters.search) {
        const searchableText = [
          product.name,
          product.productNumber,
          product.specs.brand || "",
          product.specs.brandType || "",
          product.productType,
          product.source || ""
        ].join(" ").toLowerCase();
        
        if (!searchableText.includes(filters.search.toLowerCase())) {
          return false;
        }
      }

      // Product type filter
      if (filters.productType && product.productType !== filters.productType) {
        return false;
      }

      // Brand filter
      if (filters.brand && product.specs.brand !== filters.brand) {
        return false;
      }

      // Source filter
      if (filters.source && product.source !== filters.source) {
        return false;
      }

      // Contract status filter
      if (filters.contractStatus) {
        const hasContract = Boolean(product.contractData);
        if (filters.contractStatus === "assigned" && !hasContract) return false;
        if (filters.contractStatus === "unassigned" && hasContract) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "productNumber":
          comparison = (a.productNumber || 0) - (b.productNumber || 0);
          break;
        case "createdAt":
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          comparison = aDate.getTime() - bDate.getTime();
          break;
        case "updatedAt":
          const aUpdated = a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const bUpdated = b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          comparison = aUpdated.getTime() - bUpdated.getTime();
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredProducts = filteredAndSortedProducts();

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
   * Handles QR code preview for a product
   * Shows QR code preview modal with print and download options
   * 
   * @param product - The product to generate QR code for
   */
  const handleGenerateQR = async (product: Product & { contractData?: any }) => {
    if (!product.id) return;

    setGeneratingQR(product.id);
    setError(null);

    try {
      // Get location and customer name from contract if available
      let location: string | undefined;
      let customerName: string | undefined;
      if (product.contractData?.productDetails) {
        location = findProductLocation(
          doc(firestore, "products", product.id),
          product.contractData.productDetails
        );
        if (location === "N/A") location = undefined;
      }
      if (product.contractData?.customerData?.name) {
        customerName = product.contractData.customerData.name;
      }

      // Generate QR data with customer information
      const qrData = generateProductQRData(
        product,
        product.id,
        product.contractData?.id,
        location,
        customerName
      );

      // Show preview modal instead of downloading
      setSelectedQRData(qrData);
      setShowQRPreview(true);

    } catch (err: any) {
      console.error("Error generating QR code:", err);
      setError(err.message || "Gagal membuat QR code");
    } finally {
      setGeneratingQR(null);
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  // Handle column sorting
  const handleColumnSort = (sortBy: ProductFilters['sortBy']) => {
    const newFilters = { ...filters };
    
    if (filters.sortBy === sortBy) {
      // Toggle sort order for the same column
      newFilters.sortOrder = filters.sortOrder === "asc" ? "desc" : "asc";
    } else {
      // New column, start with ascending
      newFilters.sortBy = sortBy;
      newFilters.sortOrder = "asc";
    }
    
    setFilters(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: "",
      productType: "",
      brand: "",
      source: "",
      contractStatus: "",
      sortBy: "productNumber",
      sortOrder: "asc"
    });
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
          format: 'png',
          useDesignedQR: true,
          logoUrl: '/images/logo/logo-light.png'
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
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-2 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white sm:text-2xl">Manajemen Produk</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">Kelola data produk dengan sistem yang terintegrasi.</p>
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

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
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

      {/* Filters */}
      <div className="mb-6">
        <ProductFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          productCount={products.length}
          filteredCount={filteredProducts.length}
          availableTypes={availableTypes}
          availableBrands={availableBrands}
          availableSources={availableSources}
        />
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Memuat produk...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            {products.length === 0 ? (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Belum ada produk</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Mulai dengan menambahkan produk pertama Anda.</p>
                <div className="mt-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gunakan tombol "Tambah Produk" di bagian atas untuk memulai.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Tidak ada hasil</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  Tidak ada produk yang cocok dengan filter yang Anda terapkan.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-stroke bg-gray-50 dark:border-strokedark dark:bg-gray-800">
                    {bulkMode && (
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </th>
                    )}
                    <SortableHeader
                      sortKey="productNumber"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={handleColumnSort}
                    >
                      No
                    </SortableHeader>
                    <SortableHeader
                      sortKey="name"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={handleColumnSort}
                    >
                      Nama
                    </SortableHeader>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Tipe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Merk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Spesifikasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Kontrak
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-strokedark">
                  {currentProducts.map((product, index) => {
                    const isSelected = product.id ? selectedProducts.has(product.id) : false;
                    return (
                      <tr 
                        key={product.id} 
                        className={`text-sm transition-colors ${
                          isSelected 
                            ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30" 
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {bulkMode && (
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => product.id && handleSelectProduct(product.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {product.productNumber}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {product.productType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">{product.specs.brand}</div>
                            <div className="text-gray-500 dark:text-gray-400">{product.specs.brandType}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                        {product.specs &&
                        Object.keys(product.specs).length > 0 ? (
                          <ul className="list-disc pl-4 text-sm">
                            {allSpecsColumns
                              .filter(
                                (col) =>
                                  product.specs[col.key] !== undefined &&
                                  product.specs[col.key] !== "" &&
                                  product.specs[col.key] !== null,
                              )
                              .map((col) => (
                                <li key={col.key} className="text-gray-700 dark:text-gray-300">
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
                        <td className="px-4 py-4">
                          {/* Tampilkan info contract */}
                          {product.contract ? (
                          <ul className="list-disc pl-4 text-sm">
                            <li className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Perusahaan:</span>{" "}
                              {product.contractData?.customerData?.name ?? "-"}
                            </li>
                            <li className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Nama Kontrak:</span>{" "}
                              {product.contractData?.contractName ?? "-"}
                            </li>
                            <li className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">
                                Nomor Kontrak:
                              </span>{" "}
                              {product.contractData?.contractNumber ?? "-"}
                            </li>
                            <li className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">
                                Tanggal Mulai:
                              </span>{" "}
                              {product.contractData?.startDate
                                ? product.contractData.startDate
                                    .toDate()
                                    .toLocaleDateString()
                                : "-"}
                            </li>
                            <li className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">
                                Tanggal Selesai:
                              </span>{" "}
                              {product.contractData?.endDate
                                ? product.contractData.endDate
                                    .toDate()
                                    .toLocaleDateString()
                                : "Ongoing"}
                            </li>
                            <li className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Status:</span>{" "}
                              {product.contractData?.status ?? "-"}
                            </li>
                          </ul>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
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
                            title="Preview QR Kode"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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
            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t border-stroke pt-4 sm:flex-row sm:space-y-0 dark:border-strokedark">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Menampilkan {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredProducts.length)} dari{" "}
                {filteredProducts.length} produk
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Item per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-stroke bg-white px-2 py-1 text-sm dark:border-strokedark dark:bg-boxdark dark:text-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === 1
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500"
                      : "border-stroke bg-white hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  &lt;
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Halaman <span className="font-medium">{currentPage}</span>{" "}
                  dari {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500"
                      : "border-stroke bg-white hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  &gt;
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

      {/* QR Code Preview Modal */}
      {selectedQRData && (
        <QRCodePreviewModal
          isOpen={showQRPreview}
          onClose={() => {
            setShowQRPreview(false);
            setSelectedQRData(null);
          }}
          qrData={selectedQRData}
          logoUrl="/images/logo/logo-light.png"
        />
      )}
    </div>
  );
}
