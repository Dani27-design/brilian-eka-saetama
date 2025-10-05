"use client";

import { useState, useEffect } from "react";

interface CertificateData {
  certificateNumber: string;
  issueDate: string;
  validUntil?: string;
  inspectionDate: string;
  engineerNames: string[];
  status: "approved";
  checklistSummary: {
    totalItems: number;
    passedItems: number;
    failedItems: number;
    passRate: number;
  };
  productInfo: {
    productNumber: string;
    productName: string;
    productType: string;
    brand: string;
    location: string;
  };
  downloadUrl: string;
}

interface CertificatePreviewProps {
  certificate: CertificateData;
  companyInfo?: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function CertificatePreview({ certificate, companyInfo }: CertificatePreviewProps) {
  const [checklistDetails, setChecklistDetails] = useState<any[]>([]);

  // Default company info if not provided
  const defaultCompanyInfo = {
    companyName: "PT Brilian Eka Saetama",
    address: "Jakarta, Indonesia",
    phone: "+62-XXX-XXXX-XXXX",
    email: "info@brilianeka.com"
  };

  const company = companyInfo || defaultCompanyInfo;

  // Generate sample checklist details for preview
  useEffect(() => {
    const generateSampleChecklist = () => {
      const items = [];
      const itemNames = {
        APAR: ["Hose", "Pressure", "Handle", "Body", "Safety Pin", "Exp Date"],
        HYDRANT: ["Height", "Width", "Flow Rate", "Pressure", "Valve Type", "Hose Length"],
        CCTV: ["Resolution", "Lens", "Night Vision", "Power", "Connectivity", "Storage"],
        FIRE_ALARM: ["Sensor Type", "Power", "Coverage Area", "Sound Level", "Battery Backup"],
        ACCESS_DOOR: ["Material", "Lock Type", "Width", "Height", "Opening Speed"],
        PATROL_GUARD: ["Device Type", "Battery Life", "Connectivity", "Patrol Interval"]
      };

      const productType = certificate.productInfo.productType as keyof typeof itemNames;
      const typeItems = itemNames[productType] || itemNames.APAR;

      for (let i = 0; i < certificate.checklistSummary.totalItems; i++) {
        const isPass = i < certificate.checklistSummary.passedItems;
        items.push({
          item: typeItems[i % typeItems.length] || `Item ${i + 1}`,
          status: isPass,
          remarks: isPass ? "Good condition" : "Needs attention"
        });
      }
      setChecklistDetails(items);
    };

    generateSampleChecklist();
  }, [certificate]);

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 90) return "text-green-600";
    if (passRate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Certificate Frame */}
      <div className="bg-white border-2 border-gray-200" style={{ aspectRatio: "210/297" }}>
        <div className="p-4 sm:p-8 h-full flex flex-col text-xs sm:text-sm">
          {/* Header with Logo and Company Info */}
          <div className="flex items-start justify-between border-b-2 border-red-600 pb-2 sm:pb-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Logo Placeholder */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                LOGO
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-lg text-gray-900">{company.companyName}</h1>
                <p className="text-xs text-gray-600 hidden sm:block">{company.address}</p>
                <p className="text-xs text-gray-600 hidden sm:block">{company.phone} • {company.email}</p>
              </div>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-4 sm:mb-6 bg-blue-50 py-2 sm:py-4 rounded-lg border">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">CERTIFICATE OF INSPECTION</h2>
            <p className="text-xs sm:text-sm text-gray-600">Fire Safety Equipment — {certificate.productInfo.productType}</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-1 sm:mt-2">Certificate No: {certificate.certificateNumber}</p>
          </div>

