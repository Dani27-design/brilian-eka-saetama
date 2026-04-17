"use client";
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  serverTimestamp,
  getDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/app/context/AdminContext";
import { ProductType } from "@/types/product";
import Link from "next/link";
import { usePageHeader } from "@/app/context/PageHeaderContext";

type Contract = {
  id: string;
  contractNumber: string;
  contractName: string;
  products: any[];
};

type Product = {
  id: string;
  productNumber: string;
  name: string;
  productType: ProductType;
};

type MaintenanceStatus =
  | "pending"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

export default function CreateMaintenancePage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [engineers, setEngineers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [searchEngineer, setSearchEngineer] = useState("");
  const [showEngineerDropdown, setShowEngineerDropdown] = useState(false);
  const [form, setForm] = useState({
    contract: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user } = useAdmin();

  usePageHeader("Tambah Jadwal Maintenance", "Pilih kontrak dan tanggal untuk membuat jadwal maintenance.");

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const snap = await getDocs(collection(firestore, "contracts"));
        const contractList: Contract[] = [];

        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          contractList.push({
            id: docSnap.id,
            contractNumber: data.contractNumber || "",
            contractName: data.contractName || "",
            products: data.products || [],
          });
        }

        setContracts(contractList);
      } catch (err) {
        setError("Gagal memuat data kontrak");
      }
    };

    fetchContracts();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!form.contract) {
        setSelectedProducts([]);
        return;
      }

      try {
        const contractRef = doc(firestore, "contracts", form.contract);
        const contractSnap = await getDoc(contractRef);

        if (!contractSnap.exists()) {
          setError("Kontrak tidak ditemukan");
          return;
        }

        const contractData = contractSnap.data();
        
        // Check if contract type is "maintenance" - prevent manual creation
        if (contractData.contractType === "maintenance") {
          setError(
            "Maintenances untuk kontrak maintenance dibuat otomatis oleh sistem. " +
            "Tidak dapat membuat maintenance manual untuk jenis kontrak ini."
          );
          setSelectedProducts([]);
          return;
        }
        
        const productRefs = contractData.products || [];

        if (!productRefs.length) {
          setError("Kontrak tidak memiliki produk");
          return;
        }

        const products: Product[] = [];

        for (const prodRef of productRefs) {
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data() as Product;
            products.push({
              id: prodSnap.id,
              productNumber: prodData.productNumber || "",
              name: prodData.name || "",
              productType: prodData.productType || "unknown",
            });
          }
        }

        setSelectedProducts(products);
        setError("");
      } catch (err: any) {
        setError(err.message || "Gagal memuat produk");
      }
    };

    fetchProducts();
  }, [form.contract]);

  // Add this useEffect to fetch engineers
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const engSnap = await getDocs(
          query(
            collection(firestore, "users"),
            where("role", "==", "engineer"),
          ),
        );
        const engineersList = engSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || d.id,
        }));
        setEngineers(engineersList);
      } catch (err) {
        console.error("Gagal menampilkan teknisi:", err);
      }
    };

    fetchEngineers();
  }, []);

  // Add functions to handle engineers
  const addEngineer = (engineerId: string) => {
    if (!selectedEngineers.includes(engineerId)) {
      setSelectedEngineers([...selectedEngineers, engineerId]);
    }
    setSearchEngineer("");
    setShowEngineerDropdown(false);
  };

  const removeEngineer = (engineerId: string) => {
    setSelectedEngineers(selectedEngineers.filter((id) => id !== engineerId));
  };

  // Filter engineers based on search input
  const filteredEngineers = engineers.filter(
    (engineer) =>
      engineer.name.toLowerCase().includes(searchEngineer.toLowerCase()) &&
      !selectedEngineers.includes(engineer.id),
  );

  // Get selected engineers with their names
  const displaySelectedEngineers = selectedEngineers.map((id) => {
    const engineer = engineers.find((e) => e.id === id);
    return {
      id,
      name: engineer?.name || id,
    };
  });

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

    if (selectedProducts.length === 0) {
      setError("Kontrak tidak memiliki produk atau produk belum dimuat.");
      setLoading(false);
      return;
    }

    try {
      const contractRef = doc(firestore, "contracts", form.contract);
      
      // Double-check contract type to prevent manual maintenance creation
      const contractSnap = await getDoc(contractRef);
      if (contractSnap.exists()) {
        const contractData = contractSnap.data();
        if (contractData.contractType === "maintenance") {
          setError(
            "Maintenances untuk kontrak maintenance dibuat otomatis oleh sistem. " +
            "Tidak dapat membuat maintenance manual untuk jenis kontrak ini."
          );
          setLoading(false);
          return;
        }
      }

      // Convert form dates to Date objects for comparison
      const newStartDate = new Date(form.startDate);
      const newEndDate = new Date(form.endDate);

      // Create Timestamp objects for Firestore query
      const newStartTimestamp = Timestamp.fromDate(newStartDate);
      const newEndTimestamp = Timestamp.fromDate(newEndDate);

      // Query for existing maintenances for the same contract
      // We can only use one inequality filter in Firestore.
      // So, we'll query for maintenances that *could* overlap
      // (i.e., their startDate is before or on the newEndDate)
      // and then filter more precisely on the client side.
      const q = query(
        collection(firestore, "maintenances"),
        where("contract", "==", contractRef),
        where("startDate", "<=", newEndTimestamp),
      );

      const querySnapshot = await getDocs(q);

      // Client-side check for actual date overlaps
      const isOverlap = querySnapshot.docs.some((docSnap) => {
        const existingMaintenance = docSnap.data();
        const existingStartDate = (
          existingMaintenance.startDate as Timestamp
        ).toDate();
        const existingEndDate = (
          existingMaintenance.endDate as Timestamp
        ).toDate();

        // Check for overlap: [newStartDate, newEndDate] overlaps with [existingStartDate, existingEndDate]
        // if newStartDate <= existingEndDate AND newEndDate >= existingStartDate
        return (
          newStartDate <= existingEndDate && newEndDate >= existingStartDate
        );
      });

      if (isOverlap) {
        setError(
          "Maintenance untuk kontrak ini sudah ada dalam periode yang dipilih atau terjadi tumpang tindih tanggal.",
        );
        setLoading(false);
        return;
      }

      // Create maintenance for each product
      await Promise.all(
        selectedProducts.map(async (product) => {
          const productRef = doc(firestore, "products", product.id);

          // Determine status based on whether engineers are assigned
          const status: MaintenanceStatus =
            selectedEngineers.length > 0 ? "scheduled" : "pending";

          await addDoc(collection(firestore, "maintenances"), {
            contract: contractRef,
            product: productRef,
            productType: product.productType,
            engineer:
              selectedEngineers.length > 0
                ? selectedEngineers.map((engId) =>
                    doc(firestore, "users", engId),
                  )
                : null,
            inspection: null,
            status: status,
            startDate: newStartDate, // Use Date object, Firestore will convert to Timestamp
            endDate: newEndDate, // Use Date object, Firestore will convert to Timestamp
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
    <div className="flex h-full flex-col">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/admin/maintenances"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Maintenance
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

      {/* Maintenance Form Container */}
      <div className="styled-scrollbar flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kontrak
            </label>
            <select
              name="contract"
              value={form.contract}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Produk yang akan dijadwalkan
            </label>
            <div className="rounded-lg border border-stroke bg-gray-50 p-3">
              {selectedProducts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Pilih kontrak terlebih dahulu untuk melihat produk
                </p>
              ) : (
                <ul className="max-h-32 overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <li key={product.id} className="mb-1 text-sm">
                      {product.productNumber} - {product.name}
                      <span className="ml-2 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                        {product.productType}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tanggal Mulai
            </label>
            <input
              type="date"
              name="startDate"
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
              type="date"
              name="endDate"
              value={form.endDate}
              min={
                form.startDate
                  ? new Date(new Date(form.startDate).getTime() + 86400000)
                      .toISOString()
                      .split("T")[0]
                  : undefined
              }
              disabled={!form.startDate}
              onChange={handleChange}
              className={
                "w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary" +
                (!form.startDate ? " opacity-50" : "")
              }
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Teknisi
            </label>
            <div className="mb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari teknisi..."
                  value={searchEngineer}
                  onChange={(e) => {
                    setSearchEngineer(e.target.value);
                    setShowEngineerDropdown(true);
                  }}
                  onFocus={() => setShowEngineerDropdown(true)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary"
                />
                {showEngineerDropdown && filteredEngineers.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {filteredEngineers.map((engineer) => (
                      <div
                        key={engineer.id}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                        onClick={() => addEngineer(engineer.id)}
                      >
                        {engineer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Pilih satu atau lebih teknisi untuk pemeliharaan
              </div>
            </div>

            {/* Selected engineers */}
            {displaySelectedEngineers.length > 0 && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Teknisi yang dipilih:
                </label>
                <div className="flex flex-wrap gap-2">
                  {displaySelectedEngineers.map((engineer) => (
                    <span
                      key={engineer.id}
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                    >
                      {engineer.name}
                      <button
                        type="button"
                        onClick={() => removeEngineer(engineer.id)}
                        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/maintenances"
              className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Maintenance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
