"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Contract } from "@/types/contracts";
import { useAdmin } from "@/app/context/AdminContext";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { generateMaintenancesForContract } from "@/utils/contractMaintenanceGenerator";

interface BulkAddToContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: (Product & { contractData?: any })[];
  onSuccess: () => void;
}

interface ContractOption {
  id: string;
  contractNumber: string;
  contractName: string;
  contractType: string;
  customerName: string;
  startDate: any;
  endDate: any;
}

/**
 * Dialog component for bulk adding products to an existing contract
 * Allows selection of contract, location input, and service type configuration
 */
export default function BulkAddToContractDialog({
  isOpen,
  onClose,
  selectedProducts,
  onSuccess
}: BulkAddToContractDialogProps) {
  const { user } = useAdmin();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [selectedContract, setSelectedContract] = useState<string>("");
  
  // Individual product configurations
  const [productConfigurations, setProductConfigurations] = useState<Record<string, {
    location: string;
    serviceTypes: {
      maintenance: boolean;
      service: boolean;
      rental: boolean;
      sales: boolean;
    };
  }>>({});
  
  // Bulk action helpers
  const [bulkLocation, setBulkLocation] = useState<string>("");
  
  // Available contracts
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Filter only unassigned products
  const unassignedProducts = selectedProducts.filter(product => !product.contract);

  /**
   * Fetches available active contracts with customer information
   */
  const fetchContracts = async () => {
    setLoadingContracts(true);
    try {
      const contractsQuery = query(
        collection(firestore, "contracts"),
        where("status", "==", "active")
      );
      const contractsSnap = await getDocs(contractsQuery);
      
      const contractOptions: ContractOption[] = [];
      
      // Collect customer references
      const customerRefs: Record<string, DocumentReference> = {};
      contractsSnap.forEach((docSnap) => {
        const contractData = { ...docSnap.data(), id: docSnap.id } as Contract;
        if (contractData.customer) {
          customerRefs[contractData.customer.id] = contractData.customer;
        }
      });

      // Batch fetch customers
      const customerSnaps = await Promise.all(
        Object.values(customerRefs).map((ref) => getDoc(ref))
      );
      const customerMap: Record<string, string> = {};
      customerSnaps.forEach((snap) => {
        if (snap.exists()) customerMap[snap.id] = snap.data().name || "-";
      });

      // Build contract options
      contractsSnap.forEach((docSnap) => {
        const contractData = { ...docSnap.data(), id: docSnap.id } as Contract;
        const customerName = contractData.customer 
          ? customerMap[contractData.customer.id] || "-"
          : "-";

        contractOptions.push({
          id: contractData.id,
          contractNumber: contractData.contractNumber,
          contractName: contractData.contractName,
          contractType: contractData.contractType,
          customerName,
          startDate: contractData.startDate,
          endDate: contractData.endDate,
        });
      });

      setContracts(contractOptions);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError("Gagal memuat daftar kontrak");
    } finally {
      setLoadingContracts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContracts();
    }
  }, [isOpen]);

  /**
   * Auto-set service types for all products based on selected contract type
   */
  useEffect(() => {
    if (selectedContract && unassignedProducts.length > 0) {
      const contract = contracts.find(c => c.id === selectedContract);
      if (contract) {
        const defaultServiceTypes = {
          maintenance: contract.contractType === "maintenance",
          service: contract.contractType === "service",
          rental: contract.contractType === "rental",
          sales: contract.contractType === "sales",
        };
        
        // Initialize configurations for all unassigned products
        const newConfigurations: Record<string, any> = {};
        unassignedProducts.forEach(product => {
          newConfigurations[product.id!] = {
            location: "",
            serviceTypes: { ...defaultServiceTypes }
          };
        });
        setProductConfigurations(newConfigurations);
      }
    }
  }, [selectedContract, contracts, unassignedProducts.length]);

  /**
   * Handles individual product location changes
   */
  const handleProductLocationChange = (productId: string, location: string) => {
    setProductConfigurations(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        location
      }
    }));
  };

  /**
   * Handles individual product service type changes
   */
  const handleProductServiceTypeChange = (productId: string, serviceType: string, checked: boolean) => {
    setProductConfigurations(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        serviceTypes: {
          ...prev[productId]?.serviceTypes,
          [serviceType]: checked
        }
      }
    }));
  };

  /**
   * Applies bulk location to all products
   */
  const applyBulkLocation = () => {
    if (!bulkLocation.trim()) return;
    
    setProductConfigurations(prev => {
      const updated = { ...prev };
      unassignedProducts.forEach(product => {
        if (updated[product.id!]) {
          updated[product.id!].location = bulkLocation.trim();
        }
      });
      return updated;
    });
    setBulkLocation("");
  };

  /**
   * Bulk select/deselect service type for all products
   */
  const handleBulkServiceType = (serviceType: string, checked: boolean) => {
    setProductConfigurations(prev => {
      const updated = { ...prev };
      unassignedProducts.forEach(product => {
        if (updated[product.id!]) {
          updated[product.id!].serviceTypes[serviceType] = checked;
        }
      });
      return updated;
    });
  };

  /**
   * Validates form data before submission
   */
  const validateForm = (): boolean => {
    if (unassignedProducts.length === 0) {
      setError("Tidak ada produk yang belum dikontrak yang dipilih");
      return false;
    }

    if (!selectedContract) {
      setError("Pilih kontrak terlebih dahulu");
      return false;
    }

    // Validate each product configuration
    for (const product of unassignedProducts) {
      const config = productConfigurations[product.id!];
      if (!config) {
        setError(`Konfigurasi produk ${product.productNumber} - ${product.name} belum diisi`);
        return false;
      }
      
      if (!config.location.trim()) {
        setError(`Lokasi untuk produk ${product.productNumber} - ${product.name} harus diisi`);
        return false;
      }
      
      if (!Object.values(config.serviceTypes).some(value => value)) {
        setError(`Pilih minimal satu jenis layanan untuk produk ${product.productNumber} - ${product.name}`);
        return false;
      }
    }

    return true;
  };

  /**
   * Handles bulk addition of products to contract
   */
  const handleBulkAddToContract = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const contractRef = doc(firestore, "contracts", selectedContract);
      const contractSnap = await getDoc(contractRef);
      
      if (!contractSnap.exists()) {
        setError("Kontrak tidak ditemukan");
        return;
      }

      const contractData = contractSnap.data() as Contract;
      
      // Build new product references and details
      const newProductRefs = unassignedProducts.map(product => 
        doc(firestore, "products", product.id!)
      );
      
      const newProductDetails = unassignedProducts.map(product => {
        const config = productConfigurations[product.id!];
        return {
          product: doc(firestore, "products", product.id!),
          location: config.location.trim(),
          maintenance: config.serviceTypes.maintenance,
          service: config.serviceTypes.service,
          rental: config.serviceTypes.rental,
          sales: config.serviceTypes.sales,
        };
      });

      // Update contract with new products
      const updatedProducts = [...(contractData.products || []), ...newProductRefs];
      const updatedProductDetails = [...(contractData.productDetails || []), ...newProductDetails];

      await updateDoc(contractRef, {
        products: updatedProducts,
        productDetails: updatedProductDetails,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });

      // Update each product's contract field
      const productUpdates = unassignedProducts.map(product =>
        updateDoc(doc(firestore, "products", product.id!), {
          contract: contractRef,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
        })
      );

      await Promise.all(productUpdates);

      // Auto-generate maintenances if contract type is maintenance
      if (contractData.contractType === "maintenance" && contractData.endDate) {
        try {
          await generateMaintenancesForContract(
            selectedContract,
            unassignedProducts.map(p => p.id!),
            contractData.startDate.toDate(),
            contractData.endDate.toDate()
          );
          console.log("Maintenances generated successfully for bulk addition");
        } catch (maintenanceError) {
          console.error("Failed to generate maintenances:", maintenanceError);
          // Continue since products were successfully added to contract
        }
      }

      setSuccessMessage(`Berhasil menambahkan ${unassignedProducts.length} produk ke kontrak`);
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error("Error adding products to contract:", err);
      setError(err.message || "Gagal menambahkan produk ke kontrak");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Resets dialog state and closes
   */
  const handleClose = () => {
    setSelectedContract("");
    setProductConfigurations({});
    setBulkLocation("");
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Tambah Produk ke Kontrak</h2>
            <p className="text-sm text-gray-600">
              Menambahkan {unassignedProducts.length} produk yang belum dikontrak ke kontrak yang dipilih
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
            {successMessage}
          </div>
        )}

        {unassignedProducts.length === 0 ? (
          <div className="mb-4 rounded-lg bg-yellow-100 p-3 text-yellow-800">
            Semua produk yang dipilih sudah dikontrak. Hanya produk yang belum dikontrak yang dapat ditambahkan.
          </div>
        ) : (
          <>
            {/* Contract Selection */}
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">Pilih Kontrak</h3>
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                disabled={loadingContracts || isProcessing}
                className="w-full rounded-lg border px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="">
                  {loadingContracts ? "Memuat kontrak..." : "Pilih kontrak..."}
                </option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.contractNumber} - {contract.contractName} ({contract.contractType}) - {contract.customerName}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Action Helpers */}
            <div className="mb-6 rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">Aksi Massal (Opsional)</h3>
              <div className="space-y-3">
                {/* Bulk Location */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bulkLocation}
                    onChange={(e) => setBulkLocation(e.target.value)}
                    placeholder="Terapkan lokasi yang sama ke semua produk"
                    className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={applyBulkLocation}
                    disabled={!bulkLocation.trim() || isProcessing}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Terapkan
                  </button>
                </div>
                
                {/* Bulk Service Types */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkServiceType("maintenance", true)}
                    disabled={isProcessing}
                    className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
                  >
                    Pilih Semua Pemeliharaan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkServiceType("service", true)}
                    disabled={isProcessing}
                    className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700 hover:bg-orange-200"
                  >
                    Pilih Semua Perbaikan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkServiceType("rental", true)}
                    disabled={isProcessing}
                    className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200"
                  >
                    Pilih Semua Penyewaan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkServiceType("sales", true)}
                    disabled={isProcessing}
                    className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-200"
                  >
                    Pilih Semua Penjualan
                  </button>
                </div>
              </div>
            </div>

            {/* Individual Product Configuration */}
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">Konfigurasi Individual Produk</h3>
              <div className="max-h-96 space-y-4 overflow-y-auto">
                {unassignedProducts.map((product, index) => {
                  const config = productConfigurations[product.id!] || { location: "", serviceTypes: { maintenance: false, service: false, rental: false, sales: false } };
                  const hasLocation = config.location.trim().length > 0;
                  const hasService = Object.values(config.serviceTypes).some(v => v);
                  
                  return (
                    <div key={product.id} className="rounded-lg border bg-white p-4">
                      {/* Product Header */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                            {index + 1}
                          </span>
                          <span className="font-medium">
                            {product.productNumber} - {product.name}
                          </span>
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {product.productType}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {hasLocation && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                              ✓
                            </span>
                          )}
                          {!hasLocation && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-600">
                              ✗
                            </span>
                          )}
                          {hasService && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                              ✓
                            </span>
                          )}
                          {!hasService && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-600">
                              ✗
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Location Input */}
                      <div className="mb-3">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Lokasi {!hasLocation && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={config.location}
                          onChange={(e) => handleProductLocationChange(product.id!, e.target.value)}
                          placeholder="Contoh: Lantai 1 - Ruang Server"
                          disabled={isProcessing}
                          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                            hasLocation
                              ? "border-green-300 focus:border-green-500"
                              : "border-red-300 focus:border-red-500"
                          }`}
                        />
                      </div>
                      
                      {/* Service Types */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Jenis Layanan {!hasService && <span className="text-red-500">*</span>}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={config.serviceTypes.maintenance}
                              onChange={(e) => handleProductServiceTypeChange(product.id!, "maintenance", e.target.checked)}
                              disabled={isProcessing}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Pemeliharaan</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={config.serviceTypes.service}
                              onChange={(e) => handleProductServiceTypeChange(product.id!, "service", e.target.checked)}
                              disabled={isProcessing}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Perbaikan</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={config.serviceTypes.rental}
                              onChange={(e) => handleProductServiceTypeChange(product.id!, "rental", e.target.checked)}
                              disabled={isProcessing}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Penyewaan</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={config.serviceTypes.sales}
                              onChange={(e) => handleProductServiceTypeChange(product.id!, "sales", e.target.checked)}
                              disabled={isProcessing}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Penjualan</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Status */}
            {selectedContract && Object.keys(productConfigurations).length > 0 && (
              <div className="mb-6 rounded-lg border bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-800">Status Konfigurasi</h3>
                <div className="text-sm text-blue-700">
                  <p><strong>Kontrak:</strong> {contracts.find(c => c.id === selectedContract)?.contractNumber} - {contracts.find(c => c.id === selectedContract)?.contractName}</p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Lokasi:</p>
                      <p className="text-xs">
                        {unassignedProducts.filter(p => productConfigurations[p.id!]?.location?.trim()).length} / {unassignedProducts.length} selesai
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Layanan:</p>
                      <p className="text-xs">
                        {unassignedProducts.filter(p => {
                          const config = productConfigurations[p.id!];
                          return config && Object.values(config.serviceTypes).some(v => v);
                        }).length} / {unassignedProducts.length} selesai
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleBulkAddToContract}
            disabled={
              isProcessing || 
              unassignedProducts.length === 0 || 
              !selectedContract || 
              !unassignedProducts.every(p => {
                const config = productConfigurations[p.id!];
                return config && 
                       config.location.trim() && 
                       Object.values(config.serviceTypes).some(v => v);
              })
            }
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isProcessing ? "Menyimpan..." : `Tambahkan ${unassignedProducts.length} Produk`}
          </button>
        </div>
      </div>
    </div>
  );
}