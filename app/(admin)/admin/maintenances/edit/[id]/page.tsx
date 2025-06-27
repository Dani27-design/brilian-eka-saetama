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
import { Maintenance, MaintenanceStatus } from "@/types/maintenances";
import { ProductType } from "@/types/product";

type UserMeta = {
  name?: string;
  role?: string;
};

type MaintenanceFormData = {
  id: string;
  contract: any;
  product: any;
  productType: ProductType;
  engineer: string[];
  status: MaintenanceStatus;
  startDate: string;
  endDate: string;
  inspection: Maintenance["inspection"];
};

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAdmin();

  const [form, setForm] = useState<MaintenanceFormData | null>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableEngineers, setAvailableEngineers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [searchEngineer, setSearchEngineer] = useState("");
  const [showEngineerDropdown, setShowEngineerDropdown] = useState(false);

  const [metaInfo, setMetaInfo] = useState<{
    label: string;
    date?: string;
    user?: { name?: string; role?: string };
  } | null>(null);

  const [contractDetails, setContractDetails] = useState({
    number: "",
    name: "",
  });

  const [productDetails, setProductDetails] = useState({
    number: "",
    name: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Maintenance
        const docRef = doc(firestore, "maintenances", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) throw new Error("Maintenance tidak ditemukan");

        const data = docSnap.data() as Maintenance;

        // Get contract details
        let contractNum = "";
        let contractName = "";
        if (data.contract) {
          const contractSnap = await getDoc(data.contract);
          if (contractSnap.exists()) {
            const contractData = contractSnap.data();
            contractNum = contractData.contractNumber || "";
            contractName = contractData.contractName || "";
            setContractDetails({
              number: contractNum,
              name: contractName,
            });
          }
        }

        // Get product details
        let productNum = "";
        let productName = "";
        let productType = "";
        if (data.product) {
          const productSnap = await getDoc(data.product);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            productNum = productData.productNumber || "";
            productName = productData.name || "";
            productType = productData.productType || "";
            setProductDetails({
              number: productNum,
              name: productName,
            });
          }
        }

        setForm({
          id: docSnap.id,
          contract: data.contract,
          product: data.product,
          productType: productType as any,
          engineer: data.engineer
            ? data.engineer.map((ref: any) => ref.id)
            : [],
          status: data.status,
          startDate: data.startDate?.toDate
            ? data.startDate.toDate().toISOString().slice(0, 10)
            : "",
          endDate: data.endDate?.toDate
            ? data.endDate.toDate().toISOString().slice(0, 10)
            : "",
          inspection: data.inspection,
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
        setAvailableEngineers(engineersList);
      } catch (err) {
        console.error("Failed to load engineers:", err);
      }
    };

    fetchEngineers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (!form) return;
    setForm({ ...form, [name]: value });
  };

  const handleEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!form) return;
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value,
    );
    setForm({ ...form, engineer: selected });
  };

  // Add this function to handle adding an engineer
  const addEngineer = (engineerId: string) => {
    if (!form) return;
    if (!form.engineer.includes(engineerId)) {
      setForm({
        ...form,
        engineer: [...form.engineer, engineerId],
      });
    }
    setSearchEngineer("");
    setShowEngineerDropdown(false);
  };

  // Add this function to handle removing an engineer
  const removeEngineer = (engineerId: string) => {
    if (!form) return;
    setForm({
      ...form,
      engineer: form.engineer.filter((id) => id !== engineerId),
    });
  };

  // Filter engineers based on search input
  const filteredEngineers = availableEngineers.filter(
    (engineer) =>
      engineer.name.toLowerCase().includes(searchEngineer.toLowerCase()) &&
      !form?.engineer.includes(engineer.id),
  );

  // Get selected engineers with their names
  const selectedEngineers =
    form?.engineer.map((id) => {
      const engineer = availableEngineers.find((e) => e.id === id);
      return {
        id,
        name: engineer?.name || id,
      };
    }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setLoading(true);
    setError("");

    try {
      // Check if status should be updated based on engineer selection
      let newStatus = form.status;

      // If engineers are assigned and status is pending, update to scheduled
      if (form.engineer.length > 0 && form.status === "pending") {
        newStatus = "scheduled";
      }

      // If no engineers are assigned and status is scheduled, revert to pending
      if (form.engineer.length === 0 && form.status === "scheduled") {
        newStatus = "pending";
      }

      await updateDoc(doc(firestore, "maintenances", id), {
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        status: newStatus,
        engineer: form.engineer.map((uid: string) =>
          doc(firestore, "users", uid),
        ),
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });

      router.push("/admin/maintenances");
    } catch (err: any) {
      setError(err.message || "Gagal mengupdate maintenance");
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
              value={`${contractDetails.number} - ${contractDetails.name}`}
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2 text-gray-500 dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Produk
            </label>
            <input
              value={`${productDetails.number} - ${productDetails.name}`}
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2 text-gray-500 dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipe Produk
            </label>
            <input
              value={form.productType}
              disabled
              className="w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2 text-gray-500 dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status Inspeksi
            </label>
            <input
              value={form.inspection ? "Sudah diinspeksi" : "Belum diinspeksi"}
              disabled
              className={`w-full rounded-lg border px-4 py-2 ${
                form.inspection
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
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
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="waiting_approval">Waiting Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Engineer
            </label>
            <div className="mb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari engineer..."
                  value={searchEngineer}
                  onChange={(e) => {
                    setSearchEngineer(e.target.value);
                    setShowEngineerDropdown(true);
                  }}
                  onFocus={() => setShowEngineerDropdown(true)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
                />
                {showEngineerDropdown && filteredEngineers.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {filteredEngineers.map((engineer) => (
                      <div
                        key={engineer.id}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => addEngineer(engineer.id)}
                      >
                        {engineer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Pilih satu atau lebih engineer (opsional)
              </div>
            </div>

            {/* Selected engineers */}
            {selectedEngineers.length > 0 && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Engineer yang dipilih:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedEngineers.map((engineer) => (
                    <span
                      key={engineer.id}
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {engineer.name}
                      <button
                        type="button"
                        onClick={() => removeEngineer(engineer.id)}
                        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
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

        {form.inspection && (
          <div className="mb-6">
            <h3 className="mb-3 text-base font-medium text-gray-700 dark:text-gray-300">
              Data Inspeksi
            </h3>
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-800">
              <div className="mb-3 text-sm">
                <div className="mb-2">
                  <strong>Tanggal Inspeksi:</strong>{" "}
                  {form.inspection.createdAt?.toDate
                    ? form.inspection.createdAt.toDate().toLocaleString()
                    : "-"}
                </div>

                <div className="mb-2">
                  <strong>Jumlah Foto:</strong>{" "}
                  {form.inspection.photos?.length || 0} foto
                </div>

                <div>
                  <strong>Checklist:</strong>{" "}
                  {form.inspection.checklist?.length
                    ? `${form.inspection.checklist.length} item`
                    : "Tidak ada item"}
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Catatan: Data inspeksi hanya dapat diubah oleh engineer melalui
                aplikasi mobile.
              </p>
            </div>
          </div>
        )}

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
