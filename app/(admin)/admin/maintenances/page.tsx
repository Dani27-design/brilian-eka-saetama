"use client";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  DocumentReference,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import Link from "next/link";
import { Maintenance, MaintenanceStatus } from "@/types/maintenances";
import { useAdmin } from "@/app/context/AdminContext";
import Image from "next/image";

type MaintenanceTableRow = {
  id: string;
  contractNumber: string;
  contractName: string;
  productNumber: string;
  productName: string;
  productType: string;
  startDate: Date | null;
  endDate: Date | null;
  status: MaintenanceStatus;
  engineers: Array<{ id: string; name: string }>;
  hasInspection: boolean;
  inspection: any;
};

type Engineer = {
  id: string;
  name: string;
};

const statusColor: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  pending: "bg-gray-100 text-gray-700",
  waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusDisplay: Record<MaintenanceStatus, string> = {
  scheduled: "Scheduled",
  pending: "Pending",
  waiting_approval: "Waiting Approval",
  approved: "Approved",
  rejected: "Rejected",
};

export default function MaintenancesPage() {
  const { user } = useAdmin();
  const [maintenances, setMaintenances] = useState<MaintenanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allEngineers, setAllEngineers] = useState<Engineer[]>([]);
  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState("");
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [searchEngineer, setSearchEngineer] = useState("");
  const [error, setError] = useState("");
  const [expandedInspections, setExpandedInspections] = useState<string[]>([]);

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const engSnapshot = await getDocs(collection(firestore, "users"));
        const engineers: Engineer[] = [];

        engSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.role === "engineer") {
            engineers.push({
              id: doc.id,
              name: data.name || doc.id,
            });
          }
        });

        setAllEngineers(engineers);
      } catch (err) {
        console.error("Failed to load engineers:", err);
      }
    };

    fetchEngineers();
  }, []);

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
        let productType = data.productType || "-";

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
        let engineers: Array<{ id: string; name: string }> = [];
        if (Array.isArray(data.engineer)) {
          for (const engRef of data.engineer) {
            const engSnap = await getDoc(engRef as DocumentReference);
            if (engSnap.exists())
              engineers.push({
                id: engSnap.id,
                name: engSnap.data().name || engSnap.id,
              });
          }
        }
        maints.push({
          id: docSnap.id,
          contractNumber,
          contractName,
          productNumber,
          productName,
          productType,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : null,
          endDate: data.endDate?.toDate ? data.endDate.toDate() : null,
          status: data.status,
          engineers,
          hasInspection: !!data.inspection,
          inspection: data.inspection,
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
      m.productType +
      (m.engineers.map((e) => e.name) || []).join(",")
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

  // Engineers modal handlers
  const openEngineerModal = (maintenanceId: string) => {
    const maintenance = maintenances.find((m) => m.id === maintenanceId);
    if (maintenance) {
      setSelectedMaintenanceId(maintenanceId);
      setSelectedEngineers(maintenance.engineers.map((e) => e.id));
      setShowEngineerModal(true);
    }
  };

  const closeEngineerModal = () => {
    setShowEngineerModal(false);
    setSelectedMaintenanceId("");
    setSelectedEngineers([]);
    setSearchEngineer("");
  };

  const addEngineer = (engineerId: string) => {
    if (!selectedEngineers.includes(engineerId)) {
      setSelectedEngineers([...selectedEngineers, engineerId]);
    }
    setSearchEngineer("");
  };

  const removeEngineer = (engineerId: string) => {
    setSelectedEngineers(selectedEngineers.filter((id) => id !== engineerId));
  };

  const saveEngineers = async () => {
    if (!selectedMaintenanceId) return;

    setActionLoading(selectedMaintenanceId);
    try {
      const maintenanceRef = doc(
        firestore,
        "maintenances",
        selectedMaintenanceId,
      );

      // Determine if status should change
      const currentMaintenance = maintenances.find(
        (m) => m.id === selectedMaintenanceId,
      );
      let newStatus = currentMaintenance?.status || "pending";

      // If engineers are assigned and status is pending, update to scheduled
      if (selectedEngineers.length > 0 && newStatus === "pending") {
        newStatus = "scheduled";
      }

      // If no engineers are assigned and status is scheduled, revert to pending
      if (selectedEngineers.length === 0 && newStatus === "scheduled") {
        newStatus = "pending";
      }

      await updateDoc(maintenanceRef, {
        engineer: selectedEngineers.map((id) => doc(firestore, "users", id)),
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });

      // Update local state
      setMaintenances(
        maintenances.map((m) => {
          if (m.id === selectedMaintenanceId) {
            const engineerObjects = selectedEngineers.map((id) => {
              const engineer = allEngineers.find((e) => e.id === id);
              return {
                id,
                name: engineer?.name || id,
              };
            });

            return {
              ...m,
              engineers: engineerObjects,
              status: newStatus,
            };
          }
          return m;
        }),
      );

      closeEngineerModal();
    } catch (error) {
      setError("Failed to update engineers");
      console.error("Error updating engineers:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Approval/Rejection handlers
  const updateStatus = async (
    maintenanceId: string,
    newStatus: MaintenanceStatus,
  ) => {
    setActionLoading(maintenanceId);
    try {
      const maintenanceRef = doc(firestore, "maintenances", maintenanceId);

      await updateDoc(maintenanceRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });

      // Update local state
      setMaintenances(
        maintenances.map((m) => {
          if (m.id === maintenanceId) {
            return {
              ...m,
              status: newStatus,
            };
          }
          return m;
        }),
      );
    } catch (error) {
      setError("Failed to update status");
      console.error("Error updating status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered engineers for the modal
  const filteredEngineers = allEngineers.filter(
    (engineer) =>
      engineer.name.toLowerCase().includes(searchEngineer.toLowerCase()) &&
      !selectedEngineers.includes(engineer.id),
  );

  const toggleInspectionExpand = (maintenanceId: string) => {
    if (expandedInspections.includes(maintenanceId)) {
      setExpandedInspections(
        expandedInspections.filter((id) => id !== maintenanceId),
      );
    } else {
      setExpandedInspections([...expandedInspections, maintenanceId]);
    }
  };

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

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
          <p>{error}</p>
          <button
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
            onClick={() => setError("")}
          >
            Tutup
          </button>
        </div>
      )}

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
                    <th className="px-2 py-3">Kontrak</th>
                    <th className="px-2 py-3">Produk</th>
                    <th className="px-2 py-3">Periode</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Engineer</th>
                    <th className="px-2 py-3">Inspeksi</th>
                    <th className="px-2 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMaintenances.map((m) => (
                    <tr key={m.id} className="text-sm">
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {m.contractNumber}
                          </span>
                          <span className="text-xs text-gray-500">
                            {m.contractName}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {m.productNumber}
                            </span>
                            <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                              {m.productType}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {m.productName}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <span>
                            {m.startDate
                              ? m.startDate.toLocaleDateString()
                              : "-"}
                          </span>
                          <span className="text-xs text-gray-500">
                            s/d{" "}
                            {m.endDate ? m.endDate.toLocaleDateString() : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <div className="mb-1 flex items-center gap-1">
                            <span
                              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                                statusColor[m.status]
                              }`}
                            >
                              {statusDisplay[m.status]}
                            </span>

                            {m.status === "waiting_approval" &&
                              m.hasInspection && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() =>
                                      updateStatus(m.id, "approved")
                                    }
                                    disabled={actionLoading === m.id}
                                    className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
                                  >
                                    {actionLoading === m.id ? "..." : "✓"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateStatus(m.id, "rejected")
                                    }
                                    disabled={actionLoading === m.id}
                                    className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                                  >
                                    {actionLoading === m.id ? "..." : "✕"}
                                  </button>
                                </div>
                              )}
                          </div>

                          {m.status === "waiting_approval" &&
                            !m.hasInspection && (
                              <div className="text-xs text-orange-500">
                                Menunggu inspeksi
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          {m.engineers.length > 0 && (
                            <div className="mb-1 flex flex-wrap gap-1">
                              {m.engineers.map((eng) => (
                                <span
                                  key={eng.id}
                                  className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs"
                                >
                                  {eng.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => openEngineerModal(m.id)}
                            disabled={actionLoading === m.id}
                            className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                          >
                            {actionLoading === m.id ? "..." : "Kelola Engineer"}
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        {m.hasInspection && m.inspection ? (
                          <div className="flex flex-col gap-1 text-xs">
                            <ul className="mb-1 ml-2 list-disc">
                              {m.inspection.checklist.map(
                                (item: any, idx: number) => (
                                  <li key={idx}>
                                    <span className="font-medium">
                                      {item.item}:
                                    </span>{" "}
                                    <span
                                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                                        item.status
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {item.status ? (
                                        <svg
                                          className="h-3 w-3 text-green-500"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      ) : (
                                        <svg
                                          className="h-3 w-3 text-red-500"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      )}
                                    </span>
                                    {item.remarks && (
                                      <span className="ml-1 italic text-gray-500">
                                        ({item.remarks})
                                      </span>
                                    )}
                                  </li>
                                ),
                              )}
                            </ul>
                            {m.inspection.photos &&
                              m.inspection.photos.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {m.inspection.photos.map(
                                    (photoUrl: string, photoIdx: number) => (
                                      <Image
                                        key={photoIdx}
                                        src={photoUrl}
                                        alt={`Inspection photo ${photoIdx + 1}`}
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 rounded-md object-cover shadow-sm"
                                      />
                                    ),
                                  )}
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                            Belum diinspeksi
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/maintenances/edit/${m.id}`}
                            className="flex w-20 items-center justify-center rounded-lg bg-blue-200 px-1.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-blue-300"
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
                            Edit Detail
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

      {/* Engineer Selection Modal */}
      {showEngineerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Kelola Engineer</h3>
              <button
                onClick={closeEngineerModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cari Engineer
              </label>
              <input
                type="text"
                placeholder="Ketik nama engineer..."
                value={searchEngineer}
                onChange={(e) => setSearchEngineer(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {filteredEngineers.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto rounded border border-gray-200">
                {filteredEngineers.map((engineer) => (
                  <div
                    key={engineer.id}
                    className="cursor-pointer border-b border-gray-100 px-4 py-2 hover:bg-gray-50"
                    onClick={() => addEngineer(engineer.id)}
                  >
                    {engineer.name}
                  </div>
                ))}
              </div>
            )}

            {selectedEngineers.length > 0 && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Engineer Terpilih
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedEngineers.map((id) => {
                    const engineer = allEngineers.find((e) => e.id === id);
                    return (
                      <div
                        key={id}
                        className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {engineer?.name || id}
                        <button
                          onClick={() => removeEngineer(id)}
                          className="ml-1.5 rounded-full p-0.5 text-blue-800 hover:bg-blue-200"
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
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeEngineerModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={saveEngineers}
                disabled={actionLoading === selectedMaintenanceId}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === selectedMaintenanceId
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
