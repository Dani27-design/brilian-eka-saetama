"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  where,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { 
  calculateMaintenanceSchedules, 
  validateMaintenanceInterval 
} from "@/utils/maintenanceScheduler";
import { generateMaintenancesForContract } from "@/utils/contractMaintenanceGenerator";
import { Product } from "@/types/product";

export default function CreateContractPage() {
  const [form, setForm] = useState({
    contractNumber: "",
    contractName: "",
    contractType: "",
    contractDescription: "",
    customer: "",
    startDate: "",
    endDate: null,
    status: "active",
    products: [] as string[],
    productDetails: [] as Array<{
      product: string;
      location: string;
      maintenance: boolean;
      service: boolean;
      rental: boolean;
      sales: boolean;
    }>,
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [contractNumberError, setContractNumberError] = useState("");
  const router = useRouter();
  const { user } = useAdmin();

  useEffect(() => {
    const fetchData = async () => {
      const custSnap = await getDocs(collection(firestore, "customers"));
      setCustomers(custSnap.docs.map((d) => ({ ...d.data(), id: d.id })));
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnap = await getDocs(
          query(
            collection(firestore, "products"),
            where("contract", "==", null),
          ),
        );
        const allProducts = productsSnap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
        setProducts(allProducts);
        // Filter products that are not already in the contract
        const selectedProductIds = new Set(form.products);
        const filteredProducts = allProducts.filter(
          (p) => !selectedProductIds.has(p.id),
        );
        setAvailableProducts(filteredProducts);
      } catch {
        setError("Gagal memuat produk");
      }
    };
    fetchProducts();
  }, [form.products]);

  const checkContractNumberUnique = async (value: string) => {
    if (!value) {
      setContractNumberError("");
      return;
    }
    const q = query(
      collection(firestore, "contracts"),
      where("contractNumber", "==", value),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setContractNumberError(
        "No. Kontrak sudah digunakan, gunakan nomor lain.",
      );
    } else {
      setContractNumberError("");
    }
  };

  const handleChange = async (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    if (name === "contractNumber") {
      await checkContractNumberUnique(value);
    }
  };

  // Add product to list
  const handleAddProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !form.products.includes(value)) {
      setForm((prev) => ({
        ...prev,
        products: [...prev.products, value],
        productDetails: [
          ...prev.productDetails,
          {
            product: value,
            location: "",
            maintenance: form.contractType === "maintenance" ? true : false,
            service: form.contractType === "service" ? true : false,
            rental: form.contractType === "rental" ? true : false,
            sales: form.contractType === "sales" ? true : false,
          },
        ],
      }));
    }
    e.target.selectedIndex = 0;
  };

  // Remove product from list
  const handleRemoveProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((pid) => pid !== id),
      productDetails: prev.productDetails.filter((pd) => pd.product !== id),
    }));
  };

  // Handle product detail change
  const handleProductDetailChange = (
    idx: number,
    field: string,
    value: string | boolean,
  ) => {
    setForm((prev) => {
      const newDetails = [...prev.productDetails];
      (newDetails[idx] as any)[field] = value;
      return { ...prev, productDetails: newDetails };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Validasi
    if (
      !form.contractNumber ||
      !form.contractName ||
      !form.contractType ||
      !form.contractDescription ||
      !form.customer ||
      !form.startDate
    ) {
      setError("Semua field wajib diisi.");
      setLoading(false);
      return;
    }
    if (form.products.length === 0) {
      setError("Minimal satu produk harus dipilih.");
      setLoading(false);
      return;
    }
    // Validasi productDetails
    for (const pd of form.productDetails) {
      if (!pd.location) {
        setError("Lokasi produk wajib diisi.");
        setLoading(false);
        return;
      }
      if (!(pd.maintenance || pd.service || pd.rental || pd.sales)) {
        setError("Minimal satu layanan harus dipilih untuk setiap produk.");
        setLoading(false);
        return;
      }
    }
    // Cek produk tidak boleh sama di kontrak lain
    const allContractsSnap = await getDocs(collection(firestore, "contracts"));
    for (const pd of form.productDetails) {
      for (const docSnap of allContractsSnap.docs) {
        const data = docSnap.data() as any;
        if (
          Array.isArray(data.products) &&
          data.products.some((p: any) => p.id === pd.product)
        ) {
          setError("Produk sudah terdaftar di kontrak lain.");
          setLoading(false);
          return;
        }
      }
    }
    // Final uniqueness check right before creation (minimizes TOCTOU window)
    const q = query(
      collection(firestore, "contracts"),
      where("contractNumber", "==", form.contractNumber),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      setContractNumberError(
        "No. Kontrak sudah digunakan, gunakan nomor lain.",
      );
      setLoading(false);
      return;
    }
    try {
      const setContract = await addDoc(collection(firestore, "contracts"), {
        contractNumber: form.contractNumber,
        contractName: form.contractName,
        contractType: form.contractType,
        contractDescription: form.contractDescription,
        customer: doc(firestore, "customers", form.customer),
        startDate: new Date(form.startDate),
        endDate: form.endDate ? new Date(form.endDate) : null,
        status: form.status,
        products: form.products.map((pid) => doc(firestore, "products", pid)),
        productDetails: form.productDetails.map((pd) => ({
          product: doc(firestore, "products", pd.product),
          location: pd.location,
          maintenance: pd.maintenance,
          service: pd.service,
          rental: pd.rental,
          sales: pd.sales,
        })),
        createdAt: serverTimestamp(),
        createdBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });
      
      // update affiliated products
      for (const pid of form.products) {
        const productRef = doc(firestore, "products", pid);
        await updateDoc(productRef, {
          contract: doc(firestore, "contracts", setContract.id),
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
        });
      }

      // Auto-generate maintenances if contract type is "maintenance"
      if (form.contractType === "maintenance" && form.endDate) {
        try {
          await generateMaintenancesForContract(
            setContract.id,
            form.products,
            new Date(form.startDate),
            new Date(form.endDate)
          );
        } catch (maintenanceError) {
          console.error("Failed to generate maintenances:", maintenanceError instanceof Error ? maintenanceError.message : "Unknown error");
          // Continue to contracts page even if maintenance generation fails
          // The contract has been created successfully
        }
      }

      router.push("/admin/contracts");
    } catch (error) {
      console.error("Contract creation error:", error instanceof Error ? error.message : "Unknown error");
      setError("Gagal menambah kontrak");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shadow-default dark:bg-boxdark rounded-sm border border-stroke bg-white p-2 dark:border-strokedark md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Tambah Kontrak Baru
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Lengkapi data kontrak untuk menambah kontrak baru ke dalam sistem.
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
              value={form.endDate ?? undefined}
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
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Kontrak
            </label>
            <input
              name="contractName"
              placeholder="Nama Kontrak"
              value={form.contractName}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipe Kontrak
            </label>
            <select
              name="contractType"
              value={form.contractType}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            >
              <option>Pilih Tipe Kontrak</option>
              <option value="service">Perbaikan</option>
              <option value="maintenance">Pemeliharaan</option>
              <option value="rental">Penyewaan</option>
              <option value="sales">Penjualan</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deskripsi Kontrak
            </label>
            <textarea
              name="contractDescription"
              value={form.contractDescription}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
              required
            />
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
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productNumber} - {p.name} - {p.productType}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {form.products.map((pid, idx) => {
                  const prod = products.find((p) => p.id === pid);
                  const pd = form.productDetails.find(
                    (pd) => pd.product === pid,
                  );
                  return (
                    <div
                      key={pid}
                      className="flex flex-col gap-2 rounded border border-blue-200 bg-blue-50 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {prod ? `${prod.productNumber} - ${prod.name}` : pid}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(pid)}
                          className="ml-2 rounded bg-blue-200 px-1 text-xs text-blue-900 hover:bg-red-200 hover:text-red-700"
                          aria-label="Remove"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <input
                          type="text"
                          placeholder="Lokasi produk"
                          value={pd?.location || ""}
                          onChange={(e) =>
                            handleProductDetailChange(
                              idx,
                              "location",
                              e.target.value,
                            )
                          }
                          className="w-full rounded border border-stroke px-2 py-1 md:w-1/2"
                          required
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!pd?.maintenance}
                              onChange={(e) =>
                                handleProductDetailChange(
                                  idx,
                                  "maintenance",
                                  e.target.checked,
                                )
                              }
                            />
                            Pemeliharaan
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!pd?.service}
                              onChange={(e) =>
                                handleProductDetailChange(
                                  idx,
                                  "service",
                                  e.target.checked,
                                )
                              }
                            />
                            Perbaikan
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!pd?.rental}
                              onChange={(e) =>
                                handleProductDetailChange(
                                  idx,
                                  "rental",
                                  e.target.checked,
                                )
                              }
                            />
                            Penyewaan
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!pd?.sales}
                              onChange={(e) =>
                                handleProductDetailChange(
                                  idx,
                                  "sales",
                                  e.target.checked,
                                )
                              }
                            />
                            Penjualan
                          </label>
                        </div>
                      </div>
                    </div>
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
            {loading ? "Menyimpan..." : "Simpan Kontrak"}
          </button>
        </div>
      </form>
    </div>
  );
}
