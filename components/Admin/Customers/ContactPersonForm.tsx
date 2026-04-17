"use client";

import { useState } from "react";
import { ContactPerson } from "@/types/customer";

interface ContactPersonFormProps {
  contacts: ContactPerson[];
  onChange: (contacts: ContactPerson[]) => void;
  primaryContactId?: string;
  onPrimaryContactChange: (contactId: string) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

interface ContactErrors {
  [contactId: string]: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export default function ContactPersonForm({
  contacts,
  onChange,
  primaryContactId,
  onPrimaryContactChange,
  errors = {},
  disabled = false
}: ContactPersonFormProps) {
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [editingContact, setEditingContact] = useState<string | null>(null);

  // Generate unique ID for new contacts
  const generateContactId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Add new contact
  const addContact = () => {
    const newContact: ContactPerson = {
      id: generateContactId(),
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      isPrimary: contacts.length === 0, // First contact is primary by default
      isActive: true
    };

    const newContacts = [...contacts, newContact];
    onChange(newContacts);
    setEditingContact(newContact.id);

    // Set as primary if it's the first contact
    if (contacts.length === 0) {
      onPrimaryContactChange(newContact.id);
    }
  };

  // Update contact
  const updateContact = (contactId: string, updates: Partial<ContactPerson>) => {
    const newContacts = contacts.map(contact =>
      contact.id === contactId
        ? { ...contact, ...updates }
        : contact
    );
    onChange(newContacts);
  };

  // Delete contact
  const deleteContact = (contactId: string) => {
    if (contacts.length === 1) {
      alert("Cannot delete the last contact. At least one contact is required.");
      return;
    }

    const newContacts = contacts.filter(contact => contact.id !== contactId);
    onChange(newContacts);

    // If deleted contact was primary, make first remaining contact primary
    if (primaryContactId === contactId && newContacts.length > 0) {
      onPrimaryContactChange(newContacts[0].id);
    }

    // Clear editing state if this contact was being edited
    if (editingContact === contactId) {
      setEditingContact(null);
    }
  };

  // Set primary contact
  const setPrimaryContact = (contactId: string) => {
    onPrimaryContactChange(contactId);
  };

  // Validate contact
  const validateContact = (contact: ContactPerson) => {
    const errors: { name?: string; email?: string; phone?: string } = {};

    if (!contact.name.trim()) {
      errors.name = "Name is required";
    }

    if (!contact.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errors.email = "Invalid email format";
    } else {
      // Check for duplicate emails
      const duplicateEmail = contacts.find(c => 
        c.id !== contact.id && c.email.toLowerCase() === contact.email.toLowerCase()
      );
      if (duplicateEmail) {
        errors.email = "Email already exists for another contact";
      }
    }

    if (!contact.phone.trim()) {
      errors.phone = "Phone is required";
    }

    return errors;
  };

  // Save contact (finish editing)
  const saveContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const errors = validateContact(contact);
    setContactErrors(prev => ({
      ...prev,
      [contactId]: errors
    }));

    if (Object.keys(errors).length === 0) {
      setEditingContact(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Kontak Person
        </h3>
        <button
          type="button"
          onClick={addContact}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Kontak
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
          <p className="text-gray-500">Belum ada kontak. Klik "Tambah Kontak" untuk menambah kontak pertama.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
              className={`rounded-lg border p-4 ${
                primaryContactId === contact.id
                  ? "border-primary bg-primary/5"
                  : "border-stroke bg-white"
              }`}
            >
              {/* Contact Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">
                    Kontak {index + 1}
                  </h4>
                  {primaryContactId === contact.id && (
                    <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-white">
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingContact === contact.id ? (
                    <button
                      type="button"
                      onClick={() => saveContact(contact.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingContact(contact.id)}
                      disabled={disabled}
                      className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {primaryContactId !== contact.id && (
                    <button
                      type="button"
                      onClick={() => setPrimaryContact(contact.id)}
                      disabled={disabled}
                      className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
                      title="Set as primary contact"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  )}
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteContact(contact.id)}
                      disabled={disabled}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Form */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                    disabled={disabled || editingContact !== contact.id}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary ${
                      contactErrors[contact.id]?.name
                        ? "border-red-500 bg-red-50"
                        : "border-stroke bg-transparent"
                    }`}
                  />
                  {contactErrors[contact.id]?.name && (
                    <p className="mt-1 text-xs text-red-600">{contactErrors[contact.id].name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                    disabled={disabled || editingContact !== contact.id}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary ${
                      contactErrors[contact.id]?.email
                        ? "border-red-500 bg-red-50"
                        : "border-stroke bg-transparent"
                    }`}
                  />
                  {contactErrors[contact.id]?.email && (
                    <p className="mt-1 text-xs text-red-600">{contactErrors[contact.id].email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(contact.id, { phone: e.target.value })}
                    disabled={disabled || editingContact !== contact.id}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary ${
                      contactErrors[contact.id]?.phone
                        ? "border-red-500 bg-red-50"
                        : "border-stroke bg-transparent"
                    }`}
                  />
                  {contactErrors[contact.id]?.phone && (
                    <p className="mt-1 text-xs text-red-600">{contactErrors[contact.id].phone}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={contact.position || ""}
                    onChange={(e) => updateContact(contact.id, { position: e.target.value })}
                    disabled={disabled || editingContact !== contact.id}
                    className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Departemen
                  </label>
                  <input
                    type="text"
                    value={contact.department || ""}
                    onChange={(e) => updateContact(contact.id, { department: e.target.value })}
                    disabled={disabled || editingContact !== contact.id}
                    className="w-full rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global errors */}
      {errors.contacts && (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-600">{errors.contacts}</p>
        </div>
      )}
    </div>
  );
}