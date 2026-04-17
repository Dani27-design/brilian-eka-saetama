"use client";

import { useState, useEffect } from "react";
import { Customer, CustomerAddress, ContactPerson, CustomerType } from "@/types/customer";
import { validateCustomerAddress } from "@/utils/addressHelper";
import { getBusinessFields, customerTypeOptions } from "@/utils/indonesianRegions";
import AddressForm from "./AddressForm";
import ContactPersonForm from "./ContactPersonForm";

interface CustomerFormProps {
  customer?: Partial<Customer>;
  onSubmit: (customer: Omit<Customer, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: "create" | "edit";
}

interface FormErrors {
  name?: string;
  customerType?: string;
  businessField?: string;
  address?: Record<string, string>;
  contacts?: string;
}

export default function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  loading = false,
  mode
}: CustomerFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    customerType: CustomerType;
    businessField: string;
    address: Partial<CustomerAddress>;
    contacts: ContactPerson[];
    primaryContactId: string;
  }>({
    name: "",
    customerType: "corporate",
    businessField: "",
    address: {},
    contacts: [],
    primaryContactId: ""
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [businessFields] = useState(getBusinessFields());

  // Initialize form data
  useEffect(() => {
    if (customer) {
      let contacts = customer.contacts || [];
      let primaryContactId = customer.primaryContactId || "";

      // Migration support: convert legacy contact to new format
      if (customer.contact && (!customer.contacts || customer.contacts.length === 0)) {
        const legacyContact: ContactPerson = {
          id: "legacy_" + Date.now(),
          name: customer.contact.name,
          email: customer.contact.email,
          phone: customer.contact.phone.toString(),
          isPrimary: true,
          isActive: true
        };
        contacts = [legacyContact];
        primaryContactId = legacyContact.id;
      }

      setFormData({
        name: customer.name || "",
        customerType: customer.customerType || "corporate",
        businessField: customer.businessField || "",
        address: customer.address || {},
        contacts,
        primaryContactId
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: "",
        customerType: "corporate",
        businessField: "",
        address: {},
        contacts: [],
        primaryContactId: ""
      });
    }
  }, [customer]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Basic information validation
    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    }

    if (!formData.customerType) {
      newErrors.customerType = "Customer type is required";
    }

    // Address validation
    const addressValidation = validateCustomerAddress(formData.address);
    if (!addressValidation.isValid) {
      newErrors.address = addressValidation.errors;
    }

    // Contacts validation
    if (formData.contacts.length === 0) {
      newErrors.contacts = "At least one contact person is required";
    } else {
      // Validate each contact has required fields
      const invalidContacts = formData.contacts.filter(contact => 
        !contact.name.trim() || !contact.email.trim() || !contact.phone.trim()
      );
      
      if (invalidContacts.length > 0) {
        newErrors.contacts = "All contacts must have name, email, and phone";
      }

      // Check for duplicate emails
      const emails = formData.contacts.map(c => c.email.toLowerCase());
      const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
      if (duplicateEmails.length > 0) {
        newErrors.contacts = "Contact emails must be unique";
      }
    }

    if (!formData.primaryContactId && formData.contacts.length > 0) {
      newErrors.contacts = "Primary contact must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        customerType: formData.customerType,
        businessField: formData.businessField || undefined,
        address: formData.address as CustomerAddress,
        contacts: formData.contacts,
        primaryContactId: formData.primaryContactId
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Handle field changes
  const handleBasicFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="styled-scrollbar flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Informasi Dasar
          </h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Customer Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nama Pelanggan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleBasicFieldChange("name", e.target.value)}
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
                  errors.name
                    ? "border-red-500 bg-red-50"
                    : "border-stroke bg-transparent"
                }`}
                placeholder="Contoh: PT. ABC Indonesia"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Customer Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipe Pelanggan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerType}
                onChange={(e) => handleBasicFieldChange("customerType", e.target.value)}
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
                  errors.customerType
                    ? "border-red-500 bg-red-50"
                    : "border-stroke bg-transparent"
                }`}
              >
                {customerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.customerType && (
                <p className="mt-1 text-sm text-red-600">{errors.customerType}</p>
              )}
            </div>

            {/* Business Field */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bidang Usaha
              </label>
              <select
                value={formData.businessField}
                onChange={(e) => handleBasicFieldChange("businessField", e.target.value)}
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
                  errors.businessField
                    ? "border-red-500 bg-red-50"
                    : "border-stroke bg-transparent"
                }`}
              >
                <option value="">Pilih Bidang Usaha</option>
                {businessFields.map((field) => (
                  <option key={field.id} value={field.name}>
                    {field.name}
                  </option>
                ))}
              </select>
              {errors.businessField && (
                <p className="mt-1 text-sm text-red-600">{errors.businessField}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Form */}
        <AddressForm
          address={formData.address}
          onChange={(address) => handleBasicFieldChange("address", address)}
          errors={errors.address}
          disabled={loading}
        />

        {/* Contact Person Form */}
        <ContactPersonForm
          contacts={formData.contacts}
          onChange={(contacts) => handleBasicFieldChange("contacts", contacts)}
          primaryContactId={formData.primaryContactId}
          onPrimaryContactChange={(contactId) => handleBasicFieldChange("primaryContactId", contactId)}
          errors={{ contacts: errors.contacts || "" }}
          disabled={loading}
        />

        </div>
        {/* Form Actions — pinned below scroll area */}
        <div className="flex justify-end space-x-4 border-t pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-stroke bg-white px-6 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading 
              ? "Menyimpan..." 
              : mode === "create" 
              ? "Simpan Pelanggan" 
              : "Simpan Perubahan"
            }
          </button>
        </div>
      </form>
    </div>
  );
}