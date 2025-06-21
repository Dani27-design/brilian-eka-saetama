"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  const [form, setForm] = useState({
    contractNumber: "",
    customer: "",
    startDate: "",
    endDate: "",
    status: "active",
    includesMaintenance: false,
    products: [] as string[],
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contractNumberError, setContractNumberError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contract
        const docRef = doc(firestore, "contracts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setForm({
            contractNumber: data.contractNumber || "",
            customer: data.customer?.id || "",
            startDate: data.startDate?.toDate
              ? data.startDate.toDate().toISOString().slice(0, 10)
              : "",
            endDate: data.endDate?.toDate
              ? data.endDate.toDate().toISOString().slice(0, 10)
              : "",
            status: data.status || "active",
            includesMaintenance: !!data.includesMaintenance,
            products: Array.isArray(data.products)
              ? data.products.map((p: any) => p.id)
              : [],
          });
        } else {
          setError("Kontrak tidak ditemukan");
        }
        // Fetch customers and products
        const custSnap = await getDocs(collection(firestore, "customers"));
        setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        const prodSnap = await getDocs(collection(firestore, "products"));
        setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setError("Gagal memuat data kontrak");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const checkContractNumberUnique = async (value: string) => {
    if (!value) {
      setContractNumberError("");
      return;
    }
    const q = collection(firestore, "contracts");
    const docsSnap = await getDocs(q);
    const exists = docsSnap.docs.some(
      (d) => d.data().contractNumber === value && d.id !== id,
    );
    if (exists) {
      setContractNumberError(
        "No. Kontrak sudah digunakan, gunakan nomor lain.",
      );
    } else {
      setContractNumberError("");
    }
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (name === "includesMaintenance") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
      if (name === "contractNumber") {
        await checkContractNumberUnique(value);
      }
    }
  };

  // Add product to list
  const handleAddProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !form.products.includes(value)) {
      setForm((prev) => ({
        ...prev,
        products: [...prev.products, value],
      }));
    }
    e.target.selectedIndex = 0;
  };

  // Remove product from list
  const handleRemoveProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((pid) => pid !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Final check for contractNumber uniqueness
    const docsSnap = await getDocs(collection(firestore, "contracts"));
    const exists = docsSnap.docs.some(
      (d) => d.data().contractNumber === form.contractNumber && d.id !== id,
    );
    if (
      !form.contractNumber ||
      !form.customer ||
      !form.startDate ||
      !form.endDate
    ) {
      setError("Semua field wajib diisi.");
      setLoading(false);
      return;
    }
    if (exists) {
      setContractNumberError(
        "No. Kontrak sudah digunakan, gunakan nomor lain.",
      );
      setLoading(false);
      return;
    }
    try {
      await updateDoc(doc(firestore, "contracts", id), {
        contractNumber: form.contractNumber,
        customer: doc(firestore, "customers", form.customer),
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        status: form.status,
        includesMaintenance: form.includesMaintenance,
        products: form.products.map((pid) => doc(firestore, "products", pid)),
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      router.push("/admin/contracts");
    } catch {
      setError("Gagal mengupdate kontrak");
    } finally {
      setLoading(false);
    }
  };

  // Available products for dropdown (exclude already selected)
  const availableProducts = products.filter(
    (p) => !form.products.includes(p.id)
  );

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-2 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Edit Kontrak
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ubah data kontrak sesuai kebutuhan.
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
              No. Kontrak
            </label>
            <input
              name="contractNumber"
              placeholder="No. Kontrak"
              value={form.contractNumber}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                contractNumberError ? "border-red-500" : "border-stroke"
              } bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white`}
              required
            />
            {contractNumberError && (
              <p className="mt-1 text-xs text-red-600">{contractNumberError}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pelanggan
            </label>
            <select
              name="customer"
              value={form.customer}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            >
              <option value="">Pilih pelanggan</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanggal Mulai
            </label>
            <input
              name="startDate"
              type="date"
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
              name="endDate"
              type="date"
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
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="terminated">Dihentikan</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="includesMaintenance"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Termasuk Maintenance
            </label>
            <div className="w-fit cursor-pointer bg-transparent py-2">
              <input
                name="includesMaintenance"
                type="checkbox"
                checked={form.includesMaintenance}
                onChange={handleChange}
                className="cursor-pointer rounded border-stroke text-primary focus:ring-primary"
                id="includesMaintenance"
              />
            </div>
          </div>
          {/* Produk dynamic add/remove */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Produk (bisa pilih lebih dari satu)
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select
                  onChange={handleAddProduct}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  value=""
                >
                  <option value="">Tambah produk...</option>
                  {products
                    .filter((p) => !form.products.includes(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.productNumber} - {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.products.map((pid) => {
                  const prod = products.find((p) => p.id === pid);
                  return (
                    <span
                      key={pid}
                      className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                    >
                      {prod ? `${prod.productNumber} - ${prod.name}` : pid}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(pid)}
                        className="ml-2 rounded bg-blue-200 px-1 text-xs text-blue-900 hover:bg-red-200 hover:text-red-700"
                        aria-label="Remove"
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/admin/contracts")}
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
