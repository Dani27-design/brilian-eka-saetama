"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp, DocumentReference } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";

type UserMeta = {
  name?: string;
  role?: string;
};

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  const [form, setForm] = useState({
    name: "",
    address: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [loading, setLoading] = useState(true);
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
          const data = docSnap.data() as any;
          setForm({
            name: data.name || "",
            address: data.address || "",
            contactName: data.contact?.name || "",
            contactPhone: data.contact?.phone || "",
            contactEmail: data.contact?.email || "",
          });

          // Determine which meta to show: updated or created
          if (data.updatedAt && data.updatedBy) {
            fetchUserMeta(data.updatedBy, data.updatedAt, "Terakhir diubah oleh");
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateDoc(doc(firestore, "customers", id), {
        name: form.name,
        address: form.address,
        contact: {
          name: form.contactName,
          phone: form.contactPhone,
          email: form.contactEmail,
        },
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      router.push("/admin/customers");
    } catch {
      setError("Gagal mengupdate pelanggan");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-2 dark:bg-boxdark dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Edit Pelanggan
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ubah data pelanggan sesuai kebutuhan.
        </p>
        {metaInfo && (
          <div className="mt-3 rounded bg-blue-50 px-4 py-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <span className="font-semibold">{metaInfo.label}</span>
            {metaInfo.user && (
              <>
                {" "}
                <span>
                  {metaInfo.user.name} ({metaInfo.user.role})
                </span>
              </>
            )}
            {metaInfo.date && (
              <>
                {" "}
                <span className="text-gray-500">pada {metaInfo.date}</span>
              </>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="shrink-0"></div>
            <div className="ml-3">{error}</div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Perusahaan Pelanggan
            </label>
            <input
              name="name"
              placeholder="Perusahaan Pelanggan"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alamat
            </label>
            <textarea
              name="address"
              placeholder="Alamat"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Kontak
            </label>
            <input
              name="contactName"
              placeholder="Nama Kontak"
              value={form.contactName}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Telepon Kontak
            </label>
            <input
              name="contactPhone"
              placeholder="Telepon Kontak"
              value={form.contactPhone}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
              type="tel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Kontak
            </label>
            <input
              name="contactEmail"
              placeholder="Email Kontak"
              value={form.contactEmail}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
              type="email"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/admin/customers")}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
