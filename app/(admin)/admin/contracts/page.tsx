"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import type { Contract } from "@/types/contracts";

type ContractTableRow = Contract & {
  customerName: string;
  productDetailsDisplay: string[];
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch contracts with referenced data
  const fetchContracts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(firestore, "contracts"));
      const data: ContractTableRow[] = [];

      // Collect all customer and product references
      const customerRefs: Record<string, DocumentReference> = {};
      const productRefs: Record<string, DocumentReference> = {};
      querySnapshot.forEach((docSnap) => {
        const contract = { id: docSnap.id, ...docSnap.data() } as Contract;
        if (contract.customer) {
          customerRefs[contract.customer.id] = contract.customer;
        }
        if (Array.isArray(contract.products)) {
          contract.products.forEach((prodRef) => {
            if (prodRef) productRefs[prodRef.id] = prodRef;
          });
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

      // Batch fetch products
      const productSnaps = await Promise.all(
        Object.values(productRefs).map((ref) => getDoc(ref))
      );
      const productMap: Record<string, { productNumber: string; name: string }> = {};
      productSnaps.forEach((snap) => {
        if (snap.exists())
          productMap[snap.id] = {
            productNumber: snap.data().productNumber || "-",
            name: snap.data().name || "-",
          };
      });

      // Build table data
      for (const docSnap of querySnapshot.docs) {
        const contract = { id: docSnap.id, ...docSnap.data() } as Contract;
        let customerName = "-";
        if (contract.customer && contract.customer.id) {
          customerName = customerMap[contract.customer.id] || "-";
        }
        // Build product details display
        let productDetailsDisplay: string[] = [];
        if (Array.isArray(contract.productDetails)) {
          productDetailsDisplay = contract.productDetails.map((pd) => {
            const prod = pd.product && pd.product.id ? productMap[pd.product.id] : null;
            const services = [
              pd.maintenance ? "Maintenance" : null,
              pd.service ? "Service" : null,
              pd.rental ? "Rental" : null,
              pd.sales ? "Sales" : null,
            ].filter(Boolean).join(", ");
            return prod
              ? `${prod.productNumber} (${services})`
              : `- (${services})`;
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
  }, [searchTerm]);

  // Filtered contracts
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = (
      c.contractNumber +
      c.customerName +
      (c.productDetailsDisplay || []).join(",")
    )
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContracts = filteredContracts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Delete contract
  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus kontrak ini?")) {
      try {
        await deleteDoc(doc(firestore, "contracts", id));
        setContracts(contracts.filter((c) => c.id !== id));
      } catch {
        setError("Gagal menghapus kontrak");
      }
    }
  };

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Manajemen Kontrak</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola data kontrak</p>
        </div>
        <Link
          href="/admin/contracts/create"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 sm:mt-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4"
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
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-64">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Cari kontrak...
            </label>
            <input
              type="text"
              placeholder="Cari kontrak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke px-4 py-2 outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4">
        {isLoading ? (
          <div className="py-8 text-center">Memuat kontrak...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="py-8 text-center">Tidak ada kontrak.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black">
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
                <tbody>
                  {currentContracts.map((contract) => (
                    <tr key={contract.id} className="text-sm">
                      <td className="px-4 py-3">{contract.contractNumber}</td>
                      <td className="px-4 py-3">{contract.contractName}</td>
                      <td className="px-4 py-3 capitalize">{contract.contractType}</td>
                      <td className="px-4 py-3">{contract.contractDescription}</td>
                      <td className="px-4 py-3">{contract.customerName}</td>
                      <td className="px-4 py-3">
                        {contract.startDate && (contract.startDate as any).toDate
                          ? (contract.startDate as any).toDate().toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {contract.endDate && (contract.endDate as any).toDate
                          ? (contract.endDate as any).toDate().toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 capitalize">{contract.status}</td>
                      <td className="px-4 py-3">
                        {contract.productDetailsDisplay && contract.productDetailsDisplay.length > 0
                          ? contract.productDetailsDisplay.join(", ")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/contracts/edit/${contract.id}`}
                            className="flex w-18 items-center justify-center rounded-lg bg-blue-200 px-1.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-yellow-200"
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
                            className="flex w-18 items-center justify-center rounded-lg border border-red-300 bg-white px-1.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
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
                {Math.min(indexOfLastItem, filteredContracts.length)} dari{" "}
                {filteredContracts.length} kontrak
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
                  &lt;
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
                  &gt;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}