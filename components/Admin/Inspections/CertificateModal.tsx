"use client";

import { useState, memo } from "react";
import { getDoc, doc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import Modal from "@/components/Admin/Modal";
import { Maintenance } from "@/types/maintenances";
import {
  createCertificateData,
  generateMergedPDFCertificates,
  CertificateData as PDFCertificateData,
} from "@/utils/pdfCertificate";
import {
  convertToCertificateData,
  generateMergedWordCertificates,
  generateWordCertificateHTML,
  downloadWordCertificate,
  CertificateData as WordCertificateData,
} from "@/utils/wordCertificate";

interface CertificateInspectionRow {
  id: string;
  status: string;
  engineerNames: string[];
  location: string;
  maintenance: Maintenance;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredInspections: CertificateInspectionRow[];
  fetchInspectionsForExport: (startDate?: Date, endDate?: Date) => Promise<CertificateInspectionRow[]>;
  user: any;
  onError: (message: string) => void;
  onSetExportLoading: (loading: boolean) => void;
  onSetExportProgress: (progress: string) => void;
  exportLoading: boolean;
}

function CertificateModal({
  isOpen,
  onClose,
  filteredInspections,
  fetchInspectionsForExport,
  user,
  onError,
  onSetExportLoading,
  onSetExportProgress,
  exportLoading,
}: CertificateModalProps) {
  const [certificateFormat, setCertificateFormat] = useState<"pdf" | "doc">("pdf");
  const [certificateDateFrom, setCertificateDateFrom] = useState("");
  const [certificateDateTo, setCertificateDateTo] = useState("");

  const handleModalCertificateExport = async () => {
    onClose();
    onSetExportLoading(true);
    onSetExportProgress("Memulai pembuatan sertifikat...");

    try {
      let dataToExport: CertificateInspectionRow[];

      if (certificateDateFrom || certificateDateTo) {
        const startDate = certificateDateFrom ? new Date(certificateDateFrom) : undefined;
        const endDate = certificateDateTo ? new Date(certificateDateTo + "T23:59:59") : undefined;
        onSetExportProgress("Mengambil data dari database...");
        dataToExport = await fetchInspectionsForExport(startDate, endDate);
      } else {
        dataToExport = filteredInspections;
      }

      const approvedInspections = dataToExport.filter((i) => i.status === "approved");

      if (approvedInspections.length === 0) {
        onError("Tidak ada inspeksi yang disetujui untuk dibuat sertifikat dalam rentang tanggal yang dipilih");
        return;
      }

      onSetExportProgress(`Membuat sertifikat untuk ${approvedInspections.length} inspeksi...`);

      if (certificateFormat === "doc") {
        const certificatesData: WordCertificateData[] = [];

        for (let i = 0; i < approvedInspections.length; i++) {
          const inspection = approvedInspections[i];
          try {
            onSetExportProgress(`Memproses sertifikat ${i + 1} dari ${approvedInspections.length}...`);

            const maintenanceSnap = await getDoc(doc(firestore, "maintenances", inspection.id));
            if (!maintenanceSnap.exists()) continue;
            const maintenanceData = maintenanceSnap.data() as Maintenance;

            let contractData: any = {};
            if (maintenanceData.contract) {
              const contractSnap = await getDoc(maintenanceData.contract);
              if (contractSnap.exists()) {
                contractData = contractSnap.data();
                if (contractData.customer) {
                  const customerSnap = await getDoc(contractData.customer);
                  if (customerSnap.exists()) contractData.customerData = customerSnap.data();
                }
              }
            }

            let productData: any = {};
            if (maintenanceData.product) {
              const productSnap = await getDoc(maintenanceData.product);
              if (productSnap.exists()) productData = productSnap.data();
            }

            certificatesData.push(convertToCertificateData(inspection as any, contractData, productData, maintenanceData));
          } catch (error) {
            console.error(`Error processing certificate ${i + 1}:`, error instanceof Error ? error.message : "Unknown error");
          }
        }

        if (certificatesData.length === 0) {
          onError("Tidak dapat membuat sertifikat Word - data tidak lengkap");
          return;
        }

        onSetExportProgress("Membuat dokumen Word...");
        const today = new Date().toISOString().split("T")[0];
        let filename = `certificates_${today}`;
        if (certificateDateFrom && certificateDateTo) filename += `_${certificateDateFrom}_to_${certificateDateTo}`;

        if (certificatesData.length === 1) {
          const htmlContent = generateWordCertificateHTML(certificatesData[0]);
          downloadWordCertificate(htmlContent, filename);
        } else {
          generateMergedWordCertificates(certificatesData, filename);
        }
        onSetExportProgress("Sertifikat Word berhasil diunduh!");
      } else {
        const certificatesData: PDFCertificateData[] = [];
        const approverName = user?.name || user?.email || "Administrator";

        for (let i = 0; i < approvedInspections.length; i++) {
          const inspection = approvedInspections[i];
          try {
            onSetExportProgress(`Memproses sertifikat PDF ${i + 1} dari ${approvedInspections.length}...`);

            const maintenanceSnap = await getDoc(doc(firestore, "maintenances", inspection.id));
            if (!maintenanceSnap.exists()) continue;
            const maintenanceData = maintenanceSnap.data() as Maintenance;

            let contractData: any = {};
            if (maintenanceData.contract) {
              const contractSnap = await getDoc(maintenanceData.contract);
              if (contractSnap.exists()) {
                contractData = contractSnap.data();
                if (contractData.customer) {
                  const customerSnap = await getDoc(contractData.customer);
                  if (customerSnap.exists()) contractData.customerData = customerSnap.data();
                }
              }
            }

            let productData: any = {};
            if (maintenanceData.product) {
              const productSnap = await getDoc(maintenanceData.product);
              if (productSnap.exists()) productData = productSnap.data();
            }

            certificatesData.push(
              createCertificateData(maintenanceData, contractData, productData, inspection.engineerNames, approverName, inspection.location)
            );
          } catch (error) {
            console.error(`Error processing certificate ${i + 1}:`, error instanceof Error ? error.message : "Unknown error");
          }
        }

        if (certificatesData.length === 0) {
          onError("Tidak dapat membuat sertifikat PDF - data tidak lengkap");
          return;
        }

        onSetExportProgress("Membuat sertifikat PDF...");
        const today = new Date().toISOString().split("T")[0];
        let filename = `certificates_${today}`;
        if (certificateDateFrom && certificateDateTo) filename += `_${certificateDateFrom}_to_${certificateDateTo}`;

        const firstInspection = approvedInspections[0];
        const firstMaintenanceSnap = await getDoc(doc(firestore, "maintenances", firstInspection.id));
        const firstMaintenanceData = firstMaintenanceSnap.exists() ? (firstMaintenanceSnap.data() as Maintenance) : null;
        const inspectorId = firstMaintenanceData?.inspection?.createdBy?.id || "unknown";
        const approverId = user?.uid || "unknown";

        await generateMergedPDFCertificates(certificatesData, inspectorId, approverId, filename);
        onSetExportProgress("Sertifikat PDF berhasil diunduh!");
      }
    } catch (error: any) {
      console.error("Certificate export error:", error instanceof Error ? error.message : "Unknown error");
      onError(error.message || "Gagal membuat sertifikat");
    } finally {
      onSetExportLoading(false);
      onSetExportProgress("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Sertifikat Inspeksi">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Pilih format file dan rentang tanggal untuk mengekspor sertifikat inspeksi yang disetujui.
        </p>

        <div className="rounded-lg border border-gray-200 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Format Sertifikat</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="radio" value="pdf" checked={certificateFormat === "pdf"}
                onChange={(e) => setCertificateFormat(e.target.value as "pdf" | "doc")}
                className="mr-2 h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm">PDF (.pdf) - Format standar untuk sertifikat</span>
            </label>
            <label className="flex items-center">
              <input type="radio" value="doc" checked={certificateFormat === "doc"}
                onChange={(e) => setCertificateFormat(e.target.value as "pdf" | "doc")}
                className="mr-2 h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm">Word (.doc) - Dapat diedit dan dimodifikasi</span>
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Dari Tanggal</label>
              <input type="date" value={certificateDateFrom}
                onChange={(e) => setCertificateDateFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
                max={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Sampai Tanggal</label>
              <input type="date" value={certificateDateTo}
                onChange={(e) => setCertificateDateTo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
                max={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Kosongkan untuk mengekspor semua sertifikat inspeksi yang disetujui</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h4 className="font-medium text-amber-900">Informasi Export</h4>
              <p className="mt-1 text-sm text-amber-700">
                Hanya inspeksi dengan status <strong>"Disetujui"</strong> yang akan dibuatkan sertifikat.
                Jika lebih dari 1 sertifikat ditemukan, akan digabung menjadi satu file.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleModalCertificateExport} disabled={exportLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              certificateFormat === "pdf" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50`}>
            {exportLoading ? "Generating..." : certificateFormat === "pdf" ? "Export PDF" : "Export Word"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(CertificateModal);