          {/* Information Grid */}
          <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6 flex-1">
            {/* Contract Information */}
            <div className="bg-gray-50 p-2 sm:p-3 rounded border">
              <h3 className="font-bold text-red-600 text-xs sm:text-sm mb-1 sm:mb-2">CONTRACT INFORMATION</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-1 text-xs">
                <div><span className="font-semibold">Issue Date:</span> {new Date(certificate.issueDate).toLocaleDateString()}</div>
                <div><span className="font-semibold">Customer:</span> General Customer</div>
                {certificate.validUntil && (
                  <div><span className="font-semibold">Valid Until:</span> {new Date(certificate.validUntil).toLocaleDateString()}</div>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-gray-50 p-2 sm:p-3 rounded border">
              <h3 className="font-bold text-red-600 text-xs sm:text-sm mb-1 sm:mb-2">PRODUCT INFORMATION</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-1 text-xs">
                <div><span className="font-semibold">Product No:</span> {certificate.productInfo.productNumber}</div>
                <div><span className="font-semibold">Product Name:</span> {certificate.productInfo.productName}</div>
                <div><span className="font-semibold">Brand:</span> {certificate.productInfo.brand}</div>
                <div><span className="font-semibold">Location:</span> {certificate.productInfo.location}</div>
              </div>
            </div>

            {/* Inspection Details */}
            <div className="bg-gray-50 p-2 sm:p-3 rounded border">
              <h3 className="font-bold text-red-600 text-xs sm:text-sm mb-1 sm:mb-2">INSPECTION DETAILS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-1 text-xs">
                <div><span className="font-semibold">Inspection Date:</span> {new Date(certificate.inspectionDate).toLocaleDateString()}</div>
                <div><span className="font-semibold">Inspector:</span> {certificate.engineerNames.join(", ") || "Inspector"}</div>
                <div><span className="font-semibold">Total Items:</span> {certificate.checklistSummary.totalItems}</div>
                <div>
                  <span className="font-semibold">Pass Rate:</span> 
                  <span className={`ml-1 font-bold ${getPassRateColor(certificate.checklistSummary.passRate)}`}>
                    {certificate.checklistSummary.passRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Inspection Results Table */}
            <div>
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-2 sm:mb-3">Detailed Inspection Results</h3>
              <div className="border rounded overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border-b px-1 sm:px-2 py-1 sm:py-2 text-left w-8">No.</th>
                      <th className="border-b px-1 sm:px-2 py-1 sm:py-2 text-left">Inspection Item</th>
                      <th className="border-b px-1 sm:px-2 py-1 sm:py-2 text-center w-12 sm:w-16">Status</th>
                      <th className="border-b px-1 sm:px-2 py-1 sm:py-2 text-left w-20 sm:w-24 hidden sm:table-cell">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklistDetails.slice(0, 6).map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-25"}>
                        <td className="border-b px-1 sm:px-2 py-1 text-center">{index + 1}</td>
                        <td className="border-b px-1 sm:px-2 py-1">{item.item}</td>
                        <td className="border-b px-1 sm:px-2 py-1 text-center">
                          <span className={`font-bold text-xs ${item.status ? "text-green-600" : "text-red-600"}`}>
                            {item.status ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td className="border-b px-1 sm:px-2 py-1 text-xs hidden sm:table-cell">{item.remarks}</td>
                      </tr>
                    ))}
                    {checklistDetails.length > 6 && (
                      <tr>
                        <td colSpan={4} className="text-center py-2 text-gray-500 italic text-xs">
                          ... and {checklistDetails.length - 6} more items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Digital Signatures */}
          <div className="mt-auto">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-2 sm:mb-4">Digital Signatures</h3>
            <div className="flex justify-between space-x-4">
              <div className="text-center flex-1">
                <div className="font-semibold text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Inspected By</div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 mb-1 sm:mb-2 mx-auto">
                  QR
                </div>
                <div className="text-xs text-gray-600">{certificate.engineerNames[0] || "Inspector"}</div>
                <div className="text-xs text-gray-500 hidden sm:block">{new Date(certificate.inspectionDate).toLocaleDateString()}</div>
              </div>
              <div className="text-center flex-1">
                <div className="font-semibold text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Approved By</div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 mb-1 sm:mb-2 mx-auto">
                  QR
                </div>
                <div className="text-xs text-gray-600">Certificate Authority</div>
                <div className="text-xs text-gray-500 hidden sm:block">{new Date(certificate.inspectionDate).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="text-center mt-2 sm:mt-4">
              <p className="text-xs text-gray-500">
                This certificate is digitally signed. Scan QR codes to verify authenticity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}