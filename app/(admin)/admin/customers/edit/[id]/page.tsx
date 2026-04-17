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
import { usePageHeader } from "@/app/context/PageHeaderContext";
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

  usePageHeader("Edit Pelanggan", "Ubah informasi pelanggan sesuai kebutuhan");

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
    <div className="flex h-full flex-col">
      {/* Back button with meta info */}
      <div className="flex flex-row w-full justify-between mb-4">
        <Link
          href="/admin/customers"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Pelanggan
        </Link>
        {/* Meta Information */}
        {metaInfo && (
          <div className="inline-flex h-10 items-center rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 text-xs text-blue-800">
            <span className="font-medium">{metaInfo.label} : </span>
            {metaInfo.user?.name && (
              <span className="ml-1">
                <b>{metaInfo.user.name}</b>
                {metaInfo.user.role ? ` (${metaInfo.user.role})` : ""}
              </span>
            )}
            {metaInfo.date && (
              <span className="ml-1 text-blue-600">{metaInfo.date}</span>
            )}
          </div>
        )}
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
        mode="edit"
        customer={customer}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
      />
    </div>
  );
}
