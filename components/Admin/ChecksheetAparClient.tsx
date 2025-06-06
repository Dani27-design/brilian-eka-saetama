"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";

interface ChecksheetData {
  id: string;
  type: string;
  [key: string]: any;
}

export default function ChecksheetAparClient() {
  const [checksheets, setChecksheets] = useState<ChecksheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchChecksheets = async () => {
      setIsLoading(true);
      try {
        // Query checksheets with type "checksheet_apar"
        const q = query(
          collection(firestore, "checksheet"),
          where("type", "==", "checksheet_apar"),
        );

        const querySnapshot = await getDocs(q);
        const checksheetData: ChecksheetData[] = [];
        const headersSet = new Set<string>(["id", "actions"]);

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as ChecksheetData;
          checksheetData.push(data);

          // Collect unique field names for table headers
          Object.keys(data).forEach((key) => headersSet.add(key));
        });

        setChecksheets(checksheetData);

        // Remove 'type' from headers as it's always "checksheet_apar"
        headersSet.delete("type");

        // Convert to array and sort for consistent display
        const headersArray = Array.from(headersSet);
        headersArray.sort((a, b) => {
          if (a === "id") return -1;
          if (b === "id") return 1;
          if (a === "actions") return 1;
          if (b === "actions") return -1;
          return a.localeCompare(b);
        });

        setTableHeaders(headersArray);
      } catch (error) {
        console.error("Error fetching checksheets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecksheets();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteDoc(doc(firestore, "checksheet", deleteId));
      setChecksheets(checksheets.filter((item) => item.id !== deleteId));
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setShowDeleteModal(false);
  };

  // Format cell data for display
  const formatCellData = (data: any) => {
    if (data === null || data === undefined) return "-";

    if (typeof data === "boolean") return data ? "Yes" : "No";

    if (typeof data === "object") {
      if (data instanceof Date) return data.toLocaleString();
      return JSON.stringify(data);
    }

    return String(data);
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
            APAR Checksheets
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage all APAR inspection checksheets
          </p>
        </div>
        <Link
          href="/admin/checksheet-apar/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Add New Checksheet
        </Link>
      </div>

      {isLoading ? (
        <div className="h-60 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black">
            <table className="min-w-full divide-y divide-stroke dark:divide-strokedark">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {header === "id" ? "ID" : header.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke bg-white dark:divide-strokedark dark:bg-black">
                {checksheets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableHeaders.length}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No checksheets found
                    </td>
                  </tr>
                ) : (
                  checksheets.map((checksheet) => (
                    <tr key={checksheet.id}>
                      {tableHeaders.map((header) => {
                        if (header === "actions") {
                          return (
                            <td
                              key={`${checksheet.id}-${header}`}
                              className="whitespace-nowrap px-6 py-4 text-sm"
                            >
                              <div className="flex space-x-2">
                                <Link
                                  href={`/admin/checksheet-apar/edit/${checksheet.id}`}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDelete(checksheet.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={`${checksheet.id}-${header}`}
                            className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
                          >
                            {formatCellData(checksheet[header])}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-medium text-black dark:text-white">
                  Confirm Delete
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete this checksheet? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={cancelDelete}
                    className="rounded border border-stroke px-4 py-2 text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
