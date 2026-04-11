"use client";

import { useState } from "react";
import { collection, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/app/context/AdminContext";
import { Customer } from "@/types/customer";
import CustomerForm from "@/components/Admin/Customers/CustomerForm";
import { createAddressFromForm } from "@/utils/addressHelper";

export default function CreateCustomerPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAdmin();

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
    <div className="">
      {/* Enhanced Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center text-sm text-gray-500">
          <Link href="/admin/customers" className="hover:text-gray-700">
            Pelanggan
          </Link>
          <svg className="mx-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900">Tambah Baru</span>
        </nav>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Tambah Pelanggan Baru</h1>
            <p className="mt-1 text-sm text-gray-600">Lengkapi informasi untuk menambah pelanggan baru ke dalam sistem</p>
          </div>
          <Link
            href="/admin/customers"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar
          </Link>
        </div>
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
              <h3 className="text-sm font-medium text-red-800">
                Terjadi Kesalahan
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
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
