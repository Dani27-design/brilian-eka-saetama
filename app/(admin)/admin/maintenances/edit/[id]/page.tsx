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
import Image from "next/image";

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
  const [inspectorInfo, setInspectorInfo] = useState<
    {
      label: string;
      date?: string;
      user?: { name?: string; role?: string };
    }[]
  >([]);

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

        if (data.inspection?.updatedAt && data.inspection.updatedBy) {
          fetchInspectorMeta(
            data.inspection.updatedBy,
            data.inspection?.updatedAt,
            "Di revisi oleh",
          );
        }
        if (data.inspection?.createdAt && data.inspection.createdBy) {
          fetchInspectorMeta(
            data.inspection.createdBy,
            data.inspection?.createdAt,
            "Di inspeksi oleh",
          );
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

    const fetchInspectorMeta = async (
      userRef: any,
      date: any,
      label: string,
    ) => {
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
        const formattedDate = date?.toDate
          ? date.toDate().toLocaleString()
          : "-";

        setInspectorInfo((prev) => {
          const newItem = { label, date: formattedDate, user };
          // Check if item already exists
          const exists = prev.some(
            (item) =>
              item.label === newItem.label &&
              item.date === newItem.date &&
              item.user?.name === newItem.user?.name &&
              item.user?.role === newItem.user?.role,
          );

          if (!exists) {
            const updated = [...prev, newItem];
            // Sort by date descending
            return updated.sort(
              (a, b) =>
                new Date(b.date || 0).getTime() -
                new Date(a.date || 0).getTime(),
            );
          }
          return prev;
        });
      } catch {
        setInspectorInfo((prev) => {
          const newItem = { label, date: "-", user: { name: "-", role: "-" } };
          // Check if item already exists
          const exists = prev.some(
            (item) =>
              item.label === newItem.label &&
              item.date === newItem.date &&
              item.user?.name === newItem.user?.name &&
              item.user?.role === newItem.user?.role,
          );

          if (!exists) {
            const updated = [...prev, newItem];
            // Sort by date descending
            return updated.sort(
              (a, b) =>
                new Date(b.date || 0).getTime() -
                new Date(a.date || 0).getTime(),
            );
          }
          return prev;
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
        console.error("Gagal memuat teknisi:", err);
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

  // Function to handle checklist item changes (status and remarks)
  const handleChecklistChange = (
    index: number,
    field: "status" | "remarks",
    value: boolean | string,
  ) => {
    if (!form || !form.inspection || !user?.uid) return; // Ensure user is available for updatedBy

    const updatedChecklist = [...form.inspection.checklist];
    const itemToUpdate = { ...updatedChecklist[index] };

    if (field === "status") {
      itemToUpdate.status = value as boolean;
    } else if (field === "remarks") {
      itemToUpdate.remarks = value as string;
    }

    updatedChecklist[index] = itemToUpdate;

    setForm((prevForm: any) => {
      if (!prevForm || !prevForm.inspection) return prevForm;
      return {
        ...prevForm,
        inspection: {
          ...prevForm.inspection,
          checklist: updatedChecklist,
          updatedAt: serverTimestamp(), // Update inspection's updatedAt
          updatedBy: doc(firestore, "users", user.uid), // Update inspection's updatedBy
        },
      };
    });
  };

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

      const updateData: { [key: string]: any } = {
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        status: newStatus,
        engineer: form.engineer.map((uid: string) =>
          doc(firestore, "users", uid),
        ),
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      };

      // Only update inspection data if it exists and has been modified
      if (form.inspection) {
        updateData.inspection = {
          ...form.inspection,
          // Ensure createdAt and createdBy are not overwritten if they exist
          createdAt: form.inspection.createdAt || serverTimestamp(),
          createdBy:
            form.inspection.createdBy ||
            (user?.uid ? doc(firestore, "users", user.uid) : null),
          // Photos are not editable by admin, so they remain as is
          photos: form.inspection.photos || [],
        };
      }

      await updateDoc(doc(firestore, "maintenances", id), updateData);

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
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={form.inspection ? false : true}
              className={
                form.inspection
                  ? "w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  : "w-full rounded-lg border border-stroke bg-gray-200 px-4 py-2 text-gray-700 dark:border-strokedark dark:bg-gray-800 dark:text-gray-400"
              }
              required
            >
              <option value="pending">Tertunda</option>
              <option value="scheduled">Dijadwalkan</option>
              <option value="waiting_approval">Menunggu Disetujui</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
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
                "w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:text-white" +
                (!form.startDate ? " opacity-50" : "")
              }
              required
            />
          </div>

          <div className="md:col-span-2">
            {!form.inspection && (
              <>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teknisi
                </label>
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari teknisi..."
                      value={searchEngineer}
                      onChange={(e) => {
                        if (!form.inspection) {
                          setSearchEngineer(e.target.value);
                          setShowEngineerDropdown(true);
                        }
                      }}
                      onFocus={() => {
                        if (!form.inspection) {
                          setShowEngineerDropdown(true);
                        }
                      }}
                      disabled={!!form.inspection}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-strokedark dark:text-white dark:disabled:bg-gray-700"
                    />
                    {showEngineerDropdown &&
                      filteredEngineers.length > 0 &&
                      !form.inspection && (
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
                    Pilih satu atau lebih teknisi
                  </div>
                </div>
              </>
            )}

            {/* Selected engineers */}
            {selectedEngineers.length > 0 && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teknisi yang dipilih:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedEngineers.map((engineer) => (
                    <span
                      key={engineer.id}
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {engineer.name}
                      {!form.inspection && (
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
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {form.inspection && (
          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold text-black dark:text-white">
              Data Inspeksi
            </h3>
            <div className="dark:bg-boxdark rounded-lg border border-stroke bg-white p-4 dark:border-strokedark">
              {inspectorInfo?.map((info, index) => (
                <div
                  key={index}
                  className="mb-2 mt-0 rounded bg-blue-50 px-4 py-2 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {info.label}{" "}
                  {info.user?.name && (
                    <span>
                      <b>{info.user.name}</b>
                      {info.user.role ? ` (${info.user.role})` : ""}
                    </span>
                  )}
                  {info.date && <span className="ml-2">{info.date}</span>}
                </div>
              ))}

              {/* Photos Section (Read-only) */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Foto Inspeksi:
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.inspection.photos &&
                  form.inspection.photos.length > 0 ? (
                    form.inspection.photos.map(
                      (photoUrl: string, photoIdx: number) => (
                        <div key={photoIdx} className="group relative">
                          <Image
                            src={photoUrl}
                            alt={`Inspection photo ${photoIdx + 1}`}
                            width={96}
                            height={96}
                            className="h-24 w-24 rounded-md object-cover shadow-sm"
                          />
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-gray-500">Tidak ada foto.</p>
                  )}
                </div>
              </div>

              {/* Checklist Section (Editable) */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Checklist Inspeksi
                  </h4>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {form.inspection.checklist?.length || 0} Item
                  </span>
                </div>

                {form.inspection.checklist?.length ? (
                  <div className="space-y-4">
                    {form.inspection.checklist.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`rounded-lg border ${
                          item.status
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                        } p-4 shadow-sm`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h5 className="font-medium text-gray-800 dark:text-white">
                            {item.item}
                          </h5>
                          <div className="flex items-center gap-2">
                            <label className="relative inline-flex cursor-pointer items-center">
                              <input
                                type="checkbox"
                                checked={item.status}
                                onChange={(e) =>
                                  handleChecklistChange(
                                    idx,
                                    "status",
                                    e.target.checked,
                                  )
                                }
                                className="peer sr-only"
                              />
                              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:border-gray-600 dark:bg-gray-700"></div>
                              <span
                                className={`ml-2 text-sm font-medium ${
                                  item.status
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                                }`}
                              >
                                {item.status ? "Baik" : "Tidak Baik"}
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="relative">
                          <label
                            className={`mb-1 block text-sm font-medium ${
                              item.status
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            Catatan
                          </label>
                          <textarea
                            value={item.remarks || ""}
                            onChange={(e) =>
                              handleChecklistChange(
                                idx,
                                "remarks",
                                e.target.value,
                              )
                            }
                            placeholder={
                              item.status
                                ? "Tambahkan catatan (opsional)"
                                : "Deskripsikan masalah yang ditemukan"
                            }
                            rows={2}
                            className={`block w-full rounded-lg border ${
                              item.status
                                ? "border-green-200 focus:border-green-500 focus:ring-green-500 dark:border-green-800"
                                : "border-red-200 focus:border-red-500 focus:ring-red-500 dark:border-red-800"
                            } bg-white p-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400`}
                          />
                          <div
                            className={`mt-1 text-xs ${
                              item.status
                                ? "text-green-500 dark:text-green-400"
                                : "text-red-500 dark:text-red-400"
                            }`}
                          >
                            {item.status
                              ? "Kondisi baik, catatan bersifat opsional"
                              : "Wajib diisi untuk kondisi tidak baik"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-stroke bg-gray-50 p-6 text-center dark:border-strokedark dark:bg-gray-700">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h5 className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tidak ada item checklist
                    </h5>
                  </div>
                )}
              </div>
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
