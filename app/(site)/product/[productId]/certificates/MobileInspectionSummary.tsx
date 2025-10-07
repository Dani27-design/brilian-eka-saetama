"use client";

import { PublicCertificateData } from "./PublicCertificatesClient";

interface MobileInspectionSummaryProps {
  certificate: PublicCertificateData;
  checklist: any[];
  productType: string;
}

export function MobileInspectionSummary({ certificate, checklist, productType }: MobileInspectionSummaryProps) {
  const { checklistSummary } = certificate;
  const passRate = checklistSummary.passRate;
  
  // Get product type icon and color
  const getProductTypeDisplay = (type: string) => {
    const displays = {
      'APAR': { 
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        ), 
        color: 'bg-red-100 text-red-800', 
        name: 'Fire Extinguisher' 
      },
      'HYDRANT': { 
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3m0 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h4m10 0h4a2 2 0 012 2v4a2 2 0 01-2 2h-4m0-18V3" />
          </svg>
        ), 
        color: 'bg-blue-100 text-blue-800', 
        name: 'Hydrant' 
      },
      'CCTV': { 
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ), 
        color: 'bg-purple-100 text-purple-800', 
        name: 'CCTV Camera' 
      },
      'FIRE_ALARM': { 
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ), 
        color: 'bg-orange-100 text-orange-800', 
        name: 'Fire Alarm' 
      },
      'ACCESS_DOOR': { 
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        ), 
        color: 'bg-green-100 text-green-800', 
        name: 'Access Door' 
      },
      'PATROL_GUARD': { 
        icon: (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ), 
        color: 'bg-gray-100 text-gray-800', 
        name: 'Patrol System' 
      },
    };
    return displays[type as keyof typeof displays] || { 
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ), 
      color: 'bg-gray-100 text-gray-800', 
      name: type 
    };
  };

  const productDisplay = getProductTypeDisplay(productType);
  const passRateColor = passRate >= 90 ? 'text-green-600' : passRate >= 70 ? 'text-yellow-600' : 'text-red-600';
  const progressColor = passRate >= 90 ? 'bg-green-500' : passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-2">{productDisplay.icon}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{productDisplay.name}</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${productDisplay.color} mb-3`}>
          {productType} Inspection
        </div>
        
        {/* Pass Rate Display */}
        <div className="mt-4">
          <div className={`text-3xl font-bold ${passRateColor} mb-2`}>
            {passRate}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full ${progressColor} transition-all duration-1000 ease-out`}
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">Overall Pass Rate</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{checklistSummary.totalItems}</div>
          <div className="text-xs text-gray-600 mt-1">Total Items</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600">{checklistSummary.passedItems}</div>
          <div className="text-xs text-green-600 mt-1">Passed ✓</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{checklistSummary.failedItems}</div>
          <div className="text-xs text-red-600 mt-1">Failed ✗</div>
        </div>
      </div>

      {/* Inspection Overview */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Inspection Overview
        </h4>
        
        <div className="space-y-3">
          {/* Checklist Preview */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Checklist Items</span>
            <span className="text-sm font-medium">{checklist.length} items checked</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Inspection Date</span>
            <span className="text-sm font-medium">{certificate.inspectionDate}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Inspector(s)</span>
            <span className="text-sm font-medium text-right">
              {certificate.engineerNames.slice(0, 2).join(", ")}
              {certificate.engineerNames.length > 2 && ` +${certificate.engineerNames.length - 2} more`}
            </span>
          </div>

          {certificate.resolvedLocation && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Location</span>
              <span className="text-sm font-medium text-right max-w-[200px]">
                {certificate.resolvedLocation}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className={`rounded-lg p-4 ${
        passRate >= 90 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : passRate >= 70 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'
      } border`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {passRate >= 90 ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : passRate >= 70 ? (
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h4 className="font-medium">
              {passRate >= 90 
                ? 'Excellent - All systems operating optimally' 
                : passRate >= 70 
                  ? 'Good - Minor issues detected'
                  : 'Attention Required - Critical issues found'
              }
            </h4>
            <p className="text-sm mt-1">
              {passRate >= 90 
                ? 'This equipment has passed all critical safety checks and is operating within acceptable parameters.'
                : passRate >= 70 
                  ? 'Most systems are functioning correctly. Review the detailed checklist for minor issues.'
                  : 'Several critical issues have been identified. Immediate attention and maintenance may be required.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Action Reminder */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="font-medium text-blue-900">Next Steps</h4>
            <p className="text-sm text-blue-700 mt-1">
              View the detailed checklist and photos for complete inspection results. 
              Download the official certificate for your safety compliance records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}