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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedEngineers([]);
      setAssignmentMode("replace");
      setSearchEngineer("");
      setShowEngineerDropdown(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Validation: Check which maintenances can be modified
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

  // Filter engineers based on search input
  const filteredEngineers = useMemo(() => {
    return availableEngineers.filter(engineer =>
      engineer.name.toLowerCase().includes(searchEngineer.toLowerCase()) &&
      !selectedEngineers.includes(engineer.id)
    );
  }, [availableEngineers, searchEngineer, selectedEngineers]);

  // Get selected engineers with their names
  const displaySelectedEngineers = useMemo(() => {
    return selectedEngineers.map(id => {
      const engineer = availableEngineers.find(e => e.id === id);
      return {
        id,
        name: engineer?.name || id
      };
    });
  }, [selectedEngineers, availableEngineers]);

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
    
    if (!validationResult.hasValidMaintenances) {
      return;
    }

    // For remove mode, allow empty selection to remove all engineers
    if (assignmentMode !== "remove" && selectedEngineers.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(selectedEngineers, assignmentMode);
      onClose();
    } catch (error) {
      console.error("Error in bulk engineer assignment:", error);
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssignmentModeDescription = () => {
    switch (assignmentMode) {
      case "replace":
        return "Mengganti semua teknisi yang ada dengan teknisi yang dipilih";
      case "add":
        return "Menambahkan teknisi yang dipilih ke assignment yang sudah ada";
      case "remove":
        return "Menghapus teknisi yang dipilih dari assignment yang ada";
      default:
        return "";
    }
  };

  const canSubmit = validationResult.hasValidMaintenances && 
    (assignmentMode === "remove" || selectedEngineers.length > 0) &&
    !isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Engineers - ${selectedMaintenances.length} Maintenance`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Validation Warning */}
        {validationResult.hasInvalidMaintenances && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start">
              <svg className="mt-0.5 h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-orange-800">
                  Beberapa maintenance tidak dapat dimodifikasi
                </h4>
                <p className="mt-1 text-sm text-orange-700">
                  {validationResult.cannotModify.length} maintenance sudah memiliki data inspeksi dan tidak dapat diubah assignmentnya.
                  Hanya {validationResult.canModify.length} maintenance yang akan diupdate.
                </p>
              </div>
            </div>
          </div>
        )}

        {!validationResult.hasValidMaintenances && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start">
              <svg className="mt-0.5 h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  Tidak ada maintenance yang dapat dimodifikasi
                </h4>
                <p className="mt-1 text-sm text-red-700">
                  Semua maintenance yang dipilih sudah memiliki data inspeksi dan tidak dapat diubah.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Mode Assignment
          </label>
          <div className="space-y-3">
            {[
              { value: "replace", label: "Replace All", description: "Ganti semua teknisi" },
              { value: "add", label: "Add to Existing", description: "Tambah ke existing" },
              { value: "remove", label: "Remove Selected", description: "Hapus yang dipilih" }
            ].map((mode) => (
              <label key={mode.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="assignmentMode"
                  value={mode.value}
                  checked={assignmentMode === mode.value}
                  onChange={(e) => setAssignmentMode(e.target.value as AssignmentMode)}
                  className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {mode.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {mode.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600">
            {getAssignmentModeDescription()}
          </p>
        </div>

        {/* Engineer Selection */}
        {assignmentMode !== "remove" || selectedEngineers.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {assignmentMode === "remove" ? "Teknisi yang akan dihapus" : "Pilih Teknisi"}
            </label>
            
            {/* Search Input */}
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
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              />
              
              {/* Dropdown */}
              {showEngineerDropdown && filteredEngineers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {filteredEngineers.map((engineer) => (
                    <div
                      key={engineer.id}
                      className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                      onClick={() => addEngineer(engineer.id)}
                    >
                      {engineer.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Engineers */}
            {displaySelectedEngineers.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Teknisi yang dipilih:
                </label>
                <div className="flex flex-wrap gap-2">
                  {displaySelectedEngineers.map((engineer) => (
                    <span
                      key={engineer.id}
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                    >
                      {engineer.name}
                      <button
                        type="button"
                        onClick={() => removeEngineer(engineer.id)}
                        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Summary */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Ringkasan Perubahan
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Total maintenance dipilih: {selectedMaintenances.length}</p>
            <p>• Maintenance yang akan diupdate: {validationResult.canModify.length}</p>
            <p>• Maintenance yang tidak dapat diubah: {validationResult.cannotModify.length}</p>
            <p>• Mode assignment: {assignmentMode}</p>
            {assignmentMode !== "remove" && (
              <p>• Teknisi yang akan di-assign: {selectedEngineers.length}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isSubmitting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            )}
            {isSubmitting ? "Processing..." : "Assign Engineers"}
          </button>
        </div>
      </form>
    </Modal>
  );
}