"use client";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";

type UserMeta = {
  name?: string;
  role?: string;
};

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  const [form, setForm] = useState<any>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [metaInfo, setMetaInfo] = useState<{
    label: string;
    date?: string;
    user?: { name?: string; role?: string };
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Maintenance
        const docRef = doc(firestore, "maintenances", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error("Maintenance tidak ditemukan");
        const data = docSnap.data();
        setForm({
          ...data,
          startDate: data.startDate?.toDate
            ? data.startDate.toDate().toISOString().slice(0, 10)
            : "",
          endDate: data.endDate?.toDate
            ? data.endDate.toDate().toISOString().slice(0, 10)
            : "",
          engineer: data.engineer
            ? data.engineer.map((ref: any) => ref.id)
            : [],
        });

        // Meta info
        if (data.updatedAt && data.updatedBy) {
          fetchUserMeta(data.updatedBy, data.updatedAt, "Terakhir diubah oleh");
        } else if (data.createdAt && data.createdBy) {
          fetchUserMeta(data.createdBy, data.createdAt, "Dibuat oleh");
        } else {
          setMetaInfo(null);
        }

        // Engineers
        const engSnap = await getDocs(
          query(
            collection(firestore, "users"),
            where("role", "==", "engineer"),
          ),
        );
        setEngineers(engSnap.docs.map((d) => ({ ...d.data(), id: d.id })));
      } catch (err: any) {
        setError(err.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserMeta = async (userRef: any, date: any, label: string) => {
      try {
        const userSnap = await getDoc(userRef);
        let user: UserMeta = {};
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserMeta;
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

    if (id) fetchData();
    // eslint-disable-next-line
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value,
    );
    setForm({ ...form, engineer: selected });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateDoc(doc(firestore, "maintenances", id), {
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        status: form.status,
        engineer: form.engineer.map((uid: string) =>
          doc(firestore, "users", uid),
        ),
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      router.push("/admin/maintenances");
    } catch {
      setError("Gagal mengupdate maintenance");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !form) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-2 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Edit Maintenance
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ubah data jadwal maintenance sesuai kebutuhan.
        </p>
        {metaInfo && (
          <div className="mt-3 rounded bg-blue-50 px-4 py-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {metaInfo.label}{" "}
            {metaInfo.user?.name && (
              <span>
                <b>{metaInfo.user.name}</b>
                {metaInfo.user.role ? ` (${metaInfo.user.role})` : ""}
              </span>
            )}
            {metaInfo.date && <span className="ml-2">{metaInfo.date}</span>}
          </div>
        )}
      </div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="ml-3">{error}</div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kontrak
            </label>
            <input
              value={form.contract?.id || ""}
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2 text-gray-500 dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Produk
            </label>
            <input
              value={form.product?.id || ""}
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2 text-gray-500 dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanggal Selesai
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            >
              <option value="scheduled">Scheduled</option>
              <option value="waiting_approval">Waiting Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Engineer
            </label>
            <select
              multiple
              value={form.engineer}
              onChange={handleEngineerChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
            >
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Pilih satu atau lebih engineer (opsional)
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/admin/maintenances")}
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
