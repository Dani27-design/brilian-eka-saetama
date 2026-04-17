"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import type { Customer } from "@/types/customer";
import CustomerFiltersComponent, {
  CustomerFilters,
} from "@/components/Admin/Customers/CustomerFilters";
import CustomerListItem from "@/components/Admin/Customers/CustomerListItem";
import Modal from "@/components/Admin/Modal";
import { formatAddressSingleLine } from "@/utils/addressHelper";
import {
  downloadCustomersAsCSV,
  downloadCustomerCSVTemplate,
} from "@/utils/customerImportExport";
import { usePageHeader } from "@/app/context/PageHeaderContext";

export default function CustomersPage() {
  usePageHeader("Manajemen Pelanggan", "Kelola data pelanggan dengan sistem yang terintegrasi.");
  const router = useRouter();
  const [customers, setCustomers] = useState<
    (Customer & { id: string; contracts: any[] })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    customerType: "",
    businessField: "",
    province: "",
    hasContracts: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Bulk operations state
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(
    new Set(),
  );
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [contractModalCustomer, setContractModalCustomer] = useState<(Customer & { id: string; contracts: any[] }) | null>(null);

  // Fetch customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(firestore, "customers"));
      const data: any[] = [];

      for (const docSnap of querySnapshot.docs) {
        // Query contracts where customer === docSnap.id
        const contractsQuery = query(
          collection(firestore, "contracts"),
          where("customer", "==", doc(firestore, "customers", docSnap.id)),
        );
        const contractsSnapshot = await getDocs(contractsQuery);
        const contracts = contractsSnapshot.docs.map((c) => ({
          ...c.data(),
          id: c.id,
        }));

        data.push({ ...docSnap.data(), id: docSnap.id, contracts });
      }

      setCustomers(data);
    } catch (err) {
      setError("Gagal memuat pelanggan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Advanced filtering and sorting
  const filteredAndSortedCustomers = () => {
    let filtered = customers.filter((customer) => {
      // Search filter
      if (filters.search) {
        const searchableText = [
          customer.name,
          customer.businessField || "",
          // Handle legacy address format
          typeof customer.address === "string"
            ? customer.address
            : customer.address
            ? formatAddressSingleLine(customer.address)
            : "",
          // Search in all contacts
          ...(customer.contacts || []).map(
            (c) => `${c.name} ${c.email} ${c.phone}`,
          ),
          // Legacy contact fallback
          customer.contact
            ? `${customer.contact.name} ${customer.contact.email} ${customer.contact.phone}`
            : "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(filters.search.toLowerCase())) {
          return false;
        }
      }

      // Customer type filter
      if (
        filters.customerType &&
        customer.customerType !== filters.customerType
      ) {
        return false;
      }

      // Business field filter
      if (
        filters.businessField &&
        customer.businessField !== filters.businessField
      ) {
        return false;
      }

      // Province filter
      if (filters.province) {
        const customerProvince =
          typeof customer.address === "object" && customer.address
            ? customer.address.province
            : "";
        if (customerProvince !== filters.province) {
          return false;
        }
      }

      // Contracts filter
      if (filters.hasContracts) {
        const hasContracts = (customer.contracts?.length || 0) > 0;
        if (filters.hasContracts === "yes" && !hasContracts) return false;
        if (filters.hasContracts === "no" && hasContracts) return false;
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
        case "createdAt":
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          comparison = aDate.getTime() - bDate.getTime();
          break;
        case "updatedAt":
          const aUpdated =
            a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const bUpdated =
            b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          comparison = aUpdated.getTime() - bUpdated.getTime();
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredCustomers = filteredAndSortedCustomers();

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Delete customer
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "customers", id));
      setCustomers(customers.filter((c) => c.id !== id));
      setError(null);
    } catch {
      setError("Gagal menghapus pelanggan");
    }
  };

  // Bulk delete customers
  const handleBulkDelete = async () => {
    const selectedList = customers.filter(c => selectedCustomers.has(c.id));
    const withContracts = selectedList.filter(c => (c.contracts?.length || 0) > 0);

    if (withContracts.length > 0) {
      setError(`${withContracts.length} pelanggan memiliki kontrak aktif dan tidak dapat dihapus.`);
      return;
    }

    if (!window.confirm(`Hapus ${selectedList.length} pelanggan yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      setError(null);
      for (const customer of selectedList) {
        await deleteDoc(doc(firestore, "customers", customer.id));
      }
      setCustomers(prev => prev.filter(c => !selectedCustomers.has(c.id)));
      setSelectedCustomers(new Set());
    } catch {
      setError("Gagal menghapus beberapa pelanggan");
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: "",
      customerType: "",
      businessField: "",
      province: "",
      hasContracts: "",
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  // Bulk operations handlers
  const handleExport = () => {
    const customersToExport =
      selectedCustomers.size > 0
        ? customers.filter((customer) => selectedCustomers.has(customer.id))
        : customers;

    downloadCustomersAsCSV(
      customersToExport,
      `customers_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
  };

  const handleClearSelection = () => {
    setSelectedCustomers(new Set());
  };

  const handleToggleCustomerSelection = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Error Display */}
      {error && (
        <div className="mb-4 flex-shrink-0 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="break-words">{error}</p>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="mb-4">
        <CustomerFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          customerCount={customers.length}
          filteredCount={filteredCustomers.length}
          onAddCustomer={() => router.push("/admin/customers/create")}
          addCustomerLabel="Tambah Pelanggan"
          selectedCount={selectedCustomers.size}
          onExport={handleExport}
          onBulkDelete={handleBulkDelete}
          onClearSelection={handleClearSelection}
          onImport={() => router.push("/admin/customers/import")}
          onDownloadTemplate={() => downloadCustomerCSVTemplate()}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 animate-spin text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-2 text-gray-500">
                Memuat pelanggan...
              </p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-12 text-center">
            {customers.length === 0 ? (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Belum ada pelanggan
                </h3>
                <p className="mt-1 text-gray-500">
                  Mulai dengan menambahkan pelanggan pertama Anda.
                </p>
                <div className="mt-6">
                  <p className="text-sm text-gray-500">
                    Gunakan tombol "Tambah Pelanggan" di bagian atas untuk
                    memulai.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Tidak ada hasil
                </h3>
                <p className="mt-1 text-gray-500">
                  Tidak ada pelanggan yang cocok dengan filter yang Anda
                  terapkan.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="styled-scrollbar min-h-0 flex-1 overflow-auto">
              <table className="w-full table-auto">
                <thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedCustomers.size === currentCustomers.length &&
                          currentCustomers.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const allIds = new Set(currentCustomers.map((c) => c.id));
                            setSelectedCustomers(allIds);
                          } else {
                            setSelectedCustomers(new Set());
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Alamat</th>
                    <th className="px-4 py-3">Kontak Utama</th>
                    <th className="px-4 py-3">Kontrak</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {currentCustomers.map((customer) => (
                    <CustomerListItem
                      key={customer.id}
                      customer={customer}
                      onDelete={handleDelete}
                      isSelected={selectedCustomers.has(customer.id)}
                      onToggleSelection={() =>
                        handleToggleCustomerSelection(customer.id)
                      }
                      onViewContracts={setContractModalCustomer}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="my-0 flex flex-col items-center justify-between space-y-3 border-t border-stroke p-2 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                Menampilkan {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredCustomers.length)} dari{" "}
                {filteredCustomers.length} pelanggan
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Item per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-stroke bg-white px-2 py-1 text-sm outline-none focus:border-primary"
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
                      ? "cursor-not-allowed border-gray-200 bg-blue-50/50 text-gray-400"
                      : "border-stroke bg-white hover:bg-blue-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-600">
                  Halaman <span className="font-medium">{currentPage}</span>{" "}
                  dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-blue-50/50 text-gray-400"
                      : "border-stroke bg-white hover:bg-blue-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contract Detail Modal */}
      <Modal
        isOpen={contractModalCustomer !== null}
        onClose={() => setContractModalCustomer(null)}
        title={`Kontrak — ${contractModalCustomer?.name || ''}`}
      >
        {contractModalCustomer && contractModalCustomer.contracts.length > 0 && (
          <div className="styled-scrollbar max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                  <th className="px-3 py-2">Nama Kontrak</th>
                  <th className="px-3 py-2">Nomor</th>
                  <th className="px-3 py-2">Mulai</th>
                  <th className="px-3 py-2">Selesai</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {contractModalCustomer.contracts.map((contract: any) => (
                  <tr key={contract.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {contract.contractName || '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {contract.contractNumber || '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {contract.startDate?.toDate?.()
                        ? contract.startDate.toDate().toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {contract.endDate?.toDate?.()
                        ? contract.endDate.toDate().toLocaleDateString()
                        : 'Ongoing'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        contract.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contract.status === 'active' ? 'Aktif'
                          : contract.status === 'inactive' ? 'Nonaktif'
                          : contract.status === 'terminated' ? 'Dihentikan'
                          : contract.status || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
