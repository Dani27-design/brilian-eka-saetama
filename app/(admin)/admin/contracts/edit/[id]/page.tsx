"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  serverTimestamp,
  where,
  query,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter, useParams } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { 
  regenerateMaintenancesForExtendedContract,
  generateMaintenancesForNewProducts 
} from "@/utils/smartMaintenanceRegeneration";

type UserMeta = {
  name?: string;
  role?: string;
};

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

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
  console.log("Form state:", form);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metaInfo, setMetaInfo] = useState<{
    label: string;
    date?: string;
    user?: UserMeta;
  } | null>(null);
  const [contractNumberError, setContractNumberError] = useState("");
  const [legacyProducts, setLegacyProducts] = useState<any[]>([]);
  const [originalContractData, setOriginalContractData] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    contractType: string;
    products: string[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contract
        const docRef = doc(firestore, "contracts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          
          // Store original contract data for comparison
          setOriginalContractData({
            startDate: data.startDate?.toDate ? data.startDate.toDate() : null,
            endDate: data.endDate?.toDate ? data.endDate.toDate() : null,
            contractType: data.contractType || "",
            products: Array.isArray(data.products)
              ? data.products.map((p: any) => p.id)
              : [],
          });
          
          setForm({
            contractNumber: data.contractNumber || "",
            contractName: data.contractName || "",
            contractType: data.contractType || "",
            contractDescription: data.contractDescription || "",
            customer: data.customer?.id || "",
            startDate: data.startDate?.toDate
              ? data.startDate.toDate().toISOString().slice(0, 10)
              : "",
            endDate: data.endDate?.toDate
              ? data.endDate.toDate().toISOString().slice(0, 10)
              : null,
            status: data.status || "active",
            products: Array.isArray(data.products)
              ? data.products.map((p: any) => p.id)
              : [],
            productDetails: Array.isArray(data.productDetails)
              ? data.productDetails.map((pd: any) => ({
                  product: pd.product?.id || "",
                  location: pd.location || "",
                  maintenance: !!pd.maintenance,
                  service: !!pd.service,
                  rental: !!pd.rental,
                  sales: !!pd.sales,
                }))
              : [],
          });
          // Meta info
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
          setError("Kontrak tidak ditemukan");
        }
        // Fetch customers and products
        const custSnap = await getDocs(collection(firestore, "customers"));
        setCustomers(custSnap.docs.map((d) => ({ ...d.data(), id: d.id })));
      } catch {
        setError("Gagal memuat data kontrak");
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
  }, [id]);

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

        // get products that are already in the contract use legacyProducts
        const legacyProductsSnap = await getDocs(
          query(
            collection(firestore, "products"),
            where("contract", "==", doc(firestore, "contracts", id)),
          ),
        );
        const legacyProducts = legacyProductsSnap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));
        setLegacyProducts(legacyProducts);
        const mergedProducts = [...allProducts, ...legacyProducts];
        // Set all products including legacy
        setProducts(mergedProducts);
        // Filter products that are not already in the contract
        const selectedProductIds = new Set(form.products);
        const filteredProducts = mergedProducts.filter(
          (p) => !selectedProductIds.has(p.id),
        );
        setAvailableProducts(filteredProducts);
      } catch {
        setError("Gagal memuat produk");
      }
    };
    fetchProducts();
  }, [id, form.products]);

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
    setForm({
      ...form,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    if (name === "contractNumber") {
      await checkContractNumberUnique(value);
    }
  };

  // Handle product details change
  const handleProductDetailChange = (
    index: number,
    field: string,
    value: any,
  ) => {
    setForm((prev) => {
      const updatedDetails = [...prev.productDetails];
      let updatedProducts = [...prev.products];

      if (field === "product") {
        // Remove previous product from products array if exists
        const prevProductId = updatedDetails[index]?.product;
        if (prevProductId) {
          updatedProducts = updatedProducts.filter((p) => p !== prevProductId);
        }
        // Add new product if not empty and not already in products
        if (value && !updatedProducts.includes(value)) {
          updatedProducts.push(value);
        }
        updatedDetails[index] = {
          ...updatedDetails[index],
          product: value,
        };
      } else {
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: value,
        };
      }

      // Ensure products only contains products in productDetails
      const currentProductIds = updatedDetails
        .map((pd) => pd.product)
        .filter(Boolean);
      updatedProducts = updatedProducts.filter((pid) =>
        currentProductIds.includes(pid),
      );

      return {
        ...prev,
        productDetails: updatedDetails,
        products: updatedProducts,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Validasi mirip create
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
          docSnap.id !== id &&
          Array.isArray(data.products) &&
          data.products.some((p: any) => p.id === pd.product)
        ) {
          setError("Produk sudah terdaftar di kontrak lain.");
          setLoading(false);
          return;
        }
      }
    }
    // Cek contractNumber unik
    const docsSnap = await getDocs(collection(firestore, "contracts"));
    const exists = docsSnap.docs.some(
      (d) => d.data().contractNumber === form.contractNumber && d.id !== id,
    );
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
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });

      for (const pid of form.products) {
        const productRef = doc(firestore, "products", pid);
        await updateDoc(productRef, {
          contract: doc(firestore, "contracts", id),
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
        });
      }

      // get difference between legacy and updated products
      const removedProducts = legacyProducts.filter(
        (p) => !form.products.includes(p.id),
      );
      
      // Handle removed products
      for (const product of removedProducts) {
        // update field contract in product to null
        await updateDoc(doc(firestore, "products", product.id), {
          contract: null,
        });
      }

      // Handle maintenance regeneration for extended contracts
      if (form.contractType === "maintenance" && form.endDate && originalContractData) {
        try {
          // Check for newly added products
          const newProductIds = form.products.filter(
            pid => !originalContractData.products.includes(pid)
          );
          
          // Generate maintenances for newly added products
          if (newProductIds.length > 0) {
            console.log(`Generating maintenances for ${newProductIds.length} newly added products`);
            await generateMaintenancesForNewProducts(
              id,
              newProductIds,
              new Date(form.startDate),
              new Date(form.endDate)
            );
          }
          
          // Regenerate maintenances if contract dates were extended
          await regenerateMaintenancesForExtendedContract(
            id,
            originalContractData.startDate,
            originalContractData.endDate,
            new Date(form.startDate),
            new Date(form.endDate),
            form.products,
            form.contractType
          );
          
          console.log("Maintenance regeneration completed successfully");
        } catch (maintenanceError) {
          console.error("Failed to regenerate maintenances:", maintenanceError);
          // Continue to contracts page even if maintenance regeneration fails
          // The contract has been updated successfully
        }
      }

      router.push("/admin/contracts");
    } catch (error) {
      console.error("Error updating contract:", error);
      setError("Gagal mengupdate kontrak");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-2 md:p-6 xl:p-7.5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black">
          Edit Kontrak
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Ubah data kontrak sesuai kebutuhan.
        </p>
        {metaInfo && (
          <div className="mt-3 rounded bg-blue-50 px-4 py-2 text-xs text-gray-700">
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
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="ml-3">{error}</div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              No. Kontrak
            </label>
            <input
              name="contractNumber"
              placeholder="No. Kontrak"
              value={form.contractNumber}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                contractNumberError ? "border-red-500" : "border-stroke"
              } bg-transparent px-4 py-2 outline-none focus:border-primary`}
              required
            />
            {contractNumberError && (
              <p className="mt-1 text-xs text-red-600">{contractNumberError}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nama Kontrak
            </label>
            <input
              name="contractName"
              placeholder="Nama Kontrak"
              value={form.contractName}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipe Kontrak
            </label>
            <select
              name="contractType"
              value={form.contractType}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Deskripsi Kontrak
            </label>
            <input
              name="contractDescription"
              placeholder="Deskripsi Kontrak"
              value={form.contractDescription}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pelanggan
            </label>
            <select
              name="customer"
              value={form.customer}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tanggal Mulai
            </label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tanggal Selesai
            </label>
            <input
              name="endDate"
              type="date"
              value={form.endDate ?? undefined}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
              required
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="terminated">Dihentikan</option>
            </select>
          </div>
          {/* Detail produk (dynamic add/remove, sekaligus memilih produk) */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Produk (bisa tambah lebih dari satu)
            </label>
            {form.productDetails.map((pd, index) => (
              <div
                key={index}
                className="mb-4 rounded-lg border border-stroke bg-gray-50 p-4"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Produk
                    </label>
                    <select
                      value={pd.product}
                      onChange={(e) =>
                        handleProductDetailChange(
                          index,
                          "product",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                      required
                    >
                      <option value="">Pilih produk</option>
                      {products
                        .filter(
                          (p) =>
                            // Show if not selected by other productDetails, or if it's the current value
                            !form.productDetails.some(
                              (detail, i) =>
                                detail.product === p.id && i !== index,
                            ) || pd.product === p.id,
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.productNumber} - {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Lokasi
                    </label>
                    <input
                      name="location"
                      placeholder="Lokasi"
                      value={pd.location}
                      onChange={(e) =>
                        handleProductDetailChange(
                          index,
                          "location",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Pemeliharaan
                    </label>
                    <div className="flex items-center">
                      <input
                        name="maintenance"
                        type="checkbox"
                        checked={pd.maintenance}
                        onChange={(e) =>
                          handleProductDetailChange(
                            index,
                            "maintenance",
                            e.target.checked,
                          )
                        }
                        className="mr-2 rounded border-stroke text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        Termasuk pemeliharaan
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Perbaikan
                    </label>
                    <div className="flex items-center">
                      <input
                        name="service"
                        type="checkbox"
                        checked={pd.service}
                        onChange={(e) =>
                          handleProductDetailChange(
                            index,
                            "service",
                            e.target.checked,
                          )
                        }
                        className="mr-2 rounded border-stroke text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        Termasuk perbaikan
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Penyewaan
                    </label>
                    <div className="flex items-center">
                      <input
                        name="rental"
                        type="checkbox"
                        checked={pd.rental}
                        onChange={(e) =>
                          handleProductDetailChange(
                            index,
                            "rental",
                            e.target.checked,
                          )
                        }
                        className="mr-2 rounded border-stroke text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        Termasuk penyewaan
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Penjualan
                    </label>
                    <div className="flex items-center">
                      <input
                        name="sales"
                        type="checkbox"
                        checked={pd.sales}
                        onChange={(e) =>
                          handleProductDetailChange(
                            index,
                            "sales",
                            e.target.checked,
                          )
                        }
                        className="mr-2 rounded border-stroke text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        Termasuk penjualan
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        productDetails: prev.productDetails.filter(
                          (_, i) => i !== index,
                        ),
                        products: prev.products.filter((p) => p !== pd.product),
                      }))
                    }
                    className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    Hapus Produk
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    productDetails: [
                      ...prev.productDetails,
                      {
                        product: "",
                        location: "",
                        maintenance:
                          prev.contractType === "maintenance" ? true : false,
                        service: prev.contractType === "service" ? true : false,
                        rental: prev.contractType === "rental" ? true : false,
                        sales: prev.contractType === "sales" ? true : false,
                      },
                    ],
                  }))
                }
                disabled={loading || availableProducts.length === 0}
                className={
                  "rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90" +
                  (loading || availableProducts.length === 0
                    ? " cursor-not-allowed opacity-50"
                    : "")
                }
              >
                Tambah Produk
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/admin/contracts")}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-100"
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
