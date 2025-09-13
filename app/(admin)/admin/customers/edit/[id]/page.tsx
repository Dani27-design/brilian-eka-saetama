"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { Customer } from "@/types/customer";
import CustomerForm from "@/components/Admin/Customers/CustomerForm";
import Link from "next/link";

type UserMeta = {
  name?: string;
  role?: string;
};

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [metaInfo, setMetaInfo] = useState<{
    label: string;
    date?: string;
    user?: UserMeta;
  } | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const docRef = doc(firestore, "customers", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Customer;
          setCustomer(data);

          // Determine which meta to show: updated or created
          if (data.updatedAt && data.updatedBy) {
            fetchUserMeta(
              data.updatedBy,
              data.updatedAt,
              "Terakhir diubah oleh",
            );
          } else if (data.createdAt && data.createdBy) {
            fetchUserMeta(data.createdBy, data.createdAt, "Dibuat oleh");
          } else {
            setMetaInfo(null);
          }
        } else {
          setError("Pelanggan tidak ditemukan");
        }
      } catch {
        setError("Gagal memuat data pelanggan");
      } finally {
        setLoading(false);
      }
    };

    // Helper to fetch user meta
    const fetchUserMeta = async (
      userRef: DocumentReference,
      date: any,
      label: string,
    ) => {
      try {
        const userSnap = await getDoc(userRef);
        let user: UserMeta = {};
        if (userSnap.exists()) {
          const userData = userSnap.data();
          user = {
            name: userData.name || "-",
            role: userData.role || "-",
          };
        }
        setMetaInfo({
          label,
          date: date?.toDate ? date.toDate().toLocaleString() : "-",
          user,
        });
      } catch {
        setMetaInfo({
          label,
          date: date?.toDate ? date.toDate().toLocaleString() : "-",
          user: { name: "-", role: "-" },
        });
      }
    };

    if (id) fetchCustomer();
  }, [id]);

  const handleSubmit = async (customerData: Omit<Customer, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">) => {
    setSubmitting(true);
    setError("");
    
    try {
      await updateDoc(doc(firestore, "customers", id), {
        ...customerData,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      router.push("/admin/customers");
    } catch (err) {
      console.error("Error updating customer:", err);
      setError("Gagal mengupdate pelanggan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/customers");
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Customer tidak ditemukan atau terjadi kesalahan.</p>
        <Link
          href="/admin/customers"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Pelanggan
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Enhanced Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center text-sm text-gray-500">
          <Link href="/admin/customers" className="hover:text-gray-700">
            Pelanggan
          </Link>
          <svg className="mx-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900">Edit</span>
        </nav>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Edit Pelanggan</h1>
            <p className="mt-1 text-sm text-gray-600">Ubah informasi pelanggan sesuai kebutuhan</p>
            {/* Meta Information */}
            {metaInfo && (
              <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <span className="font-medium">{metaInfo.label}</span>
                {metaInfo.user && (
                  <span className="ml-1">
                    {metaInfo.user.name} ({metaInfo.user.role})
                  </span>
                )}
                {metaInfo.date && (
                  <span className="ml-2 text-blue-600">pada {metaInfo.date}</span>
                )}
              </div>
            )}
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
        mode="edit"
        customer={customer}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
      />
    </div>
  );
}
