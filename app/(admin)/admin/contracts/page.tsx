"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  DocumentReference,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import type { Contract } from "@/types/contracts";
import ContractFiltersComponent, {
  ContractFilters,
} from "@/components/Admin/Contracts/ContractFilters";

type ContractTableRow = Contract & {
  customerName: string;
  productDetailsDisplay: {
    productName: string;
    productNumber: string;
    serviceType?: string[];
  }[];
};

const contractStatusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  terminated: "bg-red-100 text-red-800",
};

const defaultFilters: ContractFilters = {
  search: "",
  status: "",
  contractType: "",
  customer: "",
  sortBy: "contractNumber",
  sortOrder: "asc",
};

export default function ContractsPage() {
  usePageHeader("Manajemen Kontrak", "Kelola data kontrak");

  const [contracts, setContracts] = useState<ContractTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContractFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const uniqueCustomers = useMemo(() => {
    const names = contracts.map((c) => c.customerName).filter((n) => n !== "-");
    return Array.from(new Set(names)).sort();
  }, [contracts]);

  // Handle filter clear (preserveSearch pattern)
  const handleClearFilters = () => {
    setFilters({
      ...defaultFilters,
      search: filters.search, // Preserve search text
    });
  };

  // Fetch contracts with referenced data
  const fetchContracts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(firestore, "contracts"));
      const data: ContractTableRow[] = [];

      const customerRefs: Record<string, DocumentReference> = {};
      const productRefs: Record<string, DocumentReference> = {};
      querySnapshot.forEach((docSnap) => {
        const contract = { ...docSnap.data(), id: docSnap.id } as Contract;
        if (contract.customer) {
          customerRefs[contract.customer.id] = contract.customer;
        }
        if (Array.isArray(contract.products)) {
          contract.products.forEach((prodRef) => {
            if (prodRef) productRefs[prodRef.id] = prodRef;
          });
        }
      });

      const customerSnaps = await Promise.all(
        Object.values(customerRefs).map((ref) => getDoc(ref))
      );
      const customerMap: Record<string, string> = {};
      customerSnaps.forEach((snap) => {
        if (snap.exists()) customerMap[snap.id] = snap.data().name || "-";
      });

      const productSnaps = await Promise.all(
        Object.values(productRefs).map((ref) => getDoc(ref))
      );
      const productMap: Record<
        string,
        { productNumber: string; name: string }
      > = {};
      productSnaps.forEach((snap) => {
        if (snap.exists())
          productMap[snap.id] = {
            productNumber: snap.data().productNumber || "-",
            name: snap.data().name || "-",
          };
      });

      for (const docSnap of querySnapshot.docs) {
        const contract = { ...docSnap.data(), id: docSnap.id } as Contract;
        let customerName = "-";
        if (contract.customer && contract.customer.id) {
          customerName = customerMap[contract.customer.id] || "-";
        }

        let productDetailsDisplay: {
          productName: string;
          productNumber: string;
          serviceType?: string[];
        }[] = [];
        if (Array.isArray(contract.productDetails)) {
          productDetailsDisplay = contract.productDetails.map((pd) => {
            const prod =
              pd.product && pd.product.id ? productMap[pd.product.id] : null;
            const services: string[] = [];
            if (pd.maintenance) services.push("Maintenance");
            if (pd.service) services.push("Service");
            if (pd.rental) services.push("Rental");
            if (pd.sales) services.push("Sales");
            return {
              productName: prod?.name ?? "",
              productNumber: prod?.productNumber ?? "",
              serviceType: services ?? [],
            };
          });
        }
        data.push({
          ...contract,
          customerName,
          productDetailsDisplay,
        });
      }
      setContracts(data);
    } catch (err) {
      setError("Gagal memuat kontrak");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Filtered contracts
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      filters.search === "" ||
      (
        c.contractNumber +
        c.customerName +
        (c.productDetailsDisplay || []).join(",")
      )
        .toLowerCase()
        .includes(filters.search.toLowerCase());
    const matchesStatus =
      filters.status === "" || c.status === filters.status;
    const matchesType =
      filters.contractType === "" || c.contractType === filters.contractType;
    const matchesCustomer =
      filters.customer === "" || c.customerName === filters.customer;
    return matchesSearch && matchesStatus && matchesType && matchesCustomer;
  });

  // Sort filtered contracts
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    const order = filters.sortOrder === "asc" ? 1 : -1;
    if (filters.sortBy === "contractNumber") {
      return (a.contractNumber || "").localeCompare(b.contractNumber || "") * order;
    } else if (filters.sortBy === "contractName") {
      return (a.contractName || "").localeCompare(b.contractName || "") * order;
    } else if (filters.sortBy === "startDate") {
      const dateA = a.startDate && (a.startDate as any).toDate
        ? (a.startDate as any).toDate().getTime()
        : 0;
      const dateB = b.startDate && (b.startDate as any).toDate
        ? (b.startDate as any).toDate().getTime()
        : 0;
      return (dateA - dateB) * order;
    } else if (filters.sortBy === "endDate") {
      const dateA = a.endDate && (a.endDate as any).toDate
        ? (a.endDate as any).toDate().getTime()
        : 0;
      const dateB = b.endDate && (b.endDate as any).toDate
        ? (b.endDate as any).toDate().getTime()
        : 0;
      return (dateA - dateB) * order;
    } else {
      return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedContracts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContracts = sortedContracts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Delete contract
  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Hapus kontrak ini? PERHATIAN: Semua data maintenance yang terkait dengan kontrak ini juga akan dihapus."
      )
    ) {
      try {
        const relatedMaintenancesQuery = await getDocs(
          query(
            collection(firestore, "maintenances"),
            where("contract", "==", doc(firestore, "contracts", id))
          )
        );

        const affiliatedProductsQuery = await getDocs(
          query(
            collection(firestore, "products"),
            where("contract", "==", doc(firestore, "contracts", id))
          )
        );

        const batch = writeBatch(firestore);

        for (const maintenanceDoc of relatedMaintenancesQuery.docs) {
          batch.delete(doc(firestore, "maintenances", maintenanceDoc.id));
        }

        for (const productDoc of affiliatedProductsQuery.docs) {
          batch.update(doc(firestore, "products", productDoc.id), {
            contract: null,
          });
        }

        batch.delete(doc(firestore, "contracts", id));

        await batch.commit();

        setContracts(contracts.filter((c) => c.id !== id));

        if (relatedMaintenancesQuery.docs.length > 0) {
          alert(
            `Kontrak berhasil dihapus bersama dengan ${relatedMaintenancesQuery.docs.length} data maintenance terkait.`
          );
        }
      } catch (error) {
        console.error(
          "Error deleting contract:",
          error instanceof Error ? error.message : "Unknown error"
        );
        setError("Gagal menghapus kontrak dan data terkait");
      }
    }
  };

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/contracts/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Kontrak
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Filter Component */}
      <div className="mb-6">
        <ContractFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          contractCount={contracts.length}
          filteredCount={sortedContracts.length}
          availableCustomers={uniqueCustomers}
        />
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4">
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
              <p className="mt-2 text-gray-500">Memuat kontrak...</p>
            </div>
          </div>
        ) : sortedContracts.length === 0 ? (
          <div className="py-12 text-center">
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
              Tidak ada kontrak
            </h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-stroke bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3">No. Kontrak</th>
                    <th className="px-4 py-3">Nama Kontrak</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Tanggal Mulai</th>
                    <th className="px-4 py-3">Tanggal Selesai</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Produk & Layanan</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {currentContracts.map((contract) => (
                    <tr key={contract.id} className="text-sm hover:bg-gray-50">
                      <td className="px-4 py-3">{contract.contractNumber}</td>
                      <td className="px-4 py-3">{contract.contractName}</td>
                      <td className="px-4 py-3">{contract.contractType}</td>
                      <td className="px-4 py-3">
                        {contract.contractDescription}
                      </td>
                      <td className="px-4 py-3">{contract.customerName}</td>
                      <td className="px-4 py-3">
                        {contract.startDate &&
                        (contract.startDate as any).toDate
                          ? (contract.startDate as any)
                              .toDate()
                              .toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {contract.endDate && (contract.endDate as any).toDate
                          ? (contract.endDate as any)
                              .toDate()
                              .toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            contractStatusColor[contract.status] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {contract.status === "active"
                            ? "Aktif"
                            : contract.status === "inactive"
                              ? "Tidak Aktif"
                              : contract.status === "terminated"
                                ? "Dihentikan"
                                : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {contract.productDetailsDisplay &&
                        contract.productDetailsDisplay.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {contract.productDetailsDisplay.map((item, idx) => (
                              <div key={idx} className="mb-2 flex flex-col">
                                <li>
                                  Produk : {item.productName} (
                                  {item.productNumber})
                                </li>
                                <li>
                                  Layanan : {item.serviceType?.join(", ")}
                                </li>
                              </div>
                            ))}
                          </ul>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/contracts/edit/${contract.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mr-1 h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6"
                              />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mr-1 h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t pt-4 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                Menampilkan {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, sortedContracts.length)} dari{" "}
                {sortedContracts.length} kontrak
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Item per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border px-2 py-1 text-sm"
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
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-sm text-gray-600">
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
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
