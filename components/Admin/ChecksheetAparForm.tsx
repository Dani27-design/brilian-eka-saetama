"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, Timestamp, collection } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import JsonEditor from "./JsonEditor";

interface ChecksheetAparFormProps {
  id?: string;
  isEditing: boolean;
}

export default function ChecksheetAparForm({
  id,
  isEditing,
}: ChecksheetAparFormProps) {
  const [formData, setFormData] = useState<any>({
    type: "checksheet_apar",
    name: "",
    location: "",
    inspector: "",
    inspection_date: "",
    status: "passed",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formMode, setFormMode] = useState<"simple" | "json">("simple");
  const [isLoading, setIsLoading] = useState(isEditing);
  const router = useRouter();

  // Fetch data if editing existing checksheet
  useEffect(() => {
    const fetchChecksheet = async () => {
      if (!isEditing || !id) return;

      try {
        const docRef = doc(firestore, "checksheet", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Convert Firestore timestamp to string if it exists
          const formattedData = { ...data };
          if (
            data.inspection_date &&
            data.inspection_date instanceof Timestamp
          ) {
            const date = data.inspection_date.toDate();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            formattedData.inspection_date = `${year}-${month}-${day}`;
          }

          setFormData(formattedData);
        } else {
          console.error("No such document!");
          router.push("/admin/checksheet-apar");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecksheet();
  }, [id, isEditing, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleJsonChange = (newData: any) => {
    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Process the data before saving
      const saveData = { ...formData };

      // Convert inspection_date string to Firestore timestamp
      if (saveData.inspection_date) {
        saveData.inspection_date = Timestamp.fromDate(
          new Date(saveData.inspection_date),
        );
      }

      // Generate an ID if not editing
      const docId = isEditing
        ? id
        : doc(collection(firestore, "checksheet")).id;

      // Save to Firestore
      await setDoc(doc(firestore, "checksheet", docId!), saveData, {
        merge: isEditing,
      });

      // Redirect back to the list
      router.push("/admin/checksheet-apar");
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-60 w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
      <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
        {isEditing ? "Edit" : "Create"} APAR Checksheet
      </h2>

      {/* Form/JSON mode toggle */}
      <div className="mb-6 flex justify-end">
        <div
          className="inline-flex rounded-md border border-gray-300 shadow-sm"
          role="group"
        >
          <button
            type="button"
            onClick={() => setFormMode("simple")}
            className={`px-4 py-2 text-sm font-medium ${
              formMode === "simple"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            }`}
          >
            Form View
          </button>
          <button
            type="button"
            onClick={() => setFormMode("json")}
            className={`px-4 py-2 text-sm font-medium ${
              formMode === "json"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            }`}
          >
            JSON View
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {formMode === "simple" ? (
          <div className="space-y-6">
            {/* Hidden field for type */}
            <input type="hidden" name="type" value="checksheet_apar" />

            {/* Name field */}
            <div>
              <label className="mb-2 block font-medium text-black dark:text-white">
                Name/ID
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
                required
              />
            </div>

            {/* Location field */}
            <div>
              <label className="mb-2 block font-medium text-black dark:text-white">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
                required
              />
            </div>

            {/* Inspector field */}
            <div>
              <label className="mb-2 block font-medium text-black dark:text-white">
                Inspector
              </label>
              <input
                type="text"
                name="inspector"
                value={formData.inspector || ""}
                onChange={handleInputChange}
                className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
                required
              />
            </div>

            {/* Inspection Date field */}
            <div>
              <label className="mb-2 block font-medium text-black dark:text-white">
                Inspection Date
              </label>
              <input
                type="date"
                name="inspection_date"
                value={formData.inspection_date || ""}
                onChange={handleInputChange}
                className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
                required
              />
            </div>

            {/* Status field */}
            <div>
              <label className="mb-2 block font-medium text-black dark:text-white">
                Status
              </label>
              <select
                name="status"
                value={formData.status || "passed"}
                onChange={handleInputChange}
                className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
              >
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Notes field */}
            <div>
              <label className="mb-2 block font-medium text-black dark:text-white">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
              />
            </div>
          </div>
        ) : (
          <div className="min-h-80">
            <label className="mb-2 block font-medium text-black dark:text-white">
              JSON Content
            </label>
            <JsonEditor value={formData} onChange={handleJsonChange} />
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-stroke px-6 py-2 text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:opacity-70"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : isEditing ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
