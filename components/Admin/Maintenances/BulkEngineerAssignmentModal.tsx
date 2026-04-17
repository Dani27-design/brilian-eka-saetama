"use client";

import { useState, useEffect, useMemo } from "react";
import Modal from "../Modal";
import { MaintenanceTableRow } from "@/utils/maintenanceDataLoader";

export type AssignmentMode = "replace" | "add" | "remove";

interface Engineer {
  id: string;
  name: string;
}

interface BulkEngineerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMaintenances: MaintenanceTableRow[];
  onAssign: (engineerIds: string[], mode: AssignmentMode) => Promise<void>;
  availableEngineers: Engineer[];
  loading?: boolean;
}

export default function BulkEngineerAssignmentModal({
  isOpen,
  onClose,
  selectedMaintenances,
  onAssign,
  availableEngineers,
  loading = false
}: BulkEngineerAssignmentModalProps) {
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("replace");
  const [searchEngineer, setSearchEngineer] = useState("");
  const [showEngineerDropdown, setShowEngineerDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSingleMode = selectedMaintenances.length === 1;

  useEffect(() => {
    if (isOpen) {
      setSelectedEngineers([]);
      setAssignmentMode("replace");
      setSearchEngineer("");
      setShowEngineerDropdown(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validationResult = useMemo(() => {
    const canModify = selectedMaintenances.filter(m => !m.hasInspection);
    const cannotModify = selectedMaintenances.filter(m => m.hasInspection);
    return {
      canModify,
      cannotModify,
      hasValidMaintenances: canModify.length > 0,
      hasInvalidMaintenances: cannotModify.length > 0
    };
  }, [selectedMaintenances]);

  // Engineers currently assigned to the selected maintenances
  const currentlyAssignedEngineers = useMemo(() => {
    const engineerMap = new Map<string, string>();
    for (const m of selectedMaintenances) {
      for (const eng of m.engineers) {
        engineerMap.set(eng.id, eng.name);
      }
    }
    return Array.from(engineerMap, ([id, name]) => ({ id, name }));
  }, [selectedMaintenances]);

  const currentlyAssignedIds = useMemo(
    () => new Set(currentlyAssignedEngineers.map(e => e.id)),
    [currentlyAssignedEngineers]
  );

  // Context-aware engineer list based on mode:
  // - "remove": only show currently assigned engineers
  // - "add": only show engineers NOT already assigned
  // - "replace": show all available engineers
  const contextualEngineers = useMemo(() => {
    if (assignmentMode === "remove") {
      return currentlyAssignedEngineers;
    }
    if (assignmentMode === "add") {
      return availableEngineers.filter(e => !currentlyAssignedIds.has(e.id));
    }
    return availableEngineers;
  }, [assignmentMode, availableEngineers, currentlyAssignedEngineers, currentlyAssignedIds]);

  // Filter by search, excluding already-picked
  const filteredEngineers = useMemo(() => {
    return contextualEngineers.filter(engineer =>
      engineer.name.toLowerCase().includes(searchEngineer.toLowerCase()) &&
      !selectedEngineers.includes(engineer.id)
    );
  }, [contextualEngineers, searchEngineer, selectedEngineers]);

  const displaySelectedEngineers = useMemo(() => {
    return selectedEngineers.map(id => {
      const engineer = availableEngineers.find(e => e.id === id) ||
        currentlyAssignedEngineers.find(e => e.id === id);
      return { id, name: engineer?.name || id };
    });
  }, [selectedEngineers, availableEngineers, currentlyAssignedEngineers]);

  // Clear selected engineers when mode changes (they may no longer be valid)
  useEffect(() => {
    setSelectedEngineers([]);
    setSearchEngineer("");
  }, [assignmentMode]);

  const addEngineer = (engineerId: string) => {
    if (!selectedEngineers.includes(engineerId)) {
      setSelectedEngineers([...selectedEngineers, engineerId]);
    }
    setSearchEngineer("");
    setShowEngineerDropdown(false);
  };

  const removeEngineer = (engineerId: string) => {
    setSelectedEngineers(selectedEngineers.filter(id => id !== engineerId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult.hasValidMaintenances) return;
    if (assignmentMode !== "remove" && selectedEngineers.length === 0) return;

    setIsSubmitting(true);
    try {
      await onAssign(selectedEngineers, assignmentMode);
      onClose();
    } catch (error) {
      console.error("Error in engineer assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = validationResult.hasValidMaintenances &&
    (assignmentMode === "remove" || selectedEngineers.length > 0) &&
    !isSubmitting;

  const modalTitle = isSingleMode
    ? `Tugaskan Teknisi — ${selectedMaintenances[0]?.contractNumber || ""}`
    : `Tugaskan Teknisi — ${selectedMaintenances.length} Maintenance`;

  const getModeHint = () => {
    switch (assignmentMode) {
      case "replace":
        return `Menampilkan semua ${availableEngineers.length} teknisi`;
      case "add": {
        const count = contextualEngineers.length;
        return count === 0
          ? "Semua teknisi sudah ditugaskan"
          : `Menampilkan ${count} teknisi yang belum ditugaskan`;
      }
      case "remove": {
        const count = currentlyAssignedEngineers.length;
        return count === 0
          ? "Tidak ada teknisi yang ditugaskan"
          : `Menampilkan ${count} teknisi yang saat ini ditugaskan`;
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Validation Warnings */}
        {validationResult.hasInvalidMaintenances && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-orange-800">
                  {validationResult.cannotModify.length} maintenance sudah memiliki inspeksi
                </p>
                <p className="mt-0.5 text-orange-700">
                  Hanya {validationResult.canModify.length} maintenance yang akan diupdate.
                </p>
              </div>
            </div>
          </div>
        )}

        {!validationResult.hasValidMaintenances && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-red-800">Tidak dapat mengubah assignment</p>
                <p className="mt-0.5 text-red-700">Semua maintenance yang dipilih sudah memiliki data inspeksi.</p>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Info */}
        {isSingleMode && selectedMaintenances[0] && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Informasi Maintenance</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Kontrak</span>
                <span className="font-medium text-gray-700">{selectedMaintenances[0].contractNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Produk</span>
                <span className="font-medium text-gray-700">{selectedMaintenances[0].productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">No. Produk</span>
                <span className="font-medium text-gray-700">{selectedMaintenances[0].productNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tipe</span>
                <span className="inline-flex rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">{selectedMaintenances[0].productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  selectedMaintenances[0].status === "approved" ? "bg-green-100 text-green-800" :
                  selectedMaintenances[0].status === "rejected" ? "bg-red-100 text-red-800" :
                  selectedMaintenances[0].status === "scheduled" ? "bg-blue-100 text-blue-800" :
                  selectedMaintenances[0].status === "waiting_approval" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {selectedMaintenances[0].status === "pending" ? "Tertunda" :
                   selectedMaintenances[0].status === "scheduled" ? "Dijadwalkan" :
                   selectedMaintenances[0].status === "waiting_approval" ? "Menunggu Persetujuan" :
                   selectedMaintenances[0].status === "approved" ? "Disetujui" :
                   selectedMaintenances[0].status === "rejected" ? "Ditolak" :
                   selectedMaintenances[0].status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Currently Assigned Engineers (context) */}
        {currentlyAssignedEngineers.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-xs font-medium text-gray-500">Teknisi saat ini:</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {currentlyAssignedEngineers.map(eng => (
                <span key={eng.id} className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 border border-gray-200">
                  {eng.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Left: Assignment Mode */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Mode Assignment
            </label>
            <div className="space-y-2">
              {[
                { value: "replace" as AssignmentMode, label: "Ganti Semua", desc: "Ganti semua teknisi dengan pilihan baru" },
                { value: "add" as AssignmentMode, label: "Tambahkan", desc: "Tambah teknisi baru ke yang sudah ada" },
                { value: "remove" as AssignmentMode, label: "Hapus Terpilih", desc: "Hapus teknisi tertentu dari assignment" },
              ].map((mode) => (
                <label
                  key={mode.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    assignmentMode === mode.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="assignmentMode"
                    value={mode.value}
                    checked={assignmentMode === mode.value}
                    onChange={(e) => setAssignmentMode(e.target.value as AssignmentMode)}
                    className="mt-0.5 border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{mode.label}</div>
                    <div className="text-xs text-gray-500">{mode.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Right: Engineer Selection */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                {assignmentMode === "remove" ? "Pilih Teknisi untuk Dihapus" : "Pilih Teknisi"}
              </label>
            </div>

            {/* Hint */}
            <p className="mb-2 text-xs text-gray-400">{getModeHint()}</p>

            {contextualEngineers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-2 text-xs text-gray-400">
                  {assignmentMode === "remove"
                    ? "Tidak ada teknisi yang ditugaskan untuk dihapus"
                    : "Semua teknisi sudah ditugaskan"}
                </p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Cari teknisi..."
                    value={searchEngineer}
                    onChange={(e) => {
                      setSearchEngineer(e.target.value);
                      setShowEngineerDropdown(true);
                    }}
                    onFocus={() => setShowEngineerDropdown(true)}
                    className="h-10 w-full rounded-lg border border-stroke bg-transparent px-4 pl-10 text-sm outline-none focus:border-primary"
                  />
                  <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {showEngineerDropdown && filteredEngineers.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {filteredEngineers.map((engineer) => (
                        <div
                          key={engineer.id}
                          className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-blue-50"
                          onClick={() => addEngineer(engineer.id)}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {engineer.name.charAt(0).toUpperCase()}
                          </div>
                          {engineer.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Engineers */}
                {displaySelectedEngineers.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-xs text-gray-500">{displaySelectedEngineers.length} teknisi dipilih:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {displaySelectedEngineers.map((engineer) => (
                        <span
                          key={engineer.id}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            assignmentMode === "remove"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {engineer.name}
                          <button
                            type="button"
                            onClick={() => removeEngineer(engineer.id)}
                            className={`ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                              assignmentMode === "remove"
                                ? "bg-red-200 text-red-600 hover:bg-red-300"
                                : "bg-blue-200 text-blue-600 hover:bg-blue-300"
                            }`}
                          >
                            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                    <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="mt-2 text-xs text-gray-400">Cari dan pilih teknisi di atas</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary — compact */}
        {!isSingleMode && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600">
              <span>Total: <b>{selectedMaintenances.length}</b> maintenance</span>
              <span>Akan diupdate: <b>{validationResult.canModify.length}</b></span>
              {validationResult.hasInvalidMaintenances && (
                <span className="text-orange-600">Dilewati: <b>{validationResult.cannotModify.length}</b></span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {isSubmitting ? "Memproses..." : "Tugaskan Teknisi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
