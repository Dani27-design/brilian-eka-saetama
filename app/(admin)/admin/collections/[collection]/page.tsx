"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useLanguage } from "@/app/context/LanguageContext";
import Link from "next/link";
import { firestore } from "@/db/firebase/firebaseConfig";

export default function CollectionPage({
  params,
}: {
  params: { collection: string };
}) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { language } = useLanguage();
  const router = useRouter();
  const { collection: collectionName } = params;

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDocuments(docs);
      } catch (error) {
        console.error(`Error fetching ${collectionName} documents:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [collectionName, language]);

  const handleDelete = async (docId: string) => {
    try {
      await deleteDoc(doc(firestore, collectionName, docId));
      setDocuments(documents.filter((doc) => doc.id !== docId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error(`Error deleting document:`, error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize text-black dark:text-white">
            {collectionName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage {collectionName} content
          </p>
        </div>

        <Link
          href={`/admin/collections/${collectionName}/create`}
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Add New
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-black">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-stroke bg-gray-50 dark:border-strokedark dark:bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Document ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-black dark:text-white">
                        {doc.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {typeof doc.en === "string" ? (
                          <div className="max-w-xs truncate">
                            {doc[language]}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">
                            {JSON.stringify(doc[language] || doc).substring(
                              0,
                              100,
                            )}
                            ...
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/admin/collections/${collectionName}/edit/${doc.id}`}
                            className="text-blue-500 hover:underline"
                          >
                            Edit
                          </Link>
                          {deleteConfirm === doc.id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-500 hover:underline"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-gray-500 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(doc.id)}
                              className="text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No documents found in this collection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
