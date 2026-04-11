"use client";

import { memo } from "react";
import Link from "next/link";
import { Customer, ContactPerson } from "@/types/customer";
import { formatAddressSingleLine } from "@/utils/addressHelper";

interface CustomerListItemProps {
  customer: Customer & { id: string; contracts: any[] };
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  onViewContracts?: (
    customer: Customer & { id: string; contracts: any[] },
  ) => void;
}

function CustomerListItem({
  customer,
  onDelete,
  isSelected = false,
  onToggleSelection,
  onViewContracts,
}: CustomerListItemProps) {
  // Get primary contact or first contact
  const getPrimaryContact = (): ContactPerson | null => {
    if (customer.contacts && customer.contacts.length > 0) {
      const primaryContact = customer.contacts.find(
        (c) => c.id === customer.primaryContactId,
      );
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
        position: primaryContact.position,
      };
    }

    // Fallback to legacy contact
    if (customer.contact) {
      return {
        name: customer.contact.name,
        phone: customer.contact.phone?.toString() || "",
        email: customer.contact.email,
        position: "",
      };
    }

    return null;
  };

  // Format address for display
  const getDisplayAddress = (): string => {
    if (
      customer.address &&
      typeof customer.address === "object" &&
      "street" in customer.address
    ) {
      return formatAddressSingleLine(customer.address, 60);
    }

    // Fallback to legacy address (string)
    if (typeof customer.address === "string" && customer.address) {
      const addressString = customer.address as string;
      return addressString.length > 60
        ? addressString.substring(0, 57) + "..."
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
      return customer.customerType === "corporate"
        ? "Korporat"
        : customer.customerType === "individual"
        ? "Individu"
        : customer.customerType === "government"
        ? "Pemerintah"
        : "BUMN";
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
    <tr
      className={`text-sm transition-colors ${
        isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-blue-50/50"
      }`}
    >
      {/* Selection Checkbox */}
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </td>

      {/* Customer Name & Type */}
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-gray-900">{customer.name}</div>
          <div className="text-xs text-gray-500">{getBusinessInfo()}</div>
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
            <div className="text-xs text-gray-600">{displayContact.phone}</div>
            <div className="text-xs text-gray-600">{displayContact.email}</div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      {/* Contracts */}
      <td className="px-4 py-3">
        {contractCount > 0 ? (
          <div className="text-sm">
            <button
              onClick={() => onViewContracts?.(customer)}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Lihat {contractCount} kontrak
            </button>
          </div>
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
            <svg
              className="mr-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Link>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className={`inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 ${
              !canDelete ? "cursor-not-allowed opacity-50" : ""
            }`}
            title={
              canDelete
                ? "Hapus pelanggan"
                : "Tidak dapat dihapus — pelanggan memiliki kontrak aktif"
            }
          >
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(CustomerListItem);
