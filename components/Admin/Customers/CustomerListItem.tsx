"use client";

import { memo } from "react";
import Link from "next/link";
import { Customer, ContactPerson } from "@/types/customer";
import { formatAddressSingleLine } from "@/utils/addressHelper";

interface CustomerListItemProps {
  customer: Customer & { id: string; contracts: any[] };
  onDelete: (id: string) => void;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

function CustomerListItem({
  customer,
  onDelete,
  bulkMode = false,
  isSelected = false,
  onToggleSelection
}: CustomerListItemProps) {
  // Get primary contact or first contact
  const getPrimaryContact = (): ContactPerson | null => {
    if (customer.contacts && customer.contacts.length > 0) {
      const primaryContact = customer.contacts.find(c => c.id === customer.primaryContactId);
      return primaryContact || customer.contacts[0];
    }
    return null;
  };

  // Fallback to legacy contact if no new contacts
  const getDisplayContact = () => {
    const primaryContact = getPrimaryContact();
    
    if (primaryContact) {
      return {
        name: primaryContact.name,
        phone: primaryContact.phone,
        email: primaryContact.email,
        position: primaryContact.position
      };
    }
    
    // Fallback to legacy contact
    if (customer.contact) {
      return {
        name: customer.contact.name,
        phone: customer.contact.phone?.toString() || "",
        email: customer.contact.email,
        position: ""
      };
    }
    
    return null;
  };

  // Format address for display
  const getDisplayAddress = (): string => {
    if (customer.address && typeof customer.address === 'object' && 'street' in customer.address) {
      return formatAddressSingleLine(customer.address, 60);
    }
    
    // Fallback to legacy address (string)
    if (typeof customer.address === 'string' && customer.address) {
      const addressString = customer.address as string;
      return addressString.length > 60 
        ? addressString.substring(0, 57) + '...' 
        : addressString;
    }
    
    return "-";
  };

  const displayContact = getDisplayContact();
  const displayAddress = getDisplayAddress();

  // Get business field or customer type for display
  const getBusinessInfo = (): string => {
    if (customer.businessField) return customer.businessField;
    if (customer.customerType) {
      return customer.customerType === "corporate" ? "Korporat" : 
             customer.customerType === "individual" ? "Individu" : 
             customer.customerType === "government" ? "Pemerintah" : "BUMN";
    }
    return "-";
  };

  const handleDelete = () => {
    if (window.confirm(`Hapus pelanggan "${customer.name}"?`)) {
      onDelete(customer.id);
    }
  };

  const contractCount = customer.contracts?.length || 0;
  const canDelete = contractCount === 0;

  return (
    <tr className="border-b text-sm hover:bg-gray-50">
      {/* Bulk Selection Checkbox */}
      {bulkMode && (
        <td className="px-4 py-3 text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </td>
      )}
      
      {/* Customer Name & Type */}
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">
            {customer.name}
          </div>
          <div className="text-xs text-gray-500">
            {getBusinessInfo()}
          </div>
        </div>
      </td>

      {/* Address */}
      <td className="px-4 py-3">
        <div className="text-gray-700" title={displayAddress}>
          {displayAddress}
        </div>
      </td>

      {/* Primary Contact */}
      <td className="px-4 py-3">
        {displayContact ? (
          <div className="space-y-1">
            <div className="font-medium text-gray-900">
              {displayContact.name}
              {displayContact.position && (
                <span className="ml-1 text-xs text-gray-500">
                  ({displayContact.position})
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {displayContact.phone}
            </div>
            <div className="text-xs text-gray-600">
              {displayContact.email}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Additional Contacts */}
      <td className="px-4 py-3 text-center">
        {customer.contacts && customer.contacts.length > 1 ? (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            +{customer.contacts.length - 1} lainnya
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Contracts */}
      <td className="px-4 py-3 text-center">
        {contractCount > 0 ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            {contractCount} kontrak
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* View/Edit Button */}
          <Link
            href={`/admin/customers/edit/${customer.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
            title="Edit pelanggan"
          >
            <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              canDelete
                ? "border border-red-300 bg-white text-red-600 hover:bg-red-50"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title={canDelete ? "Hapus pelanggan" : "Tidak dapat dihapus karena memiliki kontrak"}
          >
            <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(CustomerListItem);