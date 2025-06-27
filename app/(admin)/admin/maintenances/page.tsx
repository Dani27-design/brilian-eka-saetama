"use client";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import Link from "next/link";
import { Maintenance } from "@/types/maintenances";

type MaintenanceTableRow = {
  id: string;
  contractNumber: string;
  contractName: string;
  productNumber: string;
  productName: string;
  startDate: Date | null;
  endDate: Date | null;
  status: Maintenance["status"];
  engineers: string[];
};

const statusColor = {
  scheduled: "bg-blue-100 text-blue-700",
  waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<MaintenanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchMaintenances = async () => {
      const snap = await getDocs(collection(firestore, "maintenances"));
      const maints: MaintenanceTableRow[] = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as Maintenance;
        // Fetch contract & product
        let contractNumber = "-";
        let contractName = "-";
        let productNumber = "-";
        let productName = "-";
        if (data.contract) {
          const contractSnap = await getDoc(data.contract as DocumentReference);
          if (contractSnap.exists()) {
            contractNumber = contractSnap.data().contractNumber || "-";
            contractName = contractSnap.data().contractName || "-";
          }
        }
        if (data.product) {
          const productSnap = await getDoc(data.product as DocumentReference);
          if (productSnap.exists()) {
            productNumber = productSnap.data().productNumber || "-";
            productName = productSnap.data().name || "-";
          }
        }
        // Fetch engineers
        let engineers: string[] = [];
        if (Array.isArray(data.engineer)) {
          for (const engRef of data.engineer) {
            const engSnap = await getDoc(engRef as DocumentReference);
            if (engSnap.exists())
              engineers.push(engSnap.data().name || engSnap.id);
          }
        }
        maints.push({
          id: docSnap.id,
          contractNumber,
          contractName,
          productNumber,
          productName,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : null,
          endDate: data.endDate?.toDate ? data.endDate.toDate() : null,
          status: data.status,
          engineers,
        });
      }
      setMaintenances(maints);
      setLoading(false);
    };
    fetchMaintenances();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filtered maintenances
  const filteredMaintenances = maintenances.filter((m) => {
    const search = (
      m.contractNumber +
      m.contractName +
      m.productNumber +
      m.productName +
      (m.engineers || []).join(",")
    )
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return search;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMaintenances.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMaintenances = filteredMaintenances.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Manajemen Maintenance</h2>
          <p className="mt-1 text-sm text-gray-500">
            Kelola jadwal maintenance
          </p>
        </div>
        <Link
          href="/admin/maintenances/create"
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
          Tambah Maintenance
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-64">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Cari maintenance...
            </label>
            <input
              type="text"
              placeholder="Cari maintenance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke px-4 py-2 outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4">
        {loading ? (
          <div className="py-8 text-center">Memuat maintenance...</div>
        ) : filteredMaintenances.length === 0 ? (
          <div className="py-8 text-center">Tidak ada maintenance.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    <th className="px-2 py-3">No. Kontrak</th>
                    <th className="px-2 py-3">Nama Kontrak</th>
                    <th className="px-2 py-3">Produk</th>
                    <th className="px-2 py-3">Tanggal Mulai</th>
                    <th className="px-2 py-3">Tanggal Selesai</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Engineer</th>
                    <th className="px-2 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMaintenances.map((m) => (
                    <tr key={m.id} className="text-sm">
                      <td className="px-2 py-3">{m.contractNumber}</td>
                      <td className="px-2 py-3">{m.contractName}</td>
                      <td className="px-2 py-3">
                        {m.productNumber} - {m.productName}
                      </td>
                      <td className="px-2 py-3">
                        {m.startDate ? m.startDate.toLocaleDateString() : "-"}
                      </td>
                      <td className="px-2 py-3">
                        {m.endDate ? m.endDate.toLocaleDateString() : "-"}
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                            statusColor[m.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {m.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        {m.engineers.length ? m.engineers.join(", ") : "-"}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/maintenances/edit/${m.id}`}
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
                {Math.min(indexOfLastItem, filteredMaintenances.length)} dari{" "}
                {filteredMaintenances.length} maintenance
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
