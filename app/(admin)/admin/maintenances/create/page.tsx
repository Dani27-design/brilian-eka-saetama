"use client";
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";

export default function CreateMaintenancePage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [form, setForm] = useState({
    contract: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAdmin();

  useEffect(() => {
    const fetchContracts = async () => {
      const snap = await getDocs(collection(firestore, "contracts"));
      setContracts(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
    };
    fetchContracts();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!form.contract || !form.startDate || !form.endDate) {
      setError("Semua field wajib diisi.");
      setLoading(false);
      return;
    }
    try {
      // Get contract doc and its products
      const contractRef = doc(firestore, "contracts", form.contract);
      const contractSnap = await getDoc(contractRef);
      if (!contractSnap.exists()) throw new Error("Kontrak tidak ditemukan");
      const contractData = contractSnap.data();
      const products: any[] = contractData.products || [];
      if (!products.length) throw new Error("Kontrak tidak memiliki produk");

      // Create maintenance for each product
      await Promise.all(
        products.map(async (prodRef: any) => {
          await addDoc(collection(firestore, "maintenances"), {
            contract: contractRef,
            product: prodRef,
            engineer: null,
            inspection: null,
            status: "scheduled",
            startDate: new Date(form.startDate),
            endDate: new Date(form.endDate),
            createdAt: serverTimestamp(),
            createdBy: user?.uid ? doc(firestore, "users", user.uid) : null,
          });
        }),
      );
      router.push("/admin/maintenances");
    } catch (err: any) {
      setError(err.message || "Gagal membuat maintenance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-2 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Tambah Jadwal Maintenance
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pilih kontrak dan tanggal untuk membuat jadwal maintenance. Satu
          maintenance akan dibuat untuk setiap produk pada kontrak.
        </p>
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
            <select
              name="contract"
              value={form.contract}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            >
              <option value="">Pilih kontrak</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} - {c.contractName}
                </option>
              ))}
            </select>
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
            <input
              type="text"
              value="scheduled"
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2 text-gray-500 dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Status default: scheduled
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
            {loading ? "Menyimpan..." : "Simpan Maintenance"}
          </button>
        </div>
      </form>
    </div>
  );
}
