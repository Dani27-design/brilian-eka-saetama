"use client";

import { useState } from "react";
import { collection, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/app/context/AdminContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { Customer } from "@/types/customer";
import CustomerForm from "@/components/Admin/Customers/CustomerForm";
import { createAddressFromForm } from "@/utils/addressHelper";

export default function CreateCustomerPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAdmin();

  usePageHeader("Tambah Pelanggan Baru", "Lengkapi informasi untuk menambah pelanggan baru ke dalam sistem");

  const handleSubmit = async (customerData: Omit<Customer, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => {
    setLoading(true);
    setError("");
    
    try {
      await addDoc(collection(firestore, "customers"), {
        ...customerData,
        createdAt: serverTimestamp(),
        createdBy: user?.uid ? doc(firestore, "users", user.uid) : null,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      router.push("/admin/customers");
    } catch (err) {
      console.error("Error creating customer:", err);
      setError("Gagal menambah pelanggan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/customers");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/admin/customers"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Pelanggan
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Terjadi Kesalahan</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form */}
      <CustomerForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
