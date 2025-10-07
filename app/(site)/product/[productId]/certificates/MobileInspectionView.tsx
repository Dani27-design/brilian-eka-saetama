"use client";

import { useState } from "react";
import { PublicCertificateData } from "./PublicCertificatesClient";
import { MobileInspectionChecklist } from "./MobileInspectionChecklist";
import { MobilePhotoGallery } from "./MobilePhotoGallery";
import { MobileInspectionSummary } from "./MobileInspectionSummary";

interface MobileInspectionViewProps {
  certificate: PublicCertificateData;
  downloadUrl: string;
}

export function MobileInspectionView({
  certificate,
  downloadUrl,
}: MobileInspectionViewProps) {
  const [activeSection, setActiveSection] = useState<
    "summary" | "checklist" | "photos" | "details"
  >("summary");

  // Extract inspection data from raw maintenance data
  const inspectionData = certificate.rawMaintenanceData?.inspection;
  const checklist = inspectionData?.checklist || [];
  const photos = inspectionData?.photos || [];
  const productType = certificate.rawMaintenanceData?.productType;

  return (
    <div className="p-4">
      {/* Certificate Header */}
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          {certificate.certificateNumber}
        </h3>
        <div className="mb-3 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
          ✓ {certificate.status.toUpperCase()}
        </div>
        <p className="text-sm text-gray-600">
          Inspection completed on {certificate.inspectionDate}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          {[
            {
              id: "summary",
              label: "Summary",
              icon: (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              ),
            },
            {
              id: "checklist",
              label: "Checklist",
              icon: (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
            {
              id: "photos",
              label: `Photos (${photos.length})`,
              icon: (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              ),
            },
            {
              id: "details",
              label: "Details",
              icon: (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex flex-1 flex-col items-center rounded-md px-2 py-3 text-xs font-medium transition-colors ${
                activeSection === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="mb-1">{tab.icon}</div>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="min-h-[400px]">
        {activeSection === "summary" && (
          <MobileInspectionSummary
            certificate={certificate}
            checklist={checklist}
            productType={productType}
          />
        )}

        {activeSection === "checklist" && (
          <MobileInspectionChecklist
            checklist={checklist}
            productType={productType}
          />
        )}

        {activeSection === "photos" && (
          <MobilePhotoGallery
            photos={photos}
            certificateNumber={certificate.certificateNumber}
          />
        )}

        {activeSection === "details" && (
          <MobileInspectionDetails certificate={certificate} />
        )}
      </div>

      {/* Download Button - Always Visible */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <a
          href={downloadUrl}
          download={`${certificate.certificateNumber}.pdf`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Official Certificate
        </a>
        <p className="mt-2 text-center text-xs text-gray-500">
          Official PDF certificate for your records
        </p>
      </div>
    </div>
  );
}

// Mobile Inspection Details Component
function MobileInspectionDetails({
  certificate,
}: {
  certificate: PublicCertificateData;
}) {
  return (
    <div className="space-y-4">
      {/* Basic Certificate Info */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="mb-3 flex items-center font-semibold text-gray-900">
          <svg
            className="mr-2 h-5 w-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Certificate Information
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Issue Date:</span>
            <span className="font-medium">{certificate.issueDate}</span>
          </div>
          {certificate.validUntil && (
            <div className="flex justify-between">
              <span className="text-gray-600">Valid Until:</span>
              <span className="font-medium">{certificate.validUntil}</span>
            </div>
          )}
          <div className="flex items-start justify-between">
            <span className="text-gray-600">Engineers:</span>
            <span className="text-right font-medium">
              {certificate.engineerNames.join(", ")}
            </span>
          </div>
          {certificate.resolvedApproverName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Approved By:</span>
              <span className="font-medium">
                {certificate.resolvedApproverName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="mb-3 flex items-center font-semibold text-gray-900">
          <svg
            className="mr-2 h-5 w-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Product Information
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Product Number:</span>
            <span className="font-medium">
              {certificate.productInfo.productNumber}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Product Name:</span>
            <span className="font-medium">
              {certificate.productInfo.productName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium">
              {certificate.productInfo.productType}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Brand:</span>
            <span className="font-medium">{certificate.productInfo.brand}</span>
          </div>
          {certificate.productInfo.location && (
            <div className="flex items-start justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="text-right font-medium">
                {certificate.productInfo.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Inspection Results Summary */}
      <div className="rounded-lg bg-green-50 p-4">
        <h4 className="mb-3 flex items-center font-semibold text-gray-900">
          <svg
            className="mr-2 h-5 w-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Inspection Results
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Items:</span>
            <span className="font-medium">
              {certificate.checklistSummary.totalItems}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Passed:</span>
            <span className="font-medium text-green-600">
              {certificate.checklistSummary.passedItems}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Failed:</span>
            <span className="font-medium text-red-600">
              {certificate.checklistSummary.failedItems}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pass Rate:</span>
            <span className="font-bold text-green-600">
              {certificate.checklistSummary.passRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
